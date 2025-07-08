import { useEffect } from 'react'
import { useMonitoringStore } from '../store/monitoring'
import { fetchMonitoringData } from '../services/api'

export const useMonitoring = () => {
  const { data, isLoading, error, setData, setLoading, setError } = useMonitoringStore()

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const monitoringData = await fetchMonitoringData()
      setData(monitoringData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    data,
    isLoading,
    error,
    reload: loadData,
  }
}
