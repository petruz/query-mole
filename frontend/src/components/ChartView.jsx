import React, { useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const CHART_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
];

const ChartView = ({ results, chartConfig }) => {
    const chartRef = useRef(null);

    if (!results || !results.rows || results.rows.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-modal-text-muted">
                No data to display
            </div>
        );
    }

    if (!chartConfig) {
        return (
            <div className="flex items-center justify-center h-full text-modal-text-muted">
                No chart configuration found. Right-click on the query to configure a chart.
            </div>
        );
    }

    // Validate column indices
    const maxCol = results.columns.length - 1;
    if (chartConfig.xColumn < 0 || chartConfig.xColumn > maxCol) {
        return (
            <div className="flex items-center justify-center h-full text-red-400">
                Invalid X column index: {chartConfig.xColumn}. Must be between 0 and {maxCol}.
            </div>
        );
    }

    for (const yCol of chartConfig.yColumns) {
        if (yCol < 0 || yCol > maxCol) {
            return (
                <div className="flex items-center justify-center h-full text-red-400">
                    Invalid Y column index: {yCol}. Must be between 0 and {maxCol}.
                </div>
            );
        }
    }

    // Transform data for Chart.js
    const xColumnName = results.columns[chartConfig.xColumn];
    const labels = results.rows.map(row => {
        const value = row[xColumnName];
        return value !== null && value !== undefined ? String(value) : '';
    });

    const datasets = chartConfig.yColumns.map((colIndex, i) => {
        const colName = results.columns[colIndex];
        const colorIndex = i % CHART_COLORS.length;
        const color = CHART_COLORS[colorIndex];

        return {
            label: colName,
            data: results.rows.map(row => {
                const value = row[colName];
                // Convert to number, handle null/undefined
                return value !== null && value !== undefined ? Number(value) : null;
            }),
            borderColor: color,
            backgroundColor: chartConfig.type === 'bar' ? color : color + '33', // 20% opacity for line fill
            borderWidth: 2,
            tension: 0.1, // Smooth lines
            fill: chartConfig.type === 'line',
        };
    });

    const data = {
        labels,
        datasets
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'rgb(209, 213, 219)', // text-gray-300
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                ticks: {
                    color: 'rgb(156, 163, 175)', // text-gray-400
                    maxRotation: 45,
                    minRotation: 0
                },
                grid: {
                    color: 'rgba(75, 85, 99, 0.3)' // gray-600 with opacity
                }
            },
            y: {
                ticks: {
                    color: 'rgb(156, 163, 175)' // text-gray-400
                },
                grid: {
                    color: 'rgba(75, 85, 99, 0.3)' // gray-600 with opacity
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    return (
        <div className="w-full h-full p-4">
            <div className="w-full h-full">
                {chartConfig.type === 'line' ? (
                    <Line ref={chartRef} data={data} options={options} />
                ) : (
                    <Bar ref={chartRef} data={data} options={options} />
                )}
            </div>
        </div>
    );
};

export default ChartView;
