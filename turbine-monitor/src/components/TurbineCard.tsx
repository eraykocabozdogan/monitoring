import type { TurbineData } from '../types'

interface TurbineCardProps {
  turbine: TurbineData
  onClick?: (turbine: TurbineData) => void
}

export const TurbineCard = ({ turbine, onClick }: TurbineCardProps) => {
  const statusColor = {
    online: 'bg-green-100 text-green-800',
    offline: 'bg-red-100 text-red-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick?.(turbine)}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{turbine.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[turbine.status]}`}>
          {turbine.status}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Power:</span>
          <span className="font-semibold text-blue-600">{turbine.power.toFixed(1)} MW</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Speed:</span>
          <span className="font-semibold">{turbine.speed.toFixed(1)} rpm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Temperature:</span>
          <span className="font-semibold">{turbine.temperature.toFixed(1)}°C</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Efficiency:</span>
          <span className="font-semibold text-green-600">{turbine.efficiency.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Last update: {turbine.lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  )
}
