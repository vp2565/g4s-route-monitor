"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DEMO_USERS, ROLE_COLORS, DemoUser } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PrototypeBanner } from "@/components/layout/prototype-banner";
import { Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/map");
    }
  }, [user, router]);

  const handleLogin = (demoUser: DemoUser) => {
    login(demoUser);
    router.push("/map");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <PrototypeBanner />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-g4s-red" />
            <h1 className="text-3xl font-bold text-white tracking-tight">
              G<span className="text-g4s-red">4</span>S{" "}
              <span className="text-gray-400 font-normal">Telematix</span>
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Route Monitoring Platform
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Select a demo user to explore the platform
          </p>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
          {DEMO_USERS.map((demoUser) => (
            <Card
              key={demoUser.id}
              onClick={() => handleLogin(demoUser)}
              className="cursor-pointer bg-gray-950 border-gray-800 hover:border-g4s-red/50 hover:bg-gray-900 transition-all duration-200 group"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-gray-800 text-gray-200 text-sm font-semibold group-hover:bg-g4s-red/20 group-hover:text-g4s-red transition-colors">
                      {demoUser.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {demoUser.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-1.5 text-[10px] font-medium border-none",
                        ROLE_COLORS[demoUser.role]
                      )}
                    >
                      {demoUser.roleLabel}
                    </Badge>
                    <p className="text-gray-500 text-xs mt-2 truncate">
                      {demoUser.customer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center gap-2 text-gray-600 text-xs">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>This is a prototype with simulated data. No real credentials required.</span>
        </div>
      </div>
    </div>
  );
}
