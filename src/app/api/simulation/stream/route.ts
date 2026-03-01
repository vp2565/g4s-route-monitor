import { simulationEngine } from "@/lib/simulation";
import type { SimulationEvent } from "@/lib/simulation";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial state
      const state = simulationEngine.getState();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "state", ...state })}\n\n`)
      );

      // Subscribe to simulation events
      const unsubscribe = simulationEngine.subscribe(
        (events: SimulationEvent[]) => {
          try {
            for (const event of events) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            }
          } catch {
            // Client disconnected
            unsubscribe();
          }
        }
      );

      // Send heartbeat every 10s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const currentState = simulationEngine.getState();
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "heartbeat", tick: currentState.tick, running: currentState.running, speed: currentState.speed, simulatedTime: currentState.simulatedTime })}\n\n`
            )
          );
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 10000);

      // Cleanup when client disconnects
      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      // AbortSignal doesn't directly work here, but the error catch handles disconnect
      // Store cleanup for external use if needed
      (controller as unknown as Record<string, unknown>)._cleanup = cleanup;
    },
    cancel() {
      // Stream cancelled by client
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
