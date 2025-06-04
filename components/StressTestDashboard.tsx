import { Chart, registerables } from "chart.js";
import {
    ActivitySquare,
    AlertTriangle,
    BarChart4,
    Clock,
    Pause,
    Play,
    RotateCcw,
    Users,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { io, Socket } from "socket.io-client";

// Register Chart.js components
if (typeof window !== "undefined") {
    Chart.register(...registerables);
}

type TestStatus = "idle" | "running" | "completed" | "error";

interface TestMetrics {
    connections: number[];
    throughput: number[];
    latency: number[];
    errors: number[];
    timestamps: string[];
}

interface RealtimeData {
    timestamp: string;
    active_connections: number;
    successful_operations: number;
    failed_operations: number;
    avg_response_time: number;
    operations_per_second: number;
    total_success: number;
    progress: number;
}

interface ConnectionStatusData {
    status: string;
}

interface TestMessageData {
    message: string;
}

interface TestCompletedData {
    message: string;
    results?: Record<string, unknown>;
}

interface TestErrorData {
    error: string;
    details?: string;
}

interface ProgressUpdateData {
    progress: number;
}

interface ErrorData {
    message: string;
}

interface ReportData {
    [key: string]: unknown;
}

const StressTestDashboard: React.FC = () => {
    const [testStatus, setTestStatus] = useState<TestStatus>("idle");
    const [selectedScenario, setSelectedScenario] = useState<string>("login");
    const [connectionCount, setConnectionCount] = useState<number>(100);
    const [duration, setDuration] = useState<number>(60);
    const [messageSize, setMessageSize] = useState<number>(5);
    const [messageInterval, setMessageInterval] = useState<number>(1.0);
    const [groupsPerTest, setGroupsPerTest] = useState<number>(2);
    const [metrics, setMetrics] = useState<TestMetrics>({
        connections: [],
        throughput: [],
        latency: [],
        errors: [],
        timestamps: [],
    });
    const [testLog, setTestLog] = useState<string[]>([]);
    const [testProgress, setTestProgress] = useState<number>(0);

    const socketRef = useRef<Socket | null>(null);
    const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:53142";

    // Connect to WebSocket server
    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(socketUrl);

        // Set up event listeners
        socketRef.current.on("connect", () => {
            console.log("Connected to WebSocket server");
        });

        socketRef.current.on(
            "connection_status",
            (data: ConnectionStatusData) => {
                console.log("Connection status:", data.status);
            }
        );

        socketRef.current.on("test_started", (data: TestMessageData) => {
            console.log("Test started:", data.message);
            setTestStatus("running");
            setMetrics({
                connections: [],
                throughput: [],
                latency: [],
                errors: [],
                timestamps: [],
            });
            setTestLog([data.message]);
        });

        socketRef.current.on("test_completed", (data: TestCompletedData) => {
            console.log("Test completed:", data);
            setTestStatus("completed");
            setTestLog((prev) => [...prev, data.message]);
        });

        socketRef.current.on("test_error", (data: TestErrorData) => {
            console.error("Test error:", data.error, data.details);
            setTestStatus("error");
            setTestLog((prev) => [
                ...prev,
                `Error: ${data.error}`,
                data.details || "",
            ]);
        });

        socketRef.current.on("test_finished", (data: TestMessageData) => {
            console.log("Test finished:", data.message);
            setTestLog((prev) => [...prev, data.message]);
        });

        socketRef.current.on("test_stopped", (data: TestMessageData) => {
            console.log("Test stopped:", data.message);
            setTestStatus("idle");
            setTestLog((prev) => [...prev, data.message]);
        });

        socketRef.current.on("test_log", (data: TestMessageData) => {
            console.log("Test log:", data.message);
            setTestLog((prev) => [...prev, data.message]);
        });

        socketRef.current.on("progress_update", (data: ProgressUpdateData) => {
            setTestProgress(data.progress);
        });

        socketRef.current.on("realtime_data", (data: RealtimeData) => {
            handleRealtimeData(data);
        });

        socketRef.current.on("report_data", (data: ReportData) => {
            console.log("Report data:", data);
            // Handle final report data if needed
        });

        socketRef.current.on("error", (data: ErrorData) => {
            console.error("Socket error:", data.message);
            setTestLog((prev) => [...prev, `Socket error: ${data.message}`]);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Handle realtime data from WebSocket
    const handleRealtimeData = (data: RealtimeData) => {
        const timestamp = data.timestamp.substring(11, 19); // Extract time part HH:MM:SS

        setMetrics((prev) => ({
            connections: [...prev.connections, data.active_connections],
            throughput: [...prev.throughput, data.operations_per_second],
            latency: [...prev.latency, data.avg_response_time],
            errors: [...prev.errors, data.failed_operations],
            timestamps: [...prev.timestamps, timestamp],
        }));
    };

    // Start the test
    const startTest = () => {
        if (socketRef.current) {
            // Prepare test parameters based on selected scenario
            const testParams: Record<string, string | number> = {
                scenario: selectedScenario,
                num_clients: connectionCount,
                timeout_sec: duration / 2, // Convert to timeout as per backend logic
            };

            // Add scenario-specific parameters
            if (
                selectedScenario === "private_chat" ||
                selectedScenario === "group_chat"
            ) {
                testParams.messages_per_client = messageSize;
                testParams.message_interval_sec = messageInterval;

                if (selectedScenario === "group_chat") {
                    testParams.groups_per_test = groupsPerTest;
                }
            }

            // Start the test
            socketRef.current.emit("start_test", testParams);
        }
    };

    // Stop the test
    const stopTest = () => {
        if (socketRef.current) {
            socketRef.current.emit("stop_test");
        }
    };

    // Reset the test
    const resetTest = () => {
        setTestStatus("idle");
        setMetrics({
            connections: [],
            throughput: [],
            latency: [],
            errors: [],
            timestamps: [],
        });
        setTestLog([]);
        setTestProgress(0);
    };

    // Chart options and configuration
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0,
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: "Time",
                },
            },
            y: {
                display: true,
                beginAtZero: true,
            },
        },
        plugins: {
            legend: {
                display: true,
            },
        },
    };

    const connectionsChartData = {
        labels: metrics.timestamps,
        datasets: [
            {
                label: "Active Connections",
                data: metrics.connections,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                fill: true,
                tension: 0.1,
            },
        ],
    };

    const throughputChartData = {
        labels: metrics.timestamps,
        datasets: [
            {
                label: "Operations/Second",
                data: metrics.throughput,
                borderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                fill: true,
                tension: 0.1,
            },
        ],
    };

    const latencyChartData = {
        labels: metrics.timestamps,
        datasets: [
            {
                label: "Latency (ms)",
                data: metrics.latency,
                borderColor: "rgba(255, 159, 64, 1)",
                backgroundColor: "rgba(255, 159, 64, 0.2)",
                fill: true,
                tension: 0.1,
            },
        ],
    };

    const errorsChartData = {
        labels: metrics.timestamps,
        datasets: [
            {
                label: "Errors/Second",
                data: metrics.errors,
                borderColor: "rgba(255, 99, 132, 1)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                fill: true,
                tension: 0.1,
            },
        ],
    };

    const scenarioOptions = [
        {
            value: "login",
            label: "Login Test",
            description: "Tests user login performance",
        },
        {
            value: "private_chat",
            label: "Private Chat Test",
            description: "Tests private messaging between users",
        },
        {
            value: "group_chat",
            label: "Group Chat Test",
            description: "Tests group messaging performance",
        },
    ];

    const statusText = {
        idle: "Ready to start test",
        running: "Test in progress...",
        completed: "Test completed",
        error: "Test failed - check logs for details",
    };

    const statusClass = {
        idle: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
        running:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 animate-pulse",
        completed:
            "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
        error: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    };

    // Summary metrics calculations
    const averageLatency =
        metrics.latency.length > 0
            ? Math.round(
                  metrics.latency.reduce((sum, val) => sum + val, 0) /
                      metrics.latency.length
              )
            : 0;

    const maxThroughput =
        metrics.throughput.length > 0 ? Math.max(...metrics.throughput) : 0;

    const totalErrors =
        metrics.errors.length > 0
            ? metrics.errors.reduce((sum, val) => sum + val, 0)
            : 0;

    const peakConnections =
        metrics.connections.length > 0 ? Math.max(...metrics.connections) : 0;

    return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
            {/* Test Configuration Panel */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl font-semibold mb-4">
                    Configure Stress Test
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Test Scenario
                        </label>
                        <select
                            value={selectedScenario}
                            onChange={(e) =>
                                setSelectedScenario(e.target.value)
                            }
                            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            disabled={testStatus === "running"}
                        >
                            {scenarioOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {
                                scenarioOptions.find(
                                    (opt) => opt.value === selectedScenario
                                )?.description
                            }
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
                                onChange={(e) =>
                                    setConnectionCount(Number(e.target.value))
                                }
                                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                disabled={testStatus === "running"}
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
                                onChange={(e) =>
                                    setDuration(Number(e.target.value))
                                }
                                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                disabled={testStatus === "running"}
                            />
                        </div>
                    </div>
                </div>

                {/* Additional parameters based on scenario */}
                {(selectedScenario === "private_chat" ||
                    selectedScenario === "group_chat") && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Messages Per Client
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={messageSize}
                                onChange={(e) =>
                                    setMessageSize(Number(e.target.value))
                                }
                                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                disabled={testStatus === "running"}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Message Interval (seconds)
                            </label>
                            <input
                                type="number"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={messageInterval}
                                onChange={(e) =>
                                    setMessageInterval(Number(e.target.value))
                                }
                                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                disabled={testStatus === "running"}
                            />
                        </div>
                    </div>
                )}

                {selectedScenario === "group_chat" && (
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Groups Per Test
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={groupsPerTest}
                            onChange={(e) =>
                                setGroupsPerTest(Number(e.target.value))
                            }
                            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            disabled={testStatus === "running"}
                        />
                    </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                    <div
                        className={`px-4 py-2 rounded-md ${statusClass[testStatus]}`}
                    >
                        {statusText[testStatus]}
                        {testStatus === "running" && (
                            <span className="ml-2">
                                {Math.round(testProgress)}%
                            </span>
                        )}
                    </div>

                    <div className="space-x-2">
                        {testStatus === "idle" ||
                        testStatus === "completed" ||
                        testStatus === "error" ? (
                            <button
                                onClick={startTest}
                                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center"
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
                            disabled={testStatus === "running"}
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
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Peak Connections
                                </p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {peakConnections.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                <ActivitySquare size={20} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Max Throughput
                                </p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {maxThroughput.toLocaleString()} ops/s
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                <Clock size={20} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Avg Latency
                                </p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {averageLatency} ms
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total Errors
                                </p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {totalErrors.toLocaleString()}
                                </p>
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
                            {typeof window !== "undefined" &&
                                metrics.timestamps.length > 0 && (
                                    <Line
                                        data={connectionsChartData}
                                        options={chartOptions}
                                    />
                                )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                            <ActivitySquare
                                size={18}
                                className="mr-2 text-green-500"
                            />
                            Operations Throughput
                        </h3>
                        <div className="h-64 chart-container">
                            {typeof window !== "undefined" &&
                                metrics.timestamps.length > 0 && (
                                    <Line
                                        data={throughputChartData}
                                        options={chartOptions}
                                    />
                                )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                            <Clock size={18} className="mr-2 text-orange-500" />
                            Response Latency
                        </h3>
                        <div className="h-64 chart-container">
                            {typeof window !== "undefined" &&
                                metrics.timestamps.length > 0 && (
                                    <Line
                                        data={latencyChartData}
                                        options={chartOptions}
                                    />
                                )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                            <AlertTriangle
                                size={18}
                                className="mr-2 text-red-500"
                            />
                            Error Rate
                        </h3>
                        <div className="h-64 chart-container">
                            {typeof window !== "undefined" &&
                                metrics.timestamps.length > 0 && (
                                    <Line
                                        data={errorsChartData}
                                        options={chartOptions}
                                    />
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Logs */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-semibold mb-4">Test Logs</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                    {testLog.length > 0 ? (
                        testLog.map((log, index) => (
                            <div key={index} className="mb-1">
                                {log}
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400">
                            No logs available
                        </div>
                    )}
                </div>
            </div>

            {/* Test Insights */}
            {testStatus === "completed" && metrics.timestamps.length > 0 && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-xl font-semibold mb-4">
                        Test Insights
                    </h3>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                            Performance Summary
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <li className="flex items-start">
                                <BarChart4
                                    size={16}
                                    className="mr-2 mt-1 text-blue-500"
                                />
                                <span>
                                    Whisper successfully handled{" "}
                                    <strong>
                                        {peakConnections.toLocaleString()}
                                    </strong>{" "}
                                    concurrent connections with a peak
                                    throughput of{" "}
                                    <strong>
                                        {maxThroughput.toLocaleString()}
                                    </strong>{" "}
                                    operations per second.
                                </span>
                            </li>
                            <li className="flex items-start">
                                <Clock
                                    size={16}
                                    className="mr-2 mt-1 text-orange-500"
                                />
                                <span>
                                    Average response latency was{" "}
                                    <strong>{averageLatency} ms</strong>, which{" "}
                                    {averageLatency < 100
                                        ? "is excellent and well below"
                                        : "exceeds"}{" "}
                                    the target threshold of 100ms.
                                </span>
                            </li>
                            <li className="flex items-start">
                                <AlertTriangle
                                    size={16}
                                    className="mr-2 mt-1 text-red-500"
                                />
                                <span>
                                    The system experienced{" "}
                                    <strong>{totalErrors}</strong> errors during
                                    the test, representing an error rate of{" "}
                                    <strong>
                                        {metrics.timestamps.length > 0 &&
                                        metrics.throughput.reduce(
                                            (a, b) => a + b,
                                            0
                                        ) > 0
                                            ? (
                                                  (totalErrors /
                                                      metrics.throughput.reduce(
                                                          (a, b) => a + b,
                                                          0
                                                      )) *
                                                  100
                                              ).toFixed(4)
                                            : 0}
                                        %
                                    </strong>
                                    .
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-6">
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            {averageLatency < 100 && totalErrors === 0 && (
                                <li className="flex items-start">
                                    <div className="min-w-4 h-4 w-4 rounded-full bg-green-500 mr-2 mt-1"></div>
                                    <span>
                                        The system is well-optimized for the
                                        current load levels.
                                    </span>
                                </li>
                            )}
                            {averageLatency >= 100 && (
                                <li className="flex items-start">
                                    <div className="min-w-4 h-4 w-4 rounded-full bg-yellow-500 mr-2 mt-1"></div>
                                    <span>
                                        Consider optimizing server-side
                                        processing to reduce latency.
                                    </span>
                                </li>
                            )}
                            {totalErrors > 0 && (
                                <li className="flex items-start">
                                    <div className="min-w-4 h-4 w-4 rounded-full bg-red-500 mr-2 mt-1"></div>
                                    <span>
                                        Investigate error causes and implement
                                        error handling improvements.
                                    </span>
                                </li>
                            )}
                            {peakConnections >= connectionCount * 0.8 && (
                                <li className="flex items-start">
                                    <div className="min-w-4 h-4 w-4 rounded-full bg-blue-500 mr-2 mt-1"></div>
                                    <span>
                                        For higher connection counts, additional
                                        server instances would be recommended.
                                    </span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StressTestDashboard;
