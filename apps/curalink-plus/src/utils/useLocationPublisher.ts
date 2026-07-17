import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { publishProviderLocation, type JobType } from "@curalink/api-client";

// Publishes the professional's live GPS position while `isActive` (en-route/
// transporting) -- the other half of the GPS stream CuraLink's live-tracking
// map subscribes to. Watches position rather than polling on a timer so
// updates are driven by actual movement, not a fixed interval regardless of
// whether the device has moved.
export function useLocationPublisher(jobType: JobType, jobId: string | undefined, professionalId: string | undefined, isActive: boolean) {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!isActive || !jobId || !professionalId) return;

    let cancelled = false;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;

      subscriptionRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 15 },
        (position) => {
          void publishProviderLocation(
            jobType,
            jobId as string,
            professionalId as string,
            position.coords.latitude,
            position.coords.longitude,
            position.coords.heading ?? null,
          );
        },
      );
    }

    void start();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [jobType, jobId, professionalId, isActive]);
}
