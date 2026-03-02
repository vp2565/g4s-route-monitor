"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareTrackingDialogProps {
  token: string;
  isDark: boolean;
}

export function ShareTrackingDialog({
  token,
  isDark,
}: ShareTrackingDialogProps) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/tracking/${token}`
      : `/tracking/${token}`;

  function copyUrl() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs",
            isDark && "border-gray-700 text-gray-300 hover:bg-gray-800"
          )}
        >
          <Share2 className="h-3.5 w-3.5 mr-1" />
          Share Tracking
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(isDark && "bg-gray-900 border-gray-700 text-gray-100")}
      >
        <DialogHeader>
          <DialogTitle className={cn(isDark && "text-gray-100")}>
            Share Tracking Link
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p
            className={cn(
              "text-sm",
              isDark ? "text-gray-400" : "text-gray-500"
            )}
          >
            Share this read-only tracking URL with OEM partners or customers.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              className={cn(
                "flex-1 text-xs px-3 py-2 rounded-md border font-mono",
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-300"
                  : "bg-gray-50 border-gray-200"
              )}
            />
            <Button size="sm" onClick={copyUrl} className="h-9 px-3">
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
