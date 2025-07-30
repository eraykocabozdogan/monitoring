import type { Metrics } from '../types/index';
import type { LightweightLogEvent } from '../store/useAppStore';

interface TimeInterval {
    start: number;
    end: number;
}

const eventCategories: Record<string, 'Downtime' | 'Weather Out Time'> = {
    '1': 'Downtime', '13': 'Downtime', '14': 'Downtime', '15': 'Downtime', '16': 'Downtime',
    '18': 'Downtime', '19': 'Downtime', '22': 'Downtime', '23': 'Downtime', '24': 'Downtime',
    '25': 'Downtime', '27': 'Downtime', '28': 'Downtime', '31': 'Downtime', '34': 'Downtime',
    '35': 'Downtime', '36': 'Downtime', '41': 'Downtime', '42': 'Downtime', '45': 'Downtime',
    '46': 'Downtime', '51': 'Downtime', '52': 'Downtime', '53': 'Downtime', '54': 'Downtime',
    '55': 'Downtime', '56': 'Downtime', '57': 'Downtime', '59': 'Downtime', '63': 'Downtime',
    '65': 'Downtime', '71': 'Downtime', '72': 'Downtime', '75': 'Downtime', '76': 'Downtime',
    '77': 'Downtime', '81': 'Downtime', '82': 'Downtime', '83': 'Downtime', '86': 'Downtime',
    '88': 'Downtime', '97': 'Downtime', '98': 'Downtime', '99': 'Downtime', '100': 'Downtime',
    '102': 'Downtime', '105': 'Downtime', '106': 'Downtime', '107': 'Downtime', '112': 'Downtime',
    '113': 'Downtime', '114': 'Downtime', '115': 'Downtime', '118': 'Downtime', '120': 'Downtime',
    '121': 'Downtime', '122': 'Downtime', '124': 'Downtime', '125': 'Downtime', '129': 'Downtime',
    '130': 'Downtime', '131': 'Downtime', '132': 'Downtime', '133': 'Downtime', '134': 'Downtime',
    '136': 'Downtime', '137': 'Downtime', '139': 'Downtime', '140': 'Downtime', '141': 'Downtime',
    '142': 'Downtime', '145': 'Downtime', '149': 'Downtime', '150': 'Downtime', '157': 'Downtime',
    '163': 'Downtime', '170': 'Downtime', '177': 'Downtime', '179': 'Downtime', '201': 'Downtime',
    '203': 'Downtime', '205': 'Downtime', '208': 'Downtime', '212': 'Downtime', '213': 'Downtime',
    '214': 'Downtime', '222': 'Downtime', '223': 'Downtime', '224': 'Downtime', '232': 'Downtime',
    '235': 'Downtime', '237': 'Downtime', '242': 'Downtime', '243': 'Downtime', '247': 'Downtime',
    '250': 'Downtime', '266': 'Downtime', '270': 'Downtime', '274': 'Downtime', '275': 'Downtime',
    '276': 'Downtime', '288': 'Downtime', '291': 'Downtime', '297': 'Downtime', '311': 'Downtime',
    '323': 'Downtime', '326': 'Downtime', '327': 'Downtime', '334': 'Downtime', '335': 'Downtime',
    '336': 'Downtime', '340': 'Downtime', '341': 'Downtime', '342': 'Downtime', '343': 'Downtime',
    '344': 'Downtime', '346': 'Downtime', '349': 'Downtime', '351': 'Downtime', '352': 'Downtime',
    '353': 'Downtime', '358': 'Downtime', '360': 'Downtime', '365': 'Downtime', '367': 'Downtime',
    '368': 'Downtime', '381': 'Downtime', '382': 'Downtime', '383': 'Downtime', '384': 'Downtime',
    '401': 'Downtime', '418': 'Downtime', '419': 'Downtime', '420': 'Downtime', '426': 'Downtime',
    '434': 'Downtime', '435': 'Downtime', '436': 'Downtime', '437': 'Downtime', '438': 'Downtime',
    '439': 'Downtime', '446': 'Downtime', '447': 'Downtime', '448': 'Downtime', '449': 'Downtime',
    '450': 'Downtime', '478': 'Downtime', '484': 'Downtime', '485': 'Downtime', '486': 'Downtime',
    '504': 'Downtime', '505': 'Downtime', '510': 'Downtime', '538': 'Downtime', '539': 'Downtime',
    '902': 'Downtime', '912': 'Downtime', '913': 'Downtime', '916': 'Downtime',
    '7': 'Weather Out Time', '78': 'Weather Out Time', '146': 'Weather Out Time', '295': 'Weather Out Time',
    '317': 'Weather Out Time', '375': 'Weather Out Time', '445': 'Weather Out Time', '491': 'Weather Out Time',
    '493': 'Weather Out Time', '495': 'Weather Out Time', '497': 'Weather Out Time', '552': 'Weather Out Time',
    '553': 'Weather Out Time',
};

const mergeIntervals = (intervals: TimeInterval[]): TimeInterval[] => {
    if (intervals.length < 2) return intervals;
    intervals.sort((a, b) => a.start - b.start);
    const merged: TimeInterval[] = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
        const last = merged[merged.length - 1];
        const current = intervals[i];
        if (current.start <= last.end) {
            last.end = Math.max(last.end, current.end);
        } else {
            merged.push(current);
        }
    }
    return merged;
};

const calculateOverlapSeconds = (intervalsA: TimeInterval[], intervalsB: TimeInterval[]): number => {
    let overlap = 0;
    const sortedA = [...intervalsA].sort((a, b) => a.start - b.start);
    const sortedB = [...intervalsB].sort((a, b) => a.start - b.start);
    let i = 0;
    let j = 0;
    while (i < sortedA.length && j < sortedB.length) {
        const start = Math.max(sortedA[i].start, sortedB[j].start);
        const end = Math.min(sortedA[i].end, sortedB[j].end);
        if (start < end) {
            overlap += (end - start);
        }
        if (sortedA[i].end < sortedB[j].end) {
            i++;
        } else {
            j++;
        }
    }
    return overlap / 1000;
};

export const calculateMetrics = (
    logs: LightweightLogEvent[],
    dateRange: { start: Date | null, end: Date | null }
): Metrics => {
    const emptyMetrics: Metrics = { operationalAvailability: 0, technicalAvailability: 0, mtbf: 0, mttr: 0, reliabilityR: 0 };
    if (!dateRange.start || !dateRange.end || logs.length < 2) {
        return emptyMetrics;
    }

    const rangeStart = dateRange.start.getTime();
    const rangeEnd = dateRange.end.getTime();
    const T_total_seconds = (rangeEnd - rangeStart) / 1000;
    if (T_total_seconds <= 0) return emptyMetrics;

    const eventsByType: Record<string, LightweightLogEvent[]> = {};
    for (const log of logs) {
        if (log.eventType) {
            if (!eventsByType[log.eventType]) {
                eventsByType[log.eventType] = [];
            }
            eventsByType[log.eventType].push(log);
        }
    }

    const allIntervals: Record<string, TimeInterval[]> = {};

    for (const eventType in eventsByType) {
        const eventLogs = eventsByType[eventType];
        const rawIntervals: TimeInterval[] = [];
        let openEvent: LightweightLogEvent | null = null;

        for (const log of eventLogs) {
             const status = log.status.trim().toUpperCase();
            if (status === 'ON' && !openEvent) {
                openEvent = log;
            } else if (status === 'OFF' && openEvent) {
                rawIntervals.push({ start: openEvent.timestamp!.getTime(), end: log.timestamp!.getTime() });
                openEvent = null;
            }
        }
        
        if (rawIntervals.length === 0) continue;

        rawIntervals.sort((a, b) => a.start - b.start);
        const merged30Min: TimeInterval[] = [rawIntervals[0]];
        for (let i = 1; i < rawIntervals.length; i++) {
            const last = merged30Min[merged30Min.length - 1];
            const current = rawIntervals[i];
            const diffMinutes = (current.start - last.start) / (1000 * 60);

            if (diffMinutes < 30) {
                last.end = Math.max(last.end, current.end);
            } else {
                merged30Min.push(current);
            }
        }
        allIntervals[eventType] = merged30Min;
    }
    
    const categoryIntervals: { [key: string]: TimeInterval[] } = {
        Downtime: [],
        WeatherOutTime: [],
        Maintenance: [],
        Repair: [],
    };
    
    for (const eventType in allIntervals) {
        const eventNumber = eventType.replace(/[^0-9]/g, '');
        const category = eventCategories[eventNumber] || (eventNumber === '155' ? 'Maintenance' : (eventNumber === '156' ? 'Repair' : undefined));
        
        if (category) {
            const targetList = category === 'Downtime' ? categoryIntervals.Downtime :
                               category === 'Weather Out Time' ? categoryIntervals.WeatherOutTime :
                               category === 'Maintenance' ? categoryIntervals.Maintenance :
                               categoryIntervals.Repair;
            targetList.push(...allIntervals[eventType]);
        }
    }

    const downtimeIntervals = mergeIntervals(categoryIntervals.Downtime);
    const weatherOutageIntervals = mergeIntervals(categoryIntervals.WeatherOutTime);
    const maintenanceIntervals = mergeIntervals(categoryIntervals.Maintenance);
    const repairIntervals = mergeIntervals(categoryIntervals.Repair);

    const getTotalDurationInSeconds = (intervals: TimeInterval[]) => {
        return intervals.reduce((acc, curr) => {
            const start = Math.max(curr.start, rangeStart);
            const end = Math.min(curr.end, rangeEnd);
            return start < end ? acc + (end - start) : acc;
        }, 0) / 1000;
    };

    const T_MT = getTotalDurationInSeconds(maintenanceIntervals);
    const T_RT = getTotalDurationInSeconds(repairIntervals);
    const T_WOT = getTotalDurationInSeconds(weatherOutageIntervals);
    const numberOfFailures = repairIntervals.length;

    const allDowntimePool = [...downtimeIntervals, ...weatherOutageIntervals, ...maintenanceIntervals, ...repairIntervals];
    const mergedTotalDowntimeIntervals = mergeIntervals(allDowntimePool);
    const T_total_downtime_seconds = getTotalDurationInSeconds(mergedTotalDowntimeIntervals);

    const T_operating_seconds = Math.max(0, T_total_seconds - T_total_downtime_seconds);
    
    const ao = T_total_seconds > 0 ? (T_operating_seconds / T_total_seconds) * 100 : 0;

    const at_denominator = T_total_seconds - (T_MT + T_WOT);
    const at = at_denominator > 0 ? (T_operating_seconds / at_denominator) * 100 : 0; 

    const mtbf_hours = numberOfFailures > 0 ? (T_operating_seconds / 3600) / numberOfFailures : 0;
    const mttr_hours = numberOfFailures > 0 ? (T_RT / 3600) / numberOfFailures : 0;
    
    let reliabilityR = 100;
    if (T_WOT > 0) {
        const overlap_dt_wot = calculateOverlapSeconds(downtimeIntervals, weatherOutageIntervals);
        const overlap_rt_wot = calculateOverlapSeconds(repairIntervals, weatherOutageIntervals);
        const total_overlap = overlap_dt_wot + overlap_rt_wot;
        reliabilityR = (1 - (total_overlap / T_WOT)) * 100;
    }
    
    const clamp = (num: number, min = 0, max = 100) => Math.max(min, Math.min(max, num));

    return {
        operationalAvailability: clamp(isFinite(ao) ? parseFloat(ao.toFixed(2)) : 0),
        technicalAvailability: clamp(isFinite(at) ? parseFloat(at.toFixed(2)) : 0),
        mtbf: isFinite(mtbf_hours) ? parseFloat(mtbf_hours.toFixed(2)) : 0,
        mttr: isFinite(mttr_hours) ? parseFloat(mttr_hours.toFixed(2)) : 0,
        reliabilityR: clamp(isFinite(reliabilityR) ? parseFloat(reliabilityR.toFixed(2)) : 0),
    };
};