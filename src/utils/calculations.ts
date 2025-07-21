import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index';

const CUT_IN_SPEED = 3;
const CUT_OUT_SPEED = 25;

interface TimeInterval {
    start: Date;
    end: Date;
}

// Helper: Verilen zaman aralıklarının seçili tarih aralığıyla kesişen toplam süresini saniye olarak hesaplar.
const getTotalDurationInSeconds = (intervals: TimeInterval[], dateRange: TimeInterval): number => {
    if (!intervals || intervals.length === 0) return 0;
    let totalDuration = 0;
    for (const interval of intervals) {
        const start = Math.max(interval.start.getTime(), dateRange.start.getTime());
        const end = Math.min(interval.end.getTime(), dateRange.end.getTime());
        if (start < end) {
            totalDuration += (end - start);
        }
    }
    return totalDuration / 1000;
};

// Helper: İki zaman aralığı kümesi arasındaki toplam çakışma süresini saniye olarak hesaplar.
const calculateOverlapSeconds = (intervalsA: TimeInterval[], intervalsB: TimeInterval[]): number => {
    if (!intervalsA || !intervalsB || intervalsA.length === 0 || intervalsB.length === 0) return 0;
    let overlapDuration = 0;
    for (const a of intervalsA) {
        for (const b of intervalsB) {
            const start = Math.max(a.start.getTime(), b.start.getTime());
            const end = Math.min(a.end.getTime(), b.end.getTime());
            if (start < end) {
                overlapDuration += (end - start);
            }
        }
    }
    return overlapDuration / 1000;
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

    // --- ADIM 1: Her durum için BAĞIMSIZ zaman aralığı listeleri oluştur ---
    const operatingIntervals: TimeInterval[] = [];
    const weatherOutageIntervals: TimeInterval[] = [];
    const repairIntervals: TimeInterval[] = [];
    const unclassifiedDowntimeIntervals: TimeInterval[] = [];
    
    const faultLogs = logs.filter(l => l.eventType?.toLowerCase().includes('fault'));

    for (let i = 0; i < powerData.length - 1; i++) {
        const p1 = powerData[i];
        const p2 = powerData[i + 1];
        const interval: TimeInterval = { start: p1.timestamp!, end: p2.timestamp! };

        if (p1.power > 0) {
            operatingIntervals.push(interval);
        } else { // Güç üretimi yoksa (downtime)
            const isWeatherOutage = p1.windSpeed < CUT_IN_SPEED || p1.windSpeed > CUT_OUT_SPEED;
            const hasFault = faultLogs.some(l => l.timestamp! >= interval.start && l.timestamp! < interval.end);

            if (isWeatherOutage) {
                weatherOutageIntervals.push(interval);
            }
            if (hasFault) {
                repairIntervals.push(interval);
            }
            // Eğer hava koşulu DEĞİLSE ve arıza olarak işaretlenmemişse, bu "diğer/belirsiz" bir teknik duruştur.
            if (!isWeatherOutage && !hasFault) {
                unclassifiedDowntimeIntervals.push(interval);
            }
        }
    }

    // Bakım logları, powerData'dan tamamen bağımsız olarak kendi aralıklarını oluşturur.
    const maintenanceIntervals: TimeInterval[] = logs
        .filter(l => l.eventType === 'EVENT_155' && l.status === 'ON')
        .map(startLog => {
            const endLog = logs.find(l => l.eventType === 'EVENT_155' && l.status === 'OFF' && l.timestamp! > startLog.timestamp!);
            return endLog ? { start: startLog.timestamp!, end: endLog.timestamp! } : null;
        })
        .filter((interval): interval is TimeInterval => interval !== null);

    // --- ADIM 2: Süreleri ve Kesişimleri Hesapla ---
    const range: TimeInterval = { start: dateRange.start, end: dateRange.end };

    const T_operating = getTotalDurationInSeconds(operatingIntervals, range);
    const Tmt = getTotalDurationInSeconds(maintenanceIntervals, range);
    const Twot = getTotalDurationInSeconds(weatherOutageIntervals, range);
    const Trt = getTotalDurationInSeconds(repairIntervals, range);
    // const T_unclassified_dt = getTotalDurationInSeconds(unclassifiedDowntimeIntervals, range);
    
    // Tdt (Toplam Teknik Duruş), hem sınıflandırılmış arızaları (Trt) hem de belirsiz duruşları içerir.
    // const Tdt = Trt + T_unclassified_dt; // Şu anda kullanılmıyor, gelecekte kullanım için burada bırakıldı

    // --- ADIM 3: Metrikleri Doğru Formüllerle Hesapla ---

    // Technical Availability (AT): Kontrol edilemeyen (hava) ve planlı (bakım) süreler hariç, türbinin çalışmaya müsait olduğu zaman.
    const at_denominator = T_total_seconds - Twot - Tmt;
    const at = at_denominator > 0 ? (T_operating / at_denominator) * 100 : 0;
    
    // Operational Availability (AO): Toplam takvim süresi içinde türbinin fiilen ne kadar çalıştığı.
    const ao = T_total_seconds > 0 ? (T_operating / T_total_seconds) * 100 : 0;
    
    // MTBF & MTTR
    // Arıza sayısını daha doğru hesaplayalım: Çalışma periyodundan sonra bir arıza periyodu başlıyorsa 1 sayılır.
    let numberOfFailures = 0;
    for (let i = 0; i < operatingIntervals.length; i++) {
        const operatingEnd = operatingIntervals[i].end.getTime();
        const nextFaultStart = repairIntervals.find(r => r.start.getTime() >= operatingEnd);
        if (nextFaultStart && (nextFaultStart.start.getTime() - operatingEnd < 1000 * 60 * 10)) { // 10dk içinde arıza olduysa
            numberOfFailures++;
        }
    }
    const mtbf_hours = numberOfFailures > 0 ? (T_operating / 3600) / numberOfFailures : 0;
    const mttr_hours = numberOfFailures > 0 ? (Trt / 3600) / numberOfFailures : 0;

    // Reliability (R): Hava koşulları nedeniyle duruş olması gerekirken, aynı anda teknik bir arıza yaşanma oranını ölçer.
    let reliabilityR = 100;
    if (Twot > 0) {
        // Formül: R = 1 - Overlap(RT, WOT) / WOT
        // Sadece "tamir" (fault) aralıklarının hava durumuyla kesişimine bakarız.
        const overlap_rt_wot = calculateOverlapSeconds(repairIntervals, weatherOutageIntervals);
        reliabilityR = (1 - (overlap_rt_wot / Twot)) * 100;
    }

    // Sonuçların 0-100 aralığında kalmasını garantile
    const clamp = (num: number) => Math.max(0, Math.min(100, num));

    return {
        operationalAvailability: clamp(isFinite(ao) ? parseFloat(ao.toFixed(2)) : 0),
        technicalAvailability: clamp(isFinite(at) ? parseFloat(at.toFixed(2)) : 0),
        mtbf: isFinite(mtbf_hours) ? parseFloat(mtbf_hours.toFixed(2)) : 0,
        mttr: isFinite(mttr_hours) ? parseFloat(mttr_hours.toFixed(2)) : 0,
        reliabilityR: clamp(isFinite(reliabilityR) ? parseFloat(reliabilityR.toFixed(2)) : 0),
    };
};