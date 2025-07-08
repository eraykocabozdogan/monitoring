import { useCallback, useRef } from 'react'
import type { ProcessedData, WorkerResponse, KPIMetrics, DateRange, LogEntry } from '../types'

export const useWorker = () => {
  const workerRef = useRef<Worker | null>(null)

  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/turbineData.worker.ts', import.meta.url),
        { type: 'module' }
      )
    }
    return workerRef.current
  }, [])

  const processCSVFile = useCallback(
    (file: File): Promise<ProcessedData> => {
      return new Promise((resolve, reject) => {
        const worker = initWorker()
        
        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.success) {
            resolve(event.data.data)
          } else {
            reject(new Error(event.data.error || 'Worker processing failed'))
          }
          worker.removeEventListener('message', handleMessage)
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage({ type: 'PROCESS_CSV', file })
      })
    },
    [initWorker]
  )

  const recalculateKPIs = useCallback(
    (dateRange: DateRange, logs: LogEntry[]): Promise<KPIMetrics> => {
      return new Promise((resolve, reject) => {
        const worker = initWorker()
        
        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.success && event.data.type === 'RECALCULATION_COMPLETE') {
            resolve(event.data.data)
          } else if (event.data.error) {
            reject(new Error(event.data.error))
          }
          worker.removeEventListener('message', handleMessage)
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage({ 
          type: 'RECALCULATE', 
          payload: { 
            dateRange, 
            allLogs: logs 
          } 
        })
      })
    },
    [initWorker]
  )

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  return {
    processCSVFile,
    recalculateKPIs,
    terminateWorker
  }
}
