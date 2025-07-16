export interface TurbineEvent {
  timestamp: Date | null;
  status: string;
  name: string; // "Name" alanı eklendi
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

export type Metrics = {
  availability: number;
  mtbf: number;
  mttr: number;
  reliability_R100h: number;
};