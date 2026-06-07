import { NextResponse } from "next/server";
import {
  confirmMissionFunding as confirmMissionFundingTransfer,
  listMissionFundingConfigs,
  proposeMissionFunding,
  type MissionFundingNotification,
} from "@leclerc/transfers";
import { sendDrop } from "@/lib/p2p/deaddrop";

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
        return NextResponse.json(await confirmMissionFundingRequest(body));
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
  const result = proposeMissionFunding({
    seed: body.seed,
    missionId: body.missionId,
    amount: body.amount,
    env: process.env,
  });
  if (result.status === "requires_confirmation") return result;
  recordMissionEvent(result.notification);
  const peers = await sendNotification(body.dropId, body.secret, result.notification);
  return { notification: result.notification, peers };
}

async function confirmMissionFundingRequest(body: Extract<MissionFundingRequest, { action: "confirm" }>) {
  const notification = await confirmMissionFundingTransfer(body.confirmId ?? "");
  recordMissionEvent(notification);
  const peers = await sendNotification(body.dropId, body.secret, notification);
  return { notification, peers };
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
