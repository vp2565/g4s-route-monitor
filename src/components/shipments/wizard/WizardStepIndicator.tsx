"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface WizardStepIndicatorProps {
  currentStep: number;
  isDark: boolean;
}

const STEPS = ["Route", "Details", "Segments", "Devices", "Review"];

export function WizardStepIndicator({
  currentStep,
  isDark,
}: WizardStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                    ? "bg-[#C8102E] border-[#C8102E] text-white"
                    : isDark
                    ? "border-gray-600 text-gray-500 bg-transparent"
                    : "border-gray-300 text-gray-400 bg-transparent"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium",
                  isCurrent
                    ? isDark
                      ? "text-gray-200"
                      : "text-gray-800"
                    : isDark
                    ? "text-gray-500"
                    : "text-gray-400"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-1 mt-[-14px]",
                  step < currentStep
                    ? "bg-green-500"
                    : isDark
                    ? "bg-gray-700"
                    : "bg-gray-300"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
