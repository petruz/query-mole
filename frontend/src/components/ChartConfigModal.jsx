import React, { useState, useEffect } from 'react';

const ChartConfigModal = ({ initialConfig, columns = [], onSave, onCancel }) => {
    const [config, setConfig] = useState({
        type: 'line',
        xColumn: 0,
        yColumns: [],
        defaultToChart: false
    });
    const [yColumnsInput, setYColumnsInput] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialConfig) {
            setConfig({
                ...initialConfig,
                defaultToChart: initialConfig.defaultToChart || false
            });
            setYColumnsInput(initialConfig.yColumns.join(', '));
        }
    }, [initialConfig]);

    const validateConfig = () => {
        const newErrors = {};

        // Validate X column
        if (config.xColumn < 0) {
            newErrors.xColumn = 'X column must be non-negative';
        } else if (columns.length > 0 && config.xColumn >= columns.length) {
            newErrors.xColumn = `X column must be between 0 and ${columns.length - 1}`;
        }

        // Validate Y columns
        const yColumns = yColumnsInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s, 10));

        if (yColumns.length === 0) {
            newErrors.yColumns = 'At least one Y column is required';
        } else {
            for (const col of yColumns) {
                if (isNaN(col)) {
                    newErrors.yColumns = 'Y columns must be valid numbers';
                    break;
                }
                if (col < 0) {
                    newErrors.yColumns = 'Y columns must be non-negative';
                    break;
                }
                if (columns.length > 0 && col >= columns.length) {
                    newErrors.yColumns = `Y columns must be between 0 and ${columns.length - 1}`;
                    break;
                }
                if (col === config.xColumn) {
                    newErrors.yColumns = 'Y columns cannot include the X column';
                    break;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateConfig()) return;

        const yColumns = yColumnsInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s, 10));

        onSave({
            ...config,
            yColumns
        });
    };

    const getColumnPreview = () => {
        const yColumns = yColumnsInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s, 10))
            .filter(n => !isNaN(n) && n >= 0 && (columns.length === 0 || n < columns.length));

        const xLabel = columns.length > 0 ? columns[config.xColumn] : `Column ${config.xColumn}`;
        const yLabels = yColumns.map(col => columns.length > 0 ? columns[col] : `Column ${col}`);

        return {
            x: xLabel || 'Invalid',
            y: yLabels
        };
    };

    const preview = getColumnPreview();

    return (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50">
            <div className="bg-modal-bg border border-modal-border rounded-lg shadow-xl w-[500px] p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-modal-text mb-4">Configure Chart</h2>

                <div className="space-y-4">
                    {/* Chart Type */}
                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-2">Chart Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="chartType"
                                    value="line"
                                    checked={config.type === 'line'}
                                    onChange={(e) => setConfig({ ...config, type: e.target.value })}
                                    className="text-modal-button-primary-bg focus:ring-modal-button-primary-bg"
                                />
                                <span className="text-modal-text">Line Chart</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="chartType"
                                    value="bar"
                                    checked={config.type === 'bar'}
                                    onChange={(e) => setConfig({ ...config, type: e.target.value })}
                                    className="text-modal-button-primary-bg focus:ring-modal-button-primary-bg"
                                />
                                <span className="text-modal-text">Bar Chart</span>
                            </label>
                        </div>
                    </div>

                    {/* Default View Preference */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="defaultToChart"
                            checked={config.defaultToChart}
                            onChange={(e) => setConfig({ ...config, defaultToChart: e.target.checked })}
                            className="rounded bg-modal-input-bg border-modal-input-border text-modal-button-primary-bg focus:ring-modal-button-primary-bg"
                        />
                        <label htmlFor="defaultToChart" className="text-sm font-medium text-modal-text cursor-pointer select-none">
                            Execute as Chart by default
                        </label>
                    </div>

                    {/* X-Axis Column */}
                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-1">
                            X-Axis Column (0-indexed)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={config.xColumn}
                            onChange={(e) => setConfig({ ...config, xColumn: parseInt(e.target.value, 10) || 0 })}
                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                        />
                        {errors.xColumn && (
                            <p className="text-xs text-red-400 mt-1">{errors.xColumn}</p>
                        )}
                    </div>

                    {/* Y-Axis Columns */}
                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-1">
                            Y-Axis Columns (comma-separated, 0-indexed)
                        </label>
                        <input
                            type="text"
                            value={yColumnsInput}
                            onChange={(e) => setYColumnsInput(e.target.value)}
                            placeholder="e.g., 1, 2, 3"
                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-modal-text-muted mt-1">
                            Enter column indices separated by commas (e.g., "1, 2, 3")
                        </p>
                        {errors.yColumns && (
                            <p className="text-xs text-red-400 mt-1">{errors.yColumns}</p>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="bg-modal-input-bg border border-modal-input-border rounded p-3">
                        <h3 className="text-sm font-medium text-modal-text mb-2">Preview</h3>
                        <div className="space-y-1 text-sm text-modal-text-secondary">
                            <div>
                                <span className="font-medium">X-Axis:</span> {preview.x} (Column {config.xColumn})
                            </div>
                            {preview.y.length > 0 && (
                                <div>
                                    <span className="font-medium">Y-Axis Series:</span>
                                    <ul className="ml-4 mt-1 space-y-0.5">
                                        {preview.y.map((col, idx) => (
                                            <li key={idx}>• {col}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {preview.y.length === 0 && (
                                <div className="text-modal-text-muted italic">No valid Y columns specified</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-transparent border border-modal-input-border text-modal-text-secondary hover:bg-modal-button-secondary-bg transition-colors text-sm font-medium rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-modal-button-primary-bg hover:bg-modal-button-primary-hover text-modal-button-text border border-modal-button-primary-bg rounded text-sm font-medium transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChartConfigModal;
