export interface TurbineEvent {
  timestamp: Date | null;
  status: string;
  name: string;
  power?: number;
  windSpeed?: number;
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

// Hata ayıklama için genişletilmiş metrik türü
export type Metrics = {
  // Nihai KPI'lar
  operationalAvailability: number;
  technicalAvailability: number;
  mtbf: number;
  mttr: number;
  reliabilityR: number;
  // Hata ayıklama için ara değerler
  debug: {
    T_total: number;
    T_operating: number;
    T_maintenance: number;
    T_downtime: number;
    T_weatheroutage: number;
    T_repairtime: number;
    numberOfFailures: number;
    overlap_dt_wot: number;
    overlap_rt_wot: number;
    maintenanceIntervalsCount: number;
    repairIntervalsCount: number;
    downtimeIntervalsCount: number;
    weatherIntervalsCount: number;
  }
};