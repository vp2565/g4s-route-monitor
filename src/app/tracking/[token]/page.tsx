"use client";

import { PrototypeBanner } from "@/components/layout/prototype-banner";
import { Shield, MapPin } from "lucide-react";

export default function TrackingPage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PrototypeBanner />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="h-8 w-8 text-g4s-red" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              G<span className="text-g4s-red">4</span>S{" "}
              <span className="text-gray-400 font-normal">Telematix</span>
            </span>
          </div>
          <MapPin className="h-16 w-16 mx-auto text-gray-300" />
          <div>
            <h2 className="text-lg font-semibold text-gray-600">
              OEM Partner Tracking View
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Read-only branded tracking for token:{" "}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {params.token}
              </code>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Shareable consignment tracking — coming in a future session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
