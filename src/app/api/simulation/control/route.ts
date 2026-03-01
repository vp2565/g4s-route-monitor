import { NextRequest, NextResponse } from "next/server";
import { simulationEngine } from "@/lib/simulation";

export const dynamic = "force-dynamic";

interface ControlBody {
  action: "start" | "pause" | "reset" | "setSpeed";
  speed?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ControlBody;

    switch (body.action) {
      case "start":
        simulationEngine.start();
        break;
      case "pause":
        simulationEngine.pause();
        break;
      case "reset":
        simulationEngine.reset();
        break;
      case "setSpeed": {
        const speed = body.speed ?? 1;
        if (![1, 5, 10, 20].includes(speed)) {
          return NextResponse.json(
            { error: "Invalid speed. Use 1, 5, 10, or 20." },
            { status: 400 }
          );
        }
        simulationEngine.setSpeed(speed);
        break;
      }
      default:
        return NextResponse.json(
          { error: "Invalid action. Use start, pause, reset, or setSpeed." },
          { status: 400 }
        );
    }

    const state = simulationEngine.getState();
    return NextResponse.json({ ok: true, state });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function GET() {
  const state = simulationEngine.getState();
  return NextResponse.json({ state });
}
