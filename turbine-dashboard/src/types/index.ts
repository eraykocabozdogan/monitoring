export interface TurbineEvent {
  timestamp: Date | null; // Hatalı tarih durumları için null olabilir
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
  reliability_R100h: number; // Yeni eklenecek metrik
};