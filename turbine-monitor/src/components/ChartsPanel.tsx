import { useTurbineStore } from '../store'
import { TurbineChart } from './TurbineChart'

export const ChartsPanel = () => {
  const { fullData } = useTurbineStore()

  if (!fullData) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TurbineChart
        dataType="power"
        title="Power Output (MW)"
        color="#3b82f6"
      />
      <TurbineChart
        dataType="windSpeed"
        title="Wind Speed (m/s)"
        color="#10b981"
      />
    </div>
  )
}
