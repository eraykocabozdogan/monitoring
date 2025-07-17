import type { TurbineEvent, PowerCurvePoint, Metrics } from '../types/index.js';

interface TimeInterval {
    start: Date;
    end: Date;
}

const MERGE_GAP_SECONDS = 3600; // 1 saat
const MAX_DURATION_SECONDS = 2 * 24 * 60 * 60; // 2 gün

const getFilteredEventIntervals = (logs: TurbineEvent[], eventName: string): TimeInterval[] => {
    const sortedLogs = logs.filter(l => l.name === eventName && l.timestamp).sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
    let rawIntervals: TimeInterval[] = [];
    let intervalStart: Date | null = null;
    for (const log of sortedLogs) {
        if (log.status.toLowerCase() === 'on') {
            if (!intervalStart) intervalStart = log.timestamp;
        } else if (log.status.toLowerCase() === 'off' && intervalStart) {
            rawIntervals.push({ start: intervalStart, end: log.timestamp! });
            intervalStart = null;
        }
    }
    const durationFiltered = rawIntervals.filter(i => (i.end.getTime() - i.start.getTime()) / 1000 <= MAX_DURATION_SECONDS);
    if (durationFiltered.length === 0) return [];
    
    const mergedIntervals: TimeInterval[] = [];
    let current = { ...durationFiltered[0] };
    for (let i = 1; i < durationFiltered.length; i++) {
        const next = durationFiltered[i];
        const gap = (next.start.getTime() - current.end.getTime()) / 1000;
        if (gap < MERGE_GAP_SECONDS) {
            current.end = next.end;
        } else {
            mergedIntervals.push(current);
            current = { ...next };
        }
    }
    mergedIntervals.push(current);
    return mergedIntervals;
};

const buildIntervalsFromCondition = (powerData: PowerCurvePoint[], condition: (p: PowerCurvePoint) => boolean): TimeInterval[] => {
    const intervals: TimeInterval[] = [];
    if (powerData.length < 2) return [];
    for (let i = 0; i < powerData.length - 1; i++) {
        const p1 = powerData[i];
        const p2 = powerData[i + 1];
        if (condition(p1)) {
            intervals.push({ start: p1.timestamp!, end: p2.timestamp! });
        }
    }
    return intervals;
};

const getUnionOfIntervals = (intervalLists: TimeInterval[][]): TimeInterval[] => {
    const allIntervals = intervalLists.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
    if (allIntervals.length === 0) return [];

    const union: TimeInterval[] = [];
    let current = { ...allIntervals[0] };
    for (let i = 1; i < allIntervals.length; i++) {
        const next = allIntervals[i];
        if (next.start.getTime() <= current.end.getTime()) {
            current.end = new Date(Math.max(current.end.getTime(), next.end.getTime()));
        } else {
            union.push(current);
            current = { ...next };
        }
    }
    union.push(current);
    return union;
};

const getTotalDurationInSeconds = (intervals: TimeInterval[], dateRange: TimeInterval): number => {
    let total = 0;
    for (const interval of intervals) {
        const start = Math.max(interval.start.getTime(), dateRange.start.getTime());
        const end = Math.min(interval.end.getTime(), dateRange.end.getTime());
        if (start < end) total += (end - start);
    }
    return total / 1000;
};

const calculateOverlapSeconds = (intervalsA: TimeInterval[], intervalsB: TimeInterval[], dateRange: TimeInterval): number => {
    let overlap = 0;
    for (const a of intervalsA) {
        for (const b of intervalsB) {
            const start = Math.max(a.start.getTime(), b.start.getTime(), dateRange.start.getTime());
            const end = Math.min(a.end.getTime(), b.end.getTime(), dateRange.end.getTime());
            if (start < end) overlap += (end - start);
        }
    }
    return overlap / 1000;
};

export const calculateMetrics = (
    logs: TurbineEvent[],
    powerData: PowerCurvePoint[],
    dateRange: { start: Date | null, end: Date | null }
): Metrics => {
    const defaultResult = { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 };
    if (!dateRange.start || !dateRange.end || powerData.length < 2) return defaultResult;
    
    const range: TimeInterval = { start: dateRange.start, end: dateRange.end };
    const T_total = (range.end.getTime() - range.start.getTime()) / 1000;
    if (T_total <= 0) return defaultResult;

    const maintenanceIntervals = getFilteredEventIntervals(logs, 'EVENT_155');
    const repairIntervals = getFilteredEventIntervals(logs, 'EVENT_156');
    const downtimeIntervals = buildIntervalsFromCondition(powerData, p => p.power <= 0);
    const weatherOutageIntervals = buildIntervalsFromCondition(powerData, p => p.power <= 0 && (p.windSpeed < 3 || p.windSpeed > 25));
    const operatingIntervals = buildIntervalsFromCondition(powerData, p => p.power > 0);

    const T_maintenance = getTotalDurationInSeconds(maintenanceIntervals, range);
    const T_weatheroutage = getTotalDurationInSeconds(weatherOutageIntervals, range);
    const T_repairtime = getTotalDurationInSeconds(repairIntervals, range);

    // Düzeltilmiş T_operating hesaplaması
    const T_operating = getTotalDurationInSeconds(operatingIntervals, range);
    // T_downtime'ı da doğrudan hesaplayalım.
    const T_downtime = getTotalDurationInSeconds(downtimeIntervals, range);

    const ao = T_total > 0 ? (T_operating / T_total) * 100 : 0;
    const at_denominator = T_total - T_maintenance - T_weatheroutage;
    const at = at_denominator > 0 ? (T_operating / at_denominator) * 100 : 0;
    
    const numberOfFailures = repairIntervals.length;
    const mtbf_hours = numberOfFailures > 0 && T_operating > 0 ? (T_operating / 3600) / numberOfFailures : 0;
    const mttr_hours = numberOfFailures > 0 ? (T_repairtime / 3600) / numberOfFailures : 0;
    
    let reliabilityR = 100;
    if (T_weatheroutage > 0) {
        const overlap_dt_wot = calculateOverlapSeconds(downtimeIntervals, weatherOutageIntervals, range);
        const overlap_rt_wot = calculateOverlapSeconds(repairIntervals, weatherOutageIntervals, range);
        reliabilityR = (1 - ((overlap_dt_wot + overlap_rt_wot) / T_weatheroutage)) * 100;
    }
    
    const clamp = (num: number) => Math.max(0, Math.min(100, num));
    
    return {
        operationalAvailability: clamp(isFinite(ao) ? parseFloat(ao.toFixed(2)) : 0),
        technicalAvailability: clamp(isFinite(at) ? parseFloat(at.toFixed(2)) : 0),
        mtbf: isFinite(mtbf_hours) ? parseFloat(mtbf_hours.toFixed(2)) : 0,
        mttr: isFinite(mttr_hours) ? parseFloat(mttr_hours.toFixed(2)) : 0,
        reliabilityR: clamp(isFinite(reliabilityR) ? parseFloat(reliabilityR.toFixed(2)) : 0),
    };
};