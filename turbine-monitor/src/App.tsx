function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Turbine Monitor
          </h1>
          <p className="text-gray-600">
            Real-time monitoring system for wind turbines
          </p>
        </header>
        
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              System Status
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Turbines</span>
                <span className="text-green-600 font-semibold">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Power</span>
                <span className="text-blue-600 font-semibold">1.2 MW</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className="text-green-600 font-semibold">Online</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Performance
            </h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                85%
              </div>
              <div className="text-gray-600">
                Efficiency
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Alerts
            </h2>
            <div className="space-y-2">
              <div className="flex items-center text-yellow-600">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                <span className="text-sm">Maintenance due in 2 days</span>
              </div>
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm">All systems normal</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
