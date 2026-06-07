import { NextResponse } from "next/server";
import {
  getLeclercAsset,
  getMissionFundingConfig,
  listMissionFundingConfigs,
  type MissionFundingNotification,
} from "@leclerc/core";
import { paySableEvm } from "@/lib/wallet";
import { sendDrop } from "@/lib/p2p/deaddrop";

export const runtime = "nodejs";

type MissionFundingRequest =
  | { action: "list" }
  | { action: "events" }
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
    const atomic = amountToAtomic(amount, mission.assetId);
    const result = await paySableEvm(seed, target, atomic, mission.assetId, mission.chainId);
    notification = createNotification({
      missionId: mission.missionId,
      assetId: mission.assetId,
      chainId: mission.chainId,
      amount,
      status: "submitted",
      hash: result.hash,
    });
  }

  missionEvents.push(notification);
  if (missionEvents.length > 100) missionEvents.splice(0, missionEvents.length - 100);
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

function amountToAtomic(input: string, assetId: MissionFundingNotification["assetId"]): string {
  const asset = getLeclercAsset(assetId);
  if (!/^\d+(\.\d+)?$/.test(input)) throw new Error("amount must be a positive decimal");
  const [wholeRaw = "0", fractionRaw = ""] = input.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fractionRaw.slice(0, asset.decimals).padEnd(asset.decimals, "0");
  const atomic = `${whole}${fraction}`.replace(/^0+(?=\d)/, "");
  if (atomic === "0") throw new Error("amount must be greater than zero");
  return atomic;
}
