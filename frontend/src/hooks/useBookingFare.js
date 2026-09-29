import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function useBookingFare(input) {
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const ready = input.car_id && input.pickup_district && input.pickup_thana &&
    input.destination_district && input.destination_thana &&
    (input.trip_duration !== "More Than 7 Days" ||
      (Number.isInteger(Number(input.custom_days)) && Number(input.custom_days) >= 8 && Number(input.custom_days) <= 365));
  const params = new URLSearchParams(Object.entries(input).filter(([, value]) => value !== "" && value != null));
  const query = ready ? params.toString() : "";
  const key = `${query}:${revision}`;

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await apiFetch(`/api/booking-fare?${query}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(Object.values(data.errors || {}).flat()[0] || data.message || "Unable to calculate fare.");
        if (active) setResult({ key, data, error: "" });
      } catch (error) {
        if (active && error.name !== "AbortError") setResult({ key, data: null, error: error.message });
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query, key]);

  const current = query && result?.key === key ? result : null;
  return {
    quote: current?.data || null,
    loading: Boolean(query && !current),
    error: current?.error || "",
    refresh: () => setRevision((value) => value + 1),
  };
}
