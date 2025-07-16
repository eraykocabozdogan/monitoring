import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index.js';

const CUT_IN_SPEED = 3;
const CUT_OUT_SPEED = 25;

interface StatePoint {
  timestamp: Date;
  duration: number; // in seconds
  power: number;
  windSpeed: number;
  eventType: string;
}

/**
 * Merges log events and power curve data into a single, chronological state timeline.
 * Each point in the timeline represents the state of the turbine until the next point.
 */
const createTimeline = (logs: TurbineEvent[], powerData: PowerCurvePoint[]): StatePoint[] => {
  if (powerData.length === 0) return [];

  // Create maps for quick lookups
  const logMap = new Map(logs.map(log => [log.timestamp!.getTime(), log]));
  const powerMap = new Map(powerData.map(p => [p.timestamp!.getTime(), p]));

  // Get all unique timestamps and sort them
  const allTimestamps = [...new Set([...logs.map(l => l.timestamp!.getTime()), ...powerData.map(p => p.timestamp!.getTime())])];
  allTimestamps.sort((a, b) => a - b);

  const timeline: StatePoint[] = [];
  let lastPower = powerData[0].power;
  let lastWindSpeed = powerData[0].windSpeed;
  let lastEventType = 'information'; 

  for (let i = 0; i < allTimestamps.length; i++) {
    const ts = allTimestamps[i];
    const nextTs = allTimestamps[i + 1] || ts;
    const duration = (nextTs - ts) / 1000;

    // Update state if a point exists at this timestamp
    if (powerMap.has(ts)) {
      lastPower = powerMap.get(ts)!.power;
      lastWindSpeed = powerMap.get(ts)!.windSpeed;
    }
    if (logMap.has(ts)) {
      lastEventType = logMap.get(ts)!.eventType;
    }

    timeline.push({
      timestamp: new Date(ts),
      duration,
      power: lastPower,
      windSpeed: lastWindSpeed,
      eventType: lastEventType,
    });
  }

  return timeline;
};


export const calculateMetrics = (logs: TurbineEvent[], powerData: PowerCurvePoint[]): Metrics => {
  if (powerData.length < 2 || logs.length === 0) {
    return { availability: 0, mtbf: 0, mttr: 0, reliability_R100h: 0 };
  }

  const timeline = createTimeline(logs, powerData);
  if (timeline.length < 2) {
    return { availability: 0, mtbf: 0, mttr: 0, reliability_R100h: 0 };
  }

  let T_operating_seconds = 0;
  let T_technical_downtime_seconds = 0;
  let T_weather_outage_seconds = 0;
  let numberOfFailures = 0;

  const T_total_duration_seconds = (timeline[timeline.length - 1].timestamp!.getTime() - timeline[0].timestamp!.getTime()) / 1000;

  for (let i = 0; i < timeline.length -1; i++) {
    const prev = timeline[i];
    const curr = timeline[i+1];

    const duration = prev.duration;

    // Operating Time: Power is being generated
    if (prev.power > 0) {
      T_operating_seconds += duration;
    }

    // Weather Outage: No power, and wind is out of operational range
    const isWeatherOutage = prev.power <= 0 && (prev.windSpeed < CUT_IN_SPEED || prev.windSpeed > CUT_OUT_SPEED);
    if (isWeatherOutage) {
      T_weather_outage_seconds += duration;
    }

    // Technical Downtime: No power, but wind is OK. This implies a fault.
    const isTechnicalDowntime = prev.power <= 0 && (prev.windSpeed >= CUT_IN_SPEED && prev.windSpeed <= CUT_OUT_SPEED);
    if (isTechnicalDowntime) {
      T_technical_downtime_seconds += duration;
    }

    // Failure Event: Transition from operating to technical downtime
    const wasOperating = prev.power > 0;
    const isNowTechnicalDowntime = curr.power <= 0 && (curr.windSpeed >= CUT_IN_SPEED && curr.windSpeed <= CUT_OUT_SPEED);

    if (wasOperating && isNowTechnicalDowntime) {
      // Check if the event type indicates a fault
      const faultTypes = ['fault', 'safety critical fault'];
      if(faultTypes.some(type => curr.eventType.toLowerCase().includes(type))){
          numberOfFailures++;
      }
    }
  }

  // --- Availability Calculation ---
  const T_downtime_total = T_technical_downtime_seconds + T_weather_outage_seconds;
  const availability = T_total_duration_seconds > 0
    ? ((T_total_duration_seconds - T_downtime_total) / T_total_duration_seconds) * 100
    : 0;
    
  // --- MTBF, MTTR Calculation ---
  const mtbf_hours = numberOfFailures > 0 ? (T_operating_seconds / 3600) / numberOfFailures : 0;
  const mttr_hours = numberOfFailures > 0 ? (T_technical_downtime_seconds / 3600) / numberOfFailures : 0;

  // --- Reliability R(100h) Calculation (Simplified) ---
  // A simple reliability calculation based on failure rate (lambda = 1/MTBF)
  // R(t) = e^(-lambda * t)
  const lambda_failures_per_hour = mtbf_hours > 0 ? 1 / mtbf_hours : 0;
  const reliability_R100h = Math.exp(-lambda_failures_per_hour * 100) * 100;


  return {
    availability: isFinite(availability) ? parseFloat(availability.toFixed(1)) : 0,
    mtbf: isFinite(mtbf_hours) ? parseFloat(mtbf_hours.toFixed(1)) : 0,
    mttr: isFinite(mttr_hours) ? parseFloat(mttr_hours.toFixed(1)) : 0,
    reliability_R100h: isFinite(reliability_R100h) ? parseFloat(reliability_R100h.toFixed(1)) : 0,
  };
};