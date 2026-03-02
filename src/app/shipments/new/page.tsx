"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WizardStepIndicator } from "@/components/shipments/wizard/WizardStepIndicator";
import {
  Step1RouteSelection,
} from "@/components/shipments/wizard/Step1RouteSelection";
import {
  Step2ShipmentDetails,
  type ShipmentDetailsData,
} from "@/components/shipments/wizard/Step2ShipmentDetails";
import {
  Step3SegmentConfig,
  generateSegmentsFromRoute,
  type SegmentConfigData,
} from "@/components/shipments/wizard/Step3SegmentConfig";
import { Step4DeviceAssignment } from "@/components/shipments/wizard/Step4DeviceAssignment";
import { Step5ReviewDispatch } from "@/components/shipments/wizard/Step5ReviewDispatch";
import {
  addShipment,
  getNextShipmentId,
} from "@/lib/store";
import type { RouteTemplate, Shipment } from "@/lib/types";

const USER_CUSTOMER_MAP: Record<string, string> = {
  "usr-002": "cust-001",
  "usr-003": "cust-003",
};

const CUSTOMER_NAMES: Record<string, string> = {
  "cust-001": "British American Tobacco",
  "cust-002": "PharmaCo Europe",
  "cust-003": "TechElectronics GmbH",
};

const defaultDetails: ShipmentDetailsData = {
  customerId: "",
  priority: "standard",
  cargoDescription: "",
  cargoValue: "",
  cargoWeight: "",
  driverName: "",
  driverPhone: "",
  vehiclePlate: "",
  tempMin: "",
  tempMax: "",
  notes: "",
  smpVersion: "SMP-v3.2",
  ddi: {
    driverVerified: false,
    vehicleInspected: false,
    sealsApplied: false,
    documentsChecked: false,
    routeBriefingDone: false,
    devicesTested: false,
    emergencyContactsConfirmed: false,
    communicationsChecked: false,
  },
};

export default function NewShipmentPage() {
  const { user, isDarkTheme } = useAuth();
  const router = useRouter();
  const isDark = isDarkTheme;

  const customerScope = user ? USER_CUSTOMER_MAP[user.id] ?? null : null;
  const isCustomerScoped =
    user?.role === "customer_admin" || user?.role === "customer_user";

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState<RouteTemplate | null>(
    null
  );
  const [details, setDetails] = useState<ShipmentDetailsData>(() => ({
    ...defaultDetails,
    customerId: isCustomerScoped && customerScope ? customerScope : "",
  }));
  const [segments, setSegments] = useState<SegmentConfigData[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);

  const handleRouteSelect = useCallback(
    (route: RouteTemplate) => {
      setSelectedRoute(route);
      setSegments(generateSegmentsFromRoute(route));
    },
    []
  );

  const toggleDevice = useCallback((id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }, []);

  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        return selectedRoute !== null;
      case 2:
        return (
          details.customerId !== "" &&
          details.cargoDescription !== "" &&
          details.driverName !== ""
        );
      case 3:
        return segments.length > 0;
      case 4:
        return true; // Devices optional
      case 5:
        return true;
      default:
        return false;
    }
  }

  function handleDispatch() {
    if (!selectedRoute) return;
    setIsDispatching(true);

    const id = getNextShipmentId();
    const now = new Date().toISOString();

    const newShipment: Shipment = {
      id,
      customerId: details.customerId,
      customerName: CUSTOMER_NAMES[details.customerId] ?? details.customerId,
      routeTemplateId: selectedRoute.id,
      routeName: selectedRoute.name,
      status: "planned",
      priority: details.priority,
      origin: selectedRoute.origin,
      destination: selectedRoute.destination,
      cargoDescription: details.cargoDescription,
      cargoValue: Number(details.cargoValue) || 0,
      cargoWeight: Number(details.cargoWeight) || 0,
      transportModes: selectedRoute.transportModes,
      segmentIds: [],
      deviceIds: selectedDeviceIds,
      driverName: details.driverName,
      driverPhone: details.driverPhone,
      vehiclePlate: details.vehiclePlate,
      scheduledDeparture: now,
      actualDeparture: null,
      scheduledArrival: new Date(
        Date.now() + selectedRoute.estimatedDurationHours * 3600_000
      ).toISOString(),
      estimatedArrival: null,
      actualArrival: null,
      currentPosition: null,
      currentSpeed: null,
      progressPercent: 0,
      riskScore: selectedRoute.riskScore,
      riskLevel: selectedRoute.riskLevel,
      alertCount: 0,
      ddi: Object.values(details.ddi).some(Boolean)
        ? {
            ...details.ddi,
            sealNumbers: [],
            completedBy: user?.id ?? "",
            completedAt: now,
            notes: details.notes,
          }
        : null,
      smpVersion: details.smpVersion,
      temperatureRange:
        details.tempMin && details.tempMax
          ? { min: Number(details.tempMin), max: Number(details.tempMax) }
          : null,
      trackingToken: null,
      notes: details.notes,
      createdAt: now,
      updatedAt: now,
    };

    addShipment(newShipment);

    setTimeout(() => {
      router.push(`/shipments/${id}`);
    }, 500);
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <PageHeader
        title="Create Shipment"
        description="New shipment creation wizard with risk assessment"
      />

      <div className="flex-1 p-6">
        {/* Step indicator */}
        <div className="mb-8">
          <WizardStepIndicator currentStep={currentStep} isDark={isDark} />
        </div>

        {/* Step content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <Step1RouteSelection
              selectedRouteId={selectedRoute?.id ?? null}
              onSelect={handleRouteSelect}
              isDark={isDark}
            />
          )}

          {currentStep === 2 && (
            <Step2ShipmentDetails
              data={details}
              onChange={setDetails}
              isDark={isDark}
              fixedCustomerId={
                isCustomerScoped && customerScope ? customerScope : undefined
              }
            />
          )}

          {currentStep === 3 && selectedRoute && (
            <Step3SegmentConfig
              segments={segments}
              onChange={setSegments}
              isDark={isDark}
            />
          )}

          {currentStep === 4 && (
            <Step4DeviceAssignment
              selectedDeviceIds={selectedDeviceIds}
              onToggle={toggleDevice}
              isDark={isDark}
            />
          )}

          {currentStep === 5 && selectedRoute && (
            <Step5ReviewDispatch
              route={selectedRoute}
              details={details}
              segments={segments}
              selectedDeviceIds={selectedDeviceIds}
              isDark={isDark}
              onDispatch={handleDispatch}
              isDispatching={isDispatching}
            />
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1}
              className={cn(
                isDark && "border-gray-700 text-gray-300 hover:bg-gray-800"
              )}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {currentStep < 5 && (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
