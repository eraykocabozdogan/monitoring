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

// Yorumlar için yeni tipler
export interface CommentSelection {
  start: number; // timestamp
  end?: number; // timestamp (opsiyonel, aralık seçimi için)
}

export interface Comment {
  id: number;
  text: string;
  selection: CommentSelection;
  createdAt: Date;
}