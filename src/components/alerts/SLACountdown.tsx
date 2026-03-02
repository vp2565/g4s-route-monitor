"use client";

import { useEffect, useState } from "react";

interface SLACountdownProps {
  deadline: string;
  breached: boolean;
  isDark: boolean;
}

export function SLACountdown({ deadline: deadlineStr, breached, isDark }: SLACountdownProps) {
  const [remaining, setRemaining] = useState("");
  const [isExpired, setIsExpired] = useState(breached);

  useEffect(() => {
    function update() {
      const deadline = new Date(deadlineStr).getTime();
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsExpired(true);
        const overMs = Math.abs(diff);
        const overMins = Math.floor(overMs / 60000);
        const overHrs = Math.floor(overMins / 60);
        setRemaining(overHrs > 0 ? `-${overHrs}h ${overMins % 60}m` : `-${overMins}m`);
      } else {
        setIsExpired(false);
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        setRemaining(hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`);
      }
    }
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [deadlineStr]);

  const style = isDark
    ? {
        backgroundColor: isExpired ? "#7F1D1D" : "#1E3A5F",
        color: isExpired ? "#FCA5A5" : "#93C5FD",
      }
    : {
        backgroundColor: isExpired ? "rgb(254 242 242)" : "rgb(239 246 255)",
        color: isExpired ? "rgb(185 28 28)" : "rgb(29 78 216)",
      };

  return (
    <span
      className="font-mono text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
      style={style}
    >
      SLA {isExpired ? "BREACHED " : ""}{remaining}
    </span>
  );
}
