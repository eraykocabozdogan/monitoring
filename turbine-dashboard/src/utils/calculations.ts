// src/utils/calculations.ts
import type { TurbineEvent, Metrics } from '../types/index.js';

// Rüzgar hızı operasyonel limitleri
const CUT_IN_SPEED = 3; // m/s
const CUT_OUT_SPEED = 25; // m/s

export const calculateMetrics = (events: TurbineEvent[]): Metrics => {
  // Hesaplama için en az 2 olay gerekir
  if (events.length < 2) {
    return { availability: 0, mtbf: 0, mttr: 0 };
  }

  // Olayları her zaman zamana göre sırala
  const sortedEvents = [...events].sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());

  let T_operating = 0;
  let T_technical_downtime = 0;
  let T_weather_outage = 0;
  let numberOfFailures = 0;

  for (let i = 1; i < sortedEvents.length; i++) {
    const prev = sortedEvents[i - 1];
    const curr = sortedEvents[i];

    // Önceki ve mevcut olay arasındaki süreyi saniye cinsinden hesapla
    const duration = (curr.timestamp!.getTime() - prev.timestamp!.getTime()) / 1000;

    // Türbinin durumu, aralığın başındaki (önceki) olaya göre belirlenir
    if (prev.power > 0) {
      T_operating += duration;
    } else { // Güç <= 0, yani duruş var
      if (prev.windSpeed < CUT_IN_SPEED || prev.windSpeed > CUT_OUT_SPEED) {
        T_weather_outage += duration;
      } else {
        T_technical_downtime += duration;
      }
    }
    
    // Arıza tespiti: Çalışır durumdan -> Teknik arıza durumuna geçiş anı
    const isFaultTransition = prev.power > 0 && curr.power <= 0 && (curr.windSpeed >= CUT_IN_SPEED && curr.windSpeed <= CUT_OUT_SPEED);
    if (isFaultTransition) {
        numberOfFailures++;
    }
  }

  const T_total_duration = (sortedEvents[sortedEvents.length - 1].timestamp!.getTime() - sortedEvents[0].timestamp!.getTime()) / 1000;
  const T_availability_base = T_total_duration - T_weather_outage;

  // Sıfıra bölme hatalarını engelle
  const availability = T_availability_base > 0 ? (T_operating / T_availability_base) * 100 : 0;
  const mtbf_hours = numberOfFailures > 0 ? (T_operating / 3600) / numberOfFailures : 0;
  const mttr_hours = numberOfFailures > 0 ? (T_technical_downtime / 3600) / numberOfFailures : 0;

  // Sonuçların 'NaN' veya 'Infinity' olmamasını garantile
  return { 
    availability: isFinite(availability) ? availability : 0,
    mtbf: isFinite(mtbf_hours) ? mtbf_hours : 0,
    mttr: isFinite(mttr_hours) ? mttr_hours : 0,
  };
};