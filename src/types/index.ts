export interface TurbineEvent {
  timestamp: Date | null;
  status: string;
  name: string;
  description: string;
  category: string;
  eventType: string;
  ccuEvent: string;
  power?: number;
  windSpeed?: number;
}

export interface PowerCurvePoint {
  timestamp: Date | null;
  windSpeed: number;
  power: number;
  refPower: number;
}

export type Metrics = {
  operationalAvailability: number;
  technicalAvailability: number;
  mtbf: number;
  mttr: number;
  reliabilityR: number;
};

export interface CommentSelection {
  start: number;
  end?: number;
}

export interface Comment {
  id: number;
  text: string;
  selection: CommentSelection | null;
  createdAt: Date;
  pins?: ChartPin[];
  intervals?: ChartInterval[];
}

export interface ChartPin {
  id: string;
  timestamp: Date;
  power: number;
  windSpeed: number;
  expectedPower?: number;
}

export interface ChartInterval {
  id: string;
  startTimestamp: Date;
  endTimestamp: Date;
}