// src/utils/calculations.ts
import type { TurbineEvent, Metrics } from '../types/index.js';

// Rüzgar hızı operasyonel limitleri
const CUT_IN_SPEED = 3; // m/s
const CUT_OUT_SPEED = 25; // m/s

interface Interval {
  start: Date;
  end: Date;
}

/**
 * Calculates the total duration of overlap between two sets of time intervals.
 * @param intervals1 Array of first set of intervals.
 * @param intervals2 Array of second set of intervals.
 * @returns Total overlapping duration in seconds.
 */
const getOverlappingDuration = (intervals1: Interval[], intervals2: Interval[]): number => {
  let totalOverlap = 0;

  for (const int1 of intervals1) {
    for (const int2 of intervals2) {
      // Find the start and end of the overlap
      const overlapStart = Math.max(int1.start.getTime(), int2.start.getTime());
      const overlapEnd = Math.min(int1.end.getTime(), int2.end.getTime());

      // If there is an overlap, add its duration to the total
      if (overlapStart < overlapEnd) {
        totalOverlap += (overlapEnd - overlapStart) / 1000; // Convert to seconds
      }
    }
  }
  return totalOverlap;
};

export const calculateMetrics = (events: TurbineEvent[]): Metrics => {
  if (events.length < 2) {
    return { availability: 0, mtbf: 0, mttr: 0, reliability_R100h: 0 };
  }

  const sortedEvents = [...events].sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());

  let T_operating_seconds = 0;
  let T_technical_downtime_seconds = 0;
  let T_weather_outage_seconds = 0;
  let numberOfFailures = 0;

  const dtIntervals: Interval[] = [];
  const rtIntervals: Interval[] = [];
  const wotIntervals: Interval[] = [];

  const T_total_duration_seconds = (sortedEvents[sortedEvents.length - 1].timestamp!.getTime() - sortedEvents[0].timestamp!.getTime()) / 1000;

  for (let i = 1; i < sortedEvents.length; i++) {
    const prev = sortedEvents[i - 1];
    const curr = sortedEvents[i];

    // Ensure both timestamps are valid Dates
    if (!prev.timestamp || !curr.timestamp) continue;

    const duration_seconds = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;

    // Determine operating time
    const isOperating = prev.power > 0;
    if (isOperating) {
      T_operating_seconds += duration_seconds;
    }

    // Identify Weather Outage intervals (WOT)
    // When power is 0 or less AND wind speed is outside operational limits
    const isWeatherOutage = prev.power <= 0 && (prev.windSpeed < CUT_IN_SPEED || prev.windSpeed > CUT_OUT_SPEED);
    if (isWeatherOutage) {
      T_weather_outage_seconds += duration_seconds;
      wotIntervals.push({ start: prev.timestamp, end: curr.timestamp });
    }

    // Identify Technical Downtime intervals (DT)
    // This is for periods where power is 0 or less AND the eventType indicates a technical issue.
    // This definition is independent of wind speed to allow for overlap with WOT.
    // Updated based on user's provided 'eventType' values.
    const technicalDowntimeEventTypes = ['fault', 'safety critical fault'];
    // Added null/undefined check for prev.eventType
    const isTechnicalDowntimeByEvent = prev.power <= 0 && prev.eventType && technicalDowntimeEventTypes.some(type => prev.eventType.toLowerCase().includes(type.toLowerCase()));
    
    if (isTechnicalDowntimeByEvent) {
        T_technical_downtime_seconds += duration_seconds; // Sum all technical downtime, regardless of WOT overlap
        dtIntervals.push({ start: prev.timestamp, end: curr.timestamp });
    }

    // Identify Repair Time intervals (RT)
    // This is for periods where power is 0 or less AND the eventType indicates a repair/maintenance activity.
    // No specific 'repair' or 'maintenance' event types were provided by the user in the last input,
    // so we keep some common examples. Adjust if your data has specific repair event types.
    const repairEventTypes = ['Repair', 'Maintenance']; // Example types, adjust as needed
    // Added null/undefined check for prev.eventType
    const isRepairTimeByEvent = prev.power <= 0 && prev.eventType && repairEventTypes.some(type => prev.eventType.toLowerCase().includes(type.toLowerCase()));

    if (isRepairTimeByEvent) {
        rtIntervals.push({ start: prev.timestamp, end: curr.timestamp });
    }
    // If no specific 'Repair' event types are available, and all technical downtime
    // should be considered for MTTR and R(100h) overlap, then you might default
    // rtIntervals to dtIntervals if isRepairTimeByEvent is not specific enough.
    // For now, rtIntervals will only populate if a specific repairEventTypes match.

    // Arıza tespiti: Çalışır durumdan -> Teknik arıza durumuna geçiş anı
    // Sadece rüzgar hızı operasyonel sınırlar içindeyken (teknik arıza) sayılmalı
    const isFaultTransition = prev.power > 0 && curr.power <= 0 && 
                              (curr.windSpeed >= CUT_IN_SPEED && curr.windSpeed <= CUT_OUT_SPEED);
    if (isFaultTransition) {
        numberOfFailures++;
    }
  }

  // --- Availability (Ao) Calculation ---
  // Ao = (T_Total - (T_DT + T_MT + T_WOT)) / T_Total
  // T_DT here refers to the T_technical_downtime_seconds based on the previous logic (wind within operational limits and power <= 0).
  // The provided formula implies a total downtime duration (DT + MT + WOT) that is subtracted from T_Total.
  // We'll use the 'total technical downtime' (T_technical_downtime_seconds) plus T_weather_outage_seconds
  // to represent the total "unavailability" duration for the Ao calculation.
  const totalDowntimeForAvailability = T_technical_downtime_seconds + T_weather_outage_seconds;
  const operationalTime_Ao = T_total_duration_seconds - totalDowntimeForAvailability;
  const availability = T_total_duration_seconds > 0 
    ? (operationalTime_Ao / T_total_duration_seconds) * 100 
    : 0;

  // --- MTBF Calculation ---
  const mtbf_hours = numberOfFailures > 0 ? (T_operating_seconds / 3600) / numberOfFailures : 0;

  // --- MTTR Calculation ---
  const mttr_hours = numberOfFailures > 0 ? (T_technical_downtime_seconds / 3600) / numberOfFailures : 0;

  // --- Reliability R(100h) Calculation ---
  // R = 1 - (Overlap(DT, WOT) + Overlap(RT, WOT)) / WOT
  const overlap_DT_WOT = getOverlappingDuration(dtIntervals, wotIntervals);
  const overlap_RT_WOT = getOverlappingDuration(rtIntervals, wotIntervals);

  let reliability_R100h = 0;
  if (T_weather_outage_seconds > 0) {
    reliability_R100h = 1 - ((overlap_DT_WOT + overlap_RT_WOT) / T_weather_outage_seconds);
    // Ensure reliability is not negative
    reliability_R100h = Math.max(0, reliability_R100h);
  }

  // Sonuçların 'NaN' veya 'Infinity' olmamasını garantile
  return { 
    availability: isFinite(availability) ? parseFloat(availability.toFixed(1)) : 0,
    mtbf: isFinite(mtbf_hours) ? parseFloat(mtbf_hours.toFixed(1)) : 0,
    mttr: isFinite(mttr_hours) ? parseFloat(mttr_hours.toFixed(1)) : 0,
    reliability_R100h: isFinite(reliability_R100h) ? parseFloat(reliability_R100h.toFixed(3)) : 0,
  };
};