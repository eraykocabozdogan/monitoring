export interface TurbineEvent {
  timestamp: Date | null;
  status: string;
  name: string;
  description: string;
  category: string;
  eventType: string;
  ccuEvent: string;
}

export interface PowerCurvePoint {
  timestamp: Date | null;
  windSpeed: number;
  power: number;
  refPower: number;
}

// Updated metrics to be more specific
export type Metrics = {
  operationalAvailability: number;
  technicalAvailability: number;
  mtbf: number;
  mttr: number;
  reliabilityR: number; // Renamed for consistency
};