import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index.js';

const CUT_IN_SPEED = 3;
const CUT_OUT_SPEED = 25;
const MIN_MAINTENANCE_DURATION = 5 * 60;
const MAX_MAINTENANCE_DURATION = 24 * 60 * 60;
const MERGE_GAP_DURATION = 1 * 60;

interface TimeInterval {
    start: Date;
    end: Date;
}

// Bir aralığın, ana aralık (dateRange) ile çakışan süresini saniye olarak döndürür
const getOverlappingDurationInSeconds = (interval: TimeInterval, dateRange: TimeInterval): number => {
    const start = Math.max(interval.start.getTime(), dateRange.start.getTime());
    const end = Math.min(interval.end.getTime(), dateRange.end.getTime());

    if (start < end) {
        return (end - start) / 1000;
    }
    return 0;
};

// **HATA DÜZELTMESİ: Silinen fonksiyon tekrar eklendi**
// İki zaman aralığı dizisi arasındaki toplam çakışma süresini saniye olarak hesaplar
const calculateOverlapSeconds = (intervalsA: TimeInterval[], intervalsB: TimeInterval[]): number => {
    let overlapDuration = 0;
    for (const a of intervalsA) {
        for (const b of intervalsB) {
            const start = Math.max(a.start.getTime(), b.start.getTime());
            const end = Math.min(a.end.getTime(), b.end.getTime());
            if (start < end) {
                overlapDuration += (end - start) / 1000;
            }
        }
    }
    return overlapDuration;
};


export const calculateMetrics = (
    logs: TurbineEvent[], 
    powerData: PowerCurvePoint[], 
    dateRange: { start: Date | null, end: Date | null }
): Metrics => {

  if (!dateRange.start || !dateRange.end || powerData.length < 2) {
    return { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 };
  }
  
  const T_total_seconds = (dateRange.end.getTime() - dateRange.start.getTime()) / 1000;
  if (T_total_seconds <= 0) return { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 };

  // --- 1. ADIM: Bakım aralıklarını TÜM VERİ üzerinden hesapla ---
  let rawMaintenanceIntervals: TimeInterval[] = [];
  const maintenanceLogs = logs
    .filter(log => log.eventType === 'EVENT_155' && log.timestamp)
    .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());

  let maintenanceStart: Date | null = null;
  for (const log of maintenanceLogs) {
      if (log.status === 'ON') {
          maintenanceStart = log.timestamp;
      } else if (log.status === 'OFF' && maintenanceStart) {
          rawMaintenanceIntervals.push({ start: maintenanceStart, end: log.timestamp! });
          maintenanceStart = null;
      }
  }

  let filteredIntervals = rawMaintenanceIntervals.filter(interval => {
      const duration = (interval.end.getTime() - interval.start.getTime()) / 1000;
      return duration >= MIN_MAINTENANCE_DURATION && duration <= MAX_MAINTENANCE_DURATION;
  });

  let maintenanceIntervals: TimeInterval[] = [];
  if (filteredIntervals.length > 0) {
      const merged: TimeInterval[] = [];
      let current = filteredIntervals[0];
      for (let i = 1; i < filteredIntervals.length; i++) {
          const next = filteredIntervals[i];
          const gap = (next.start.getTime() - current.end.getTime()) / 1000;
          if (gap <= MERGE_GAP_DURATION) {
              current.end = next.end;
          } else {
              merged.push(current);
              current = next;
          }
      }
      merged.push(current);
      maintenanceIntervals = merged;
  }
  
  const T_maintenance = maintenanceIntervals.reduce((total, interval) => {
      return total + getOverlappingDurationInSeconds(interval, dateRange as TimeInterval);
  }, 0);


  // --- 2. ADIM: Diğer zamanları TÜM VERİ üzerinden kategorize et ---
  const allEvents = [...logs, ...powerData].sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  
  let T_operating = 0, T_downtime = 0, T_repair = 0, T_weather_outage = 0, numberOfFailures = 0;
  const downtimeIntervals: TimeInterval[] = [], repairIntervals: TimeInterval[] = [], weatherOutageIntervals: TimeInterval[] = [];

  for (let i = 0; i < allEvents.length - 1; i++) {
    const eventInterval = { start: allEvents[i].timestamp!, end: allEvents[i + 1].timestamp! };
    if (eventInterval.start >= eventInterval.end) continue;

    const duration = getOverlappingDurationInSeconds(eventInterval, dateRange as TimeInterval);
    if (duration <= 0) continue;

    const powerPoint = powerData.find(p => p.timestamp === eventInterval.start);
    const isOperating = powerPoint && powerPoint.power > 0;
    const isWeatherOutage = powerPoint && powerPoint.power <= 0 && (powerPoint.windSpeed < CUT_IN_SPEED || powerPoint.windSpeed > CUT_OUT_SPEED);
    
    const isMaintenanceNow = maintenanceIntervals.some(m => 
        eventInterval.start.getTime() < m.end.getTime() && eventInterval.end.getTime() > m.start.getTime()
    );

    if (isMaintenanceNow) {
        // Zaten T_maintenance içinde sayıldı.
    } else if (isOperating) {
        T_operating += duration;
    } else if (isWeatherOutage) {
        T_weather_outage += duration;
        weatherOutageIntervals.push(eventInterval);
    } else {
        T_downtime += duration;
        downtimeIntervals.push(eventInterval);
        const log = logs.find(l => l.timestamp === eventInterval.start);
        if (log && log.eventType?.toLowerCase().includes('fault')) {
            T_repair += duration;
            repairIntervals.push(eventInterval);
            
            const wasOperating = powerData.find(p => p.timestamp!.getTime() < eventInterval.start.getTime())?.power ?? -1 > 0;
            if (wasOperating) numberOfFailures++;
        }
    }
  }

  // --- 3. ADIM: METRİKLERİ HESAPLA ---
  const Tdt = T_downtime, Tmt = T_maintenance, Twot = T_weather_outage;
  const ao = T_total_seconds > 0 ? ((T_total_seconds - (Tdt + Tmt + Twot)) / T_total_seconds) * 100 : 0;
  const at_denominator = T_total_seconds - (Tmt + Twot);
  const at = at_denominator > 0 ? ((at_denominator - Tdt) / at_denominator) * 100 : 0;
  const mtbf_hours = numberOfFailures > 0 ? (T_operating / 3600) / numberOfFailures : 0;
  const mttr_hours = numberOfFailures > 0 ? (T_repair / 3600) / numberOfFailures : 0;
  let reliabilityR = 100;
  if (Twot > 0) {
      const wotInRange = weatherOutageIntervals.reduce((total, interval) => total + getOverlappingDurationInSeconds(interval, dateRange as TimeInterval), 0);
      if(wotInRange > 0){
        // Bu satır artık hata vermeyecek
        reliabilityR = (1 - (calculateOverlapSeconds(downtimeIntervals, weatherOutageIntervals) + calculateOverlapSeconds(repairIntervals, weatherOutageIntervals)) / wotInRange) * 100;
      }
  }

  return {
    operationalAvailability: isFinite(ao) ? parseFloat(ao.toFixed(2)) : 0,
    technicalAvailability: isFinite(at) ? parseFloat(at.toFixed(2)) : 0,
    mtbf: isFinite(mtbf_hours) ? parseFloat(mtbf_hours.toFixed(2)) : 0,
    mttr: isFinite(mttr_hours) ? parseFloat(mttr_hours.toFixed(2)) : 0,
    reliabilityR: isFinite(reliabilityR) ? parseFloat(reliabilityR.toFixed(2)) : 0,
  };
};