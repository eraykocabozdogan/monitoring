import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index.js';

const CUT_IN_SPEED = 3;
const CUT_OUT_SPEED = 25;

interface TimeInterval {
    start: Date;
    end: Date;
}

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

export const calculateMetrics = (logs: TurbineEvent[], powerData: PowerCurvePoint[]): Metrics => {
  if (powerData.length < 2) {
    return { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 };
  }

  // Tüm olayları birleştir ve sırala
  const allEvents = [
    ...logs.map(e => ({ ...e, type: 'log' })),
    ...powerData.map(p => ({ ...p, type: 'power' })),
  ].sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  
  if (allEvents.length < 2) {
    return { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 };
  }

  const T_total_seconds = (allEvents[allEvents.length - 1].timestamp!.getTime() - allEvents[0].timestamp!.getTime()) / 1000;

  let T_operating = 0;
  let T_downtime = 0;
  let T_repair = 0;
  let T_weather_outage = 0;
  let numberOfFailures = 0;

  // --- GÜNCELLENMİŞ MAINTENANCE TIME HESAPLAMA MANTIĞI ---
  let T_maintenance = 0;
  const maintenanceLogs = logs
    .filter(log => log.eventType === 'EVENT_155' && log.timestamp)
    .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());

  let maintenanceStart: Date | null = null;
  for (const log of maintenanceLogs) {
      if (log.status === 'ON') {
          // Her 'ON' sinyali, en güncel ve doğru bakım başlangıcı olarak kabul edilir.
          // Bu, önceki kapatılmamış (eksik OFF) 'ON' sinyalini geçersiz kılar.
          maintenanceStart = log.timestamp;
      } else if (log.status === 'OFF' && maintenanceStart) {
          // Eğer geçerli bir başlangıç varsa ve 'OFF' geldiyse, süreyi hesapla.
          T_maintenance += (log.timestamp!.getTime() - maintenanceStart.getTime()) / 1000;
          // Periyot kapandığı için başlangıcı sıfırla.
          maintenanceStart = null;
      }
  }
  // --- HESAPLAMA MANTIĞI SONU ---

  // Çakışma hesabı için aralıkları topla
  const downtimeIntervals: TimeInterval[] = [];
  const repairIntervals: TimeInterval[] = [];
  const weatherOutageIntervals: TimeInterval[] = [];

  let lastPower = powerData[0].power > 0;
  
  for (let i = 0; i < allEvents.length - 1; i++) {
    const currentEvent = allEvents[i];
    const nextEvent = allEvents[i+1];
    const duration = (nextEvent.timestamp!.getTime() - currentEvent.timestamp!.getTime()) / 1000;
    
    if (duration <= 0) continue;

    const { power, windSpeed } = powerData.find(p => p.timestamp === currentEvent.timestamp) || { power: -1, windSpeed: -1 };
    
    let isOperating = power > 0;
    let isWeatherOutage = power <= 0 && (windSpeed < CUT_IN_SPEED || windSpeed > CUT_OUT_SPEED);
    
    let isFault = false;
    
    if (currentEvent.type === 'log') {
        const eventType = currentEvent.eventType?.toLowerCase() || '';
        if (eventType.includes('fault')) {
            isFault = true;
        }
    }

    if (isOperating) {
        T_operating += duration;
    } else if (isWeatherOutage) {
        T_weather_outage += duration;
        weatherOutageIntervals.push({ start: currentEvent.timestamp!, end: nextEvent.timestamp! });
    } else { // Teknik duruş
        T_downtime += duration;
        downtimeIntervals.push({ start: currentEvent.timestamp!, end: nextEvent.timestamp! });
        if (isFault) {
            T_repair += duration;
            repairIntervals.push({ start: currentEvent.timestamp!, end: nextEvent.timestamp! });
        }
    }
    
    const nextPower = (powerData.find(p => p.timestamp === nextEvent.timestamp) || { power: 0 }).power > 0;
    if (lastPower && !nextPower && isFault) {
      numberOfFailures++;
    }
    lastPower = isOperating;
  }

  // FORMÜL UYGULAMALARI
  const ao = T_total_seconds > 0 ? ((T_total_seconds - (T_downtime + T_maintenance + T_weather_outage)) / T_total_seconds) * 100 : 0;

  const at_denominator = T_total_seconds - (T_maintenance + T_weather_outage);
  const at = at_denominator > 0 ? ((T_total_seconds - (T_downtime + T_maintenance)) / at_denominator) * 100 : 0;

  const mtbf_hours = numberOfFailures > 0 ? (T_operating / 3600) / numberOfFailures : 0;

  const mttr_hours = numberOfFailures > 0 ? (T_downtime / 3600) / numberOfFailures : 0;

  const overlap_dt_wot = calculateOverlapSeconds(downtimeIntervals, weatherOutageIntervals);
  const overlap_rt_wot = calculateOverlapSeconds(repairIntervals, weatherOutageIntervals);
  let reliabilityR = 0;
  if (T_weather_outage > 0) {
      reliabilityR = (1 - (overlap_dt_wot + overlap_rt_wot) / T_weather_outage) * 100;
  }

  return {
    operationalAvailability: isFinite(ao) ? parseFloat(ao.toFixed(1)) : 0,
    technicalAvailability: isFinite(at) ? parseFloat(at.toFixed(1)) : 0,
    mtbf: isFinite(mtbf_hours) ? parseFloat(mtbf_hours.toFixed(1)) : 0,
    mttr: isFinite(mttr_hours) ? parseFloat(mttr_hours.toFixed(1)) : 0,
    reliabilityR: isFinite(reliabilityR) ? parseFloat(reliabilityR.toFixed(1)) : 0,
  };
};