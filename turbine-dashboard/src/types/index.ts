export interface TurbineEvent {
  timestamp: Date;
  status: string;
  description: string;
  category: string;
  eventType: string;
  power: number;
  windSpeed: number;
}

export type Metrics = {
  availability: number;
  mtbf: number;
  mttr: number;
};
