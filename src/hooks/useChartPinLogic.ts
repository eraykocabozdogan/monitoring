import { useCallback } from 'react';
import type { ChartPin, PowerCurvePoint } from '../types';

const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const useChartPinLogic = (powerCurveData: PowerCurvePoint[]) => {
  const createPinData = useCallback((targetTimestamp: Date) => {
    if (powerCurveData.length === 0) {
      return {
        power: 0,
        windSpeed: 0,
        expectedPower: undefined,
        isValid: false,
        message: "not valid data"
      };
    }

    const hasTimeComponent = targetTimestamp.getHours() !== 0 || 
                           targetTimestamp.getMinutes() !== 0 || 
                           targetTimestamp.getSeconds() !== 0;

    if (hasTimeComponent) {
      const thirtyMinutes = 30 * 60 * 1000;
      let closestPoint = null;
      let minDistance = Infinity;

      for (const point of powerCurveData) {
        if (point.timestamp) {
          const distance = Math.abs(point.timestamp.getTime() - targetTimestamp.getTime());
          if (distance <= thirtyMinutes && distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
          }
        }
      }

      if (closestPoint) {
        return {
          power: closestPoint.power,
          windSpeed: closestPoint.windSpeed,
          expectedPower: closestPoint.refPower > 0 ? closestPoint.refPower : undefined,
          isValid: true
        };
      }

      return {
        power: 0,
        windSpeed: 0,
        expectedPower: undefined,
        isValid: false,
        message: "not valid data"
      };
    }

    // For date-only timestamps, calculate daily averages
    const startOfDay = new Date(targetTimestamp);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetTimestamp);
    endOfDay.setHours(23, 59, 59, 999);

    const dayData = powerCurveData.filter(point => 
      point.timestamp && 
      point.timestamp >= startOfDay && 
      point.timestamp <= endOfDay
    );

    if (dayData.length === 0) {
      return {
        power: 0,
        windSpeed: 0,
        expectedPower: undefined,
        isValid: false,
        message: "not valid data"
      };
    }

    const powerSum = dayData.reduce((sum, point) => sum + point.power, 0);
    const windSum = dayData.reduce((sum, point) => sum + point.windSpeed, 0);
    const refPowerSum = dayData.reduce((sum, point) => sum + (point.refPower || 0), 0);
    const refPowerCount = dayData.filter(point => point.refPower > 0).length;

    return {
      power: powerSum / dayData.length,
      windSpeed: windSum / dayData.length,
      expectedPower: refPowerCount > 0 ? refPowerSum / refPowerCount : undefined,
      isValid: true
    };
  }, [powerCurveData]);

  const createChartPin = useCallback((timestamp: Date): ChartPin => {
    const pinData = createPinData(timestamp);
    
    return {
      id: generateId(),
      timestamp,
      power: pinData.power,
      windSpeed: pinData.windSpeed,
      expectedPower: pinData.expectedPower,
      powerValid: pinData.isValid,
      windSpeedValid: pinData.isValid,
      expectedPowerValid: pinData.isValid && pinData.expectedPower !== undefined,
    };
  }, [createPinData]);

  return { createChartPin, generateId };
};
