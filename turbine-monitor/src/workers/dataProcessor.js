// Data processing worker for heavy calculations
self.onmessage = function(e) {
  const { type, data } = e.data

  switch (type) {
    case 'CALCULATE_EFFICIENCY':
      const efficiency = calculateEfficiency(data)
      self.postMessage({ type: 'EFFICIENCY_RESULT', result: efficiency })
      break
      
    case 'PROCESS_CSV_DATA':
      const processed = processCSVData(data)
      self.postMessage({ type: 'CSV_PROCESSED', result: processed })
      break
      
    default:
      console.warn('Unknown worker message type:', type)
  }
}

function calculateEfficiency(turbineData) {
  // Complex efficiency calculation
  const baseEfficiency = turbineData.power / turbineData.maxPower * 100
  const temperatureFactor = Math.max(0, 1 - (turbineData.temperature - 40) / 60)
  const speedFactor = Math.min(1, turbineData.speed / turbineData.optimalSpeed)
  
  return baseEfficiency * temperatureFactor * speedFactor
}

function processCSVData(rawData) {
  // Heavy data processing
  return rawData.map(row => ({
    ...row,
    processed: true,
    timestamp: new Date(row.timestamp).getTime(),
    efficiency: calculateEfficiency(row)
  }))
}
