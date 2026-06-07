import { NextResponse } from "next/server";
import {
  getMissionFundingConfig,
  listMissionFundingConfigs,
  type MissionFundingNotification,
} from "@leclerc/core";
import { sendDrop } from "@/lib/p2p/deaddrop";
import { confirmTransfer, proposeTransfer } from "@/lib/wallet/transfer-confirmation";

export const runtime = "nodejs";

type MissionFundingRequest =
  | { action: "list" }
  | { action: "events" }
  | { action: "confirm"; confirmId?: string; dropId?: string; secret?: string }
  | {
      action: "fund";
      seed?: string;
      missionId?: string;
      amount?: string;
      dropId?: string;
      secret?: string;
    };

const missionEvents: MissionFundingNotification[] = [];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MissionFundingRequest;
    switch (body.action) {
      case "list":
        return NextResponse.json({ missions: listMissionFundingConfigs() });
      case "events":
        return NextResponse.json({ events: [...missionEvents].reverse().slice(0, 20) });
      case "fund":
        return NextResponse.json(await fundMission(body));
      case "confirm":
        return NextResponse.json(await confirmMissionFunding(body));
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "mission funding failed" },
      { status: 500 },
    );
  }
}

async function fundMission(body: Extract<MissionFundingRequest, { action: "fund" }>) {
  const missionId = body.missionId?.trim() || "raven";
  const mission = getMissionFundingConfig(missionId);
  if (!mission) throw new Error("unknown mission");

  const amount = body.amount?.trim() || mission.defaultAmount;
  const target = process.env[mission.fundingTargetEnv]?.trim();
  let notification: MissionFundingNotification;

  if (!target || target === "0x0000000000000000000000000000000000000000") {
    notification = createNotification({
      missionId: mission.missionId,
      assetId: mission.assetId,
      chainId: mission.chainId,
      amount,
      status: "blocked",
      reason: `${mission.fundingTargetEnv} is not configured`,
    });
  } else {
    const seed = body.seed?.trim();
    if (!seed) throw new Error("wallet seed required");
    const proposal = proposeTransfer({
      seed,
      to: target,
      amount,
      assetId: mission.assetId,
      chainId: mission.chainId,
      purpose: "mission-funding",
      metadata: { missionId: mission.missionId },
    });
    return { status: "requires_confirmation", proposal };
  }

  recordMissionEvent(notification);
  const peers = await sendNotification(body.dropId, body.secret, notification);
  return { notification, peers };
}

async function confirmMissionFunding(body: Extract<MissionFundingRequest, { action: "confirm" }>) {
  const confirmId = body.confirmId?.trim();
  if (!confirmId) throw new Error("confirmId required");
  const result = await confirmTransfer(confirmId);
  if (result.proposal.purpose !== "mission-funding") throw new Error("confirmation is not for mission funding");
  const missionId = String(result.proposal.metadata?.missionId ?? "");
  const mission = getMissionFundingConfig(missionId);
  if (!mission) throw new Error("unknown mission");
  const notification = createNotification({
    missionId: mission.missionId,
    assetId: result.proposal.assetId,
    chainId: result.proposal.chainId,
    amount: result.proposal.amount,
    status: "submitted",
    hash: result.hash,
  });
  recordMissionEvent(notification);
  const peers = await sendNotification(body.dropId, body.secret, notification);
  return { notification, peers };
}

function createNotification(input: Omit<MissionFundingNotification, "id" | "kind" | "createdAt">) {
  return {
    id: `fund-${input.missionId}-${Date.now()}`,
    kind: "mission_funding",
    createdAt: new Date().toISOString(),
    ...input,
  } satisfies MissionFundingNotification;
}

async function sendNotification(
  dropId: string | undefined,
  secret: string | undefined,
  notification: MissionFundingNotification,
): Promise<number> {
  if (!dropId || !secret) return 0;
  try {
    const res = await sendDrop(dropId, "notification", notification, secret);
    return res.peers;
  } catch {
    return 0;
  }
}

function recordMissionEvent(notification: MissionFundingNotification) {
  missionEvents.push(notification);
  if (missionEvents.length > 100) missionEvents.splice(0, missionEvents.length - 100);
}
