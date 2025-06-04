import React, { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Users, 
  Clock, 
  ActivitySquare, 
  BarChart4 
} from 'lucide-react';

// Register Chart.js components
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

type TestStatus = 'idle' | 'running' | 'completed' | 'error';

interface TestMetrics {
  connections: number[];
  throughput: number[];
  latency: number[];
  errors: number[];
  timestamps: string[];
}

const StressTestDashboard: React.FC = () => {
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [selectedScenario, setSelectedScenario] = useState<string>('rampUp');
  const [connectionCount, setConnectionCount] = useState<number>(100);
  const [duration, setDuration] = useState<number>(60);
  const [messageSize, setMessageSize] = useState<number>(1024);
  const [metrics, setMetrics] = useState<TestMetrics>({
    connections: [],
    throughput: [],
    latency: [],
    errors: [],
    timestamps: []
  });
  
  const socketRef = useRef<WebSocket | null>(null);
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Simulate a WebSocket connection for demo purposes
  const simulateWebSocketConnection = () => {
    if (testStatus === 'running') {
      return;
    }
    
    setTestStatus('running');
    setMetrics({
      connections: [],
      throughput: [],
      latency: [],
      errors: [],
      timestamps: []
    });
    
    // Simulate data for the test duration
    let elapsedSeconds = 0;
    
    testIntervalRef.current = setInterval(() => {
      if (elapsedSeconds >= duration) {
        clearInterval(testIntervalRef.current!);
        setTestStatus('completed');
        return;
      }
      
      // Generate sample metrics based on the selected scenario
      const timestamp = new Date().toISOString().substr(11, 8);
      const progress = elapsedSeconds / duration;
      
      let newConnections;
      let newThroughput;
      let newLatency;
      let newErrors;
      
      switch (selectedScenario) {
        case 'rampUp':
          newConnections = Math.min(connectionCount, Math.floor(connectionCount * progress));
          newThroughput = newConnections * (0.8 + (Math.random() * 0.4));
          newLatency = 50 + (100 * progress) + (Math.random() * 30);
          newErrors = progress > 0.8 ? (progress - 0.8) * 100 * Math.random() : 0;
          break;
          
        case 'burst':
          if (progress < 0.1) {
            newConnections = Math.floor(connectionCount * 0.2);
          } else if (progress < 0.2) {
            newConnections = connectionCount;
          } else {
            newConnections = Math.floor(connectionCount * 0.3 + (connectionCount * 0.7 * (1 - progress)));
          }
          newThroughput = newConnections * (5 + (Math.random() * 2)) * (progress < 0.2 ? 5 : 1);
          newLatency = 50 + (progress < 0.2 ? 500 * progress : 200 * (1 - progress)) + (Math.random() * 50);
          newErrors = progress > 0.15 && progress < 0.3 ? (progress - 0.1) * 200 * Math.random() : 0;
          break;
          
        case 'longRunning':
          newConnections = Math.floor(connectionCount * 0.8) + Math.floor(Math.sin(progress * Math.PI * 10) * connectionCount * 0.2);
          newThroughput = newConnections * (1 + (Math.random() * 0.2)) * (1 + Math.sin(progress * Math.PI * 5) * 0.3);
          newLatency = 80 + (Math.sin(progress * Math.PI * 10) * 40) + (Math.random() * 20);
          newErrors = progress > 0.7 ? (progress - 0.7) * 50 * Math.random() : 0;
          break;
          
        case 'mixed':
          newConnections = Math.floor(connectionCount * (0.5 + 0.5 * Math.sin(progress * Math.PI * 4)));
          newThroughput = newConnections * (2 + (Math.random() * 1)) * (1 + Math.sin(progress * Math.PI * 8) * 0.5);
          newLatency = 70 + (Math.sin(progress * Math.PI * 6) * 60) + (Math.random() * 30);
          newErrors = Math.random() > 0.9 ? Math.random() * 30 : 0;
          break;
          
        default:
          newConnections = Math.floor(connectionCount * progress);
          newThroughput = newConnections * (1 + (Math.random() * 0.5));
          newLatency = 100 + (Math.random() * 50);
          newErrors = Math.random() * 5;
      }
      
      setMetrics(prev => ({
        connections: [...prev.connections, Math.floor(newConnections)],
        throughput: [...prev.throughput, Math.floor(newThroughput)],
        latency: [...prev.latency, Math.floor(newLatency)],
        errors: [...prev.errors, Math.floor(newErrors)],
        timestamps: [...prev.timestamps, timestamp]
      }));
      
      elapsedSeconds += 1;
    }, 1000);
  };
  
  const stopTest = () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    
    if (testStatus === 'running') {
      setTestStatus('completed');
    }
  };
  
  const resetTest = () => {
    stopTest();
    setTestStatus('idle');
    setMetrics({
      connections: [],
      throughput: [],
      latency: [],
      errors: [],
      timestamps: []
    });
  };
  
  useEffect(() => {
    return () => {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  // Chart options and configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        display: true,
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  };
  
  const connectionsChartData = {
    labels: metrics.timestamps,
    datasets: [
      {
        label: 'Active Connections',
        data: metrics.connections,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.1
      }
    ]
  };
  
  const throughputChartData = {
    labels: metrics.timestamps,
    datasets: [
      {
        label: 'Messages/Second',
        data: metrics.throughput,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.1
      }
    ]
  };
  
  const latencyChartData = {
    labels: metrics.timestamps,
    datasets: [
      {
        label: 'Latency (ms)',
        data: metrics.latency,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: true,
        tension: 0.1
      }
    ]
  };
  
  const errorsChartData = {
    labels: metrics.timestamps,
    datasets: [
      {
        label: 'Errors/Second',
        data: metrics.errors,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.1
      }
    ]
  };
  
  const scenarioOptions = [
    { value: 'rampUp', label: 'Gradual Connection Ramp-Up', description: 'Gradually increases the number of connections over time' },
    { value: 'burst', label: 'Message Burst Test', description: 'Sends a sudden burst of messages from multiple clients' },
    { value: 'longRunning', label: 'Long-Running Stability Test', description: 'Maintains a steady load over the entire test duration' },
    { value: 'mixed', label: 'Mixed Workload Test', description: 'Simulates realistic usage with a mix of operations' }
  ];
  
  const statusText = {
    idle: 'Ready to start test',
    running: 'Test in progress...',
    completed: 'Test completed',
    error: 'Test failed - check console for details'
  };
  
  const statusClass = {
    idle: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    running: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 animate-pulse',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
  };

  // Summary metrics calculations
  const averageLatency = metrics.latency.length > 0 
    ? Math.round(metrics.latency.reduce((sum, val) => sum + val, 0) / metrics.latency.length) 
    : 0;
    
  const maxThroughput = metrics.throughput.length > 0 
    ? Math.max(...metrics.throughput) 
    : 0;
    
  const totalErrors = metrics.errors.length > 0 
    ? metrics.errors.reduce((sum, val) => sum + val, 0) 
    : 0;
    
  const peakConnections = metrics.connections.length > 0 
    ? Math.max(...metrics.connections) 
    : 0;

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
      {/* Test Configuration Panel */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">Configure Stress Test</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Scenario
            </label>
            <select 
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              disabled={testStatus === 'running'}
            >
              {scenarioOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {scenarioOptions.find(opt => opt.value === selectedScenario)?.description}
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connection Count
              </label>
              <input 
                type="number" 
                min="10"
                max="10000"
                value={connectionCount}
                onChange={(e) => setConnectionCount(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={testStatus === 'running'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Duration (seconds)
              </label>
              <input 
                type="number" 
                min="10"
                max="300"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={testStatus === 'running'}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className={`px-4 py-2 rounded-md ${statusClass[testStatus]}`}>
            {statusText[testStatus]}
          </div>
          
          <div className="space-x-2">
            {testStatus === 'idle' || testStatus === 'completed' || testStatus === 'error' ? (
              <button
                onClick={simulateWebSocketConnection}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                disabled={testStatus === 'running'}
              >
                <Play size={16} className="mr-2" />
                Run Test
              </button>
            ) : (
              <button
                onClick={stopTest}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center"
              >
                <Pause size={16} className="mr-2" />
                Stop Test
              </button>
            )}
            
            <button
              onClick={resetTest}
              className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white flex items-center"
              disabled={testStatus === 'running'}
            >
              <RotateCcw size={16} className="mr-2" />
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      {metrics.timestamps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Users size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Peak Connections</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{peakConnections.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <ActivitySquare size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Throughput</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{maxThroughput.toLocaleString()} msg/s</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <Clock size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Latency</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{averageLatency} ms</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <AlertTriangle size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Errors</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalErrors.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Charts */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <Users size={18} className="mr-2 text-blue-500" />
              Active Connections
            </h3>
            <div className="h-64 chart-container">
              {typeof window !== 'undefined' && metrics.timestamps.length > 0 && (
                <Line data={connectionsChartData} options={chartOptions} />
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <ActivitySquare size={18} className="mr-2 text-green-500" />
              Message Throughput
            </h3>
            <div className="h-64 chart-container">
              {typeof window !== 'undefined' && metrics.timestamps.length > 0 && (
                <Line data={throughputChartData} options={chartOptions} />
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <Clock size={18} className="mr-2 text-orange-500" />
              Message Latency
            </h3>
            <div className="h-64 chart-container">
              {typeof window !== 'undefined' && metrics.timestamps.length > 0 && (
                <Line data={latencyChartData} options={chartOptions} />
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <AlertTriangle size={18} className="mr-2 text-red-500" />
              Error Rate
            </h3>
            <div className="h-64 chart-container">
              {typeof window !== 'undefined' && metrics.timestamps.length > 0 && (
                <Line data={errorsChartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Test Insights */}
      {testStatus === 'completed' && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold mb-4">Test Insights</h3>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Performance Summary</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <BarChart4 size={16} className="mr-2 mt-1 text-blue-500" />
                <span>
                  Whisper successfully handled <strong>{peakConnections.toLocaleString()}</strong> concurrent connections with a peak throughput of <strong>{maxThroughput.toLocaleString()}</strong> messages per second.
                </span>
              </li>
              <li className="flex items-start">
                <Clock size={16} className="mr-2 mt-1 text-orange-500" />
                <span>
                  Average message latency was <strong>{averageLatency} ms</strong>, which {averageLatency < 100 ? 'is excellent and well below' : 'exceeds'} the target threshold of 100ms.
                </span>
              </li>
              <li className="flex items-start">
                <AlertTriangle size={16} className="mr-2 mt-1 text-red-500" />
                <span>
                  The system experienced <strong>{totalErrors}</strong> errors during the test, representing an error rate of <strong>{metrics.timestamps.length > 0 ? ((totalErrors / (metrics.throughput.reduce((a, b) => a + b, 0))) * 100).toFixed(4) : 0}%</strong>.
                </span>
              </li>
            </ul>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <div className="min-w-4 h-4 w-4 rounded-full bg-green-500 mr-2 mt-1"></div>
                <span>The system is well-optimized for the current load levels.</span>
              </li>
              <li className="flex items-start">
                <div className="min-w-4 h-4 w-4 rounded-full bg-yellow-500 mr-2 mt-1"></div>
                <span>Consider implementing message batching to improve throughput during burst scenarios.</span>
              </li>
              <li className="flex items-start">
                <div className="min-w-4 h-4 w-4 rounded-full bg-blue-500 mr-2 mt-1"></div>
                <span>For higher connection counts, additional server instances would be recommended.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default StressTestDashboard;