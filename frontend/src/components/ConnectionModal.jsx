import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DATABASE_TYPES = [
    {
        id: 'postgresql',
        name: 'PostgreSQL',
        icon: '🐘',
        defaultPort: 5432,
        defaultDb: 'postgres',
        urlTemplate: 'jdbc:postgresql://{host}:{port}/{db}',
        driverClass: 'org.postgresql.Driver'
    },
    {
        id: 'mysql',
        name: 'MySQL',
        icon: '🐬',
        defaultPort: 3306,
        defaultDb: 'mysql',
        urlTemplate: 'jdbc:mysql://{host}:{port}/{db}',
        driverClass: 'com.mysql.cj.jdbc.Driver'
    },
    {
        id: 'clickhouse',
        name: 'ClickHouse',
        icon: '⚡',
        defaultPort: 8123,
        defaultDb: 'default',
        urlTemplate: 'jdbc:clickhouse://{host}:{port}/{db}',
        driverClass: 'com.clickhouse.jdbc.ClickHouseDriver'
    },
    {
        id: 'oracle',
        name: 'Oracle',
        icon: '🔴',
        defaultPort: 1521,
        defaultDb: 'ORCL',
        urlTemplate: 'jdbc:oracle:thin:@{host}:{port}:{db}',
        driverClass: 'oracle.jdbc.OracleDriver'
    },
];

const ConnectionModal = ({ onSave, onCancel, onTest, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        dbType: 'postgresql',
        host: 'localhost',
        port: '5432',
        database: 'postgres',
        username: 'postgres',
        password: '',
    });
    const [testStatus, setTestStatus] = useState(null);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(true);

    // Fetch available drivers on mount
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const response = await axios.get('/api/connection/drivers');
                setAvailableDrivers(response.data);
                console.log('Available drivers:', response.data);

                // If no drivers available, show warning
                if (response.data.length === 0) {
                    console.warn('No JDBC drivers found in drivers/ folder');
                }
            } catch (error) {
                console.error('Failed to fetch available drivers:', error);
                setAvailableDrivers([]);
            } finally {
                setLoadingDrivers(false);
            }
        };

        fetchDrivers();
    }, []);

    useEffect(() => {
        if (initialData) {
            // Parse existing URL to extract dbType, host, port if possible
            // Or just use the data as-is for editing
            setFormData({
                ...initialData,
                dbType: initialData.dbType || 'postgresql',
                host: initialData.host || 'localhost',
                port: initialData.port || '5432',
                database: initialData.database || 'postgres',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'dbType') {
            // When database type changes, update port and database to defaults
            const dbConfig = DATABASE_TYPES.find(db => db.id === value);
            setFormData({
                ...formData,
                dbType: value,
                port: dbConfig.defaultPort.toString(),
                database: dbConfig.defaultDb
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const buildConnectionData = () => {
        const dbConfig = DATABASE_TYPES.find(db => db.id === formData.dbType);
        if (!dbConfig) {
            alert('Database type not recognized');
            return null;
        }

        const url = dbConfig.urlTemplate
            .replace('{host}', formData.host)
            .replace('{port}', formData.port)
            .replace('{db}', formData.database);

        return {
            name: formData.name,
            url,
            username: formData.username,
            password: formData.password,
            driverClassName: dbConfig.driverClass,
            // Store these for future edits
            dbType: formData.dbType,
            host: formData.host,
            port: formData.port,
            database: formData.database,
        };
    };

    const handleTest = async () => {
        const connData = buildConnectionData();
        if (!connData) return;

        setTestStatus({ success: false, message: 'Testing...' });
        try {
            const result = await onTest(connData);
            setTestStatus(result);
        } catch (err) {
            // Extract detailed error message from response
            let errorMessage = 'Test failed';
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setTestStatus({
                success: false,
                message: 'Connection test failed',
                error: errorMessage,
                details: err.response?.data
            });
        }
    };

    const handleSave = () => {
        const connData = buildConnectionData();
        if (connData) {
            onSave(connData);
        }
    };

    const selectedDb = DATABASE_TYPES.find(db => db.id === formData.dbType);

    // Filter database types to only show those with available drivers
    const availableDbTypes = DATABASE_TYPES.filter(dbType => {
        // If still loading drivers, show all types
        if (loadingDrivers) return true;

        // If no drivers detected, show all types (fallback to classpath drivers)
        if (availableDrivers.length === 0) return true;

        // Check if driver is available
        return availableDrivers.some(driver => driver.databaseType === dbType.id);
    });

    return (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50">
            <div className="bg-modal-bg border border-modal-border rounded-lg shadow-xl w-96 p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-modal-text mb-4">
                    {initialData ? 'Edit Connection' : 'New Connection'}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-1">Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                            placeholder="My Database"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-1">Database Type</label>
                        <select
                            name="dbType"
                            value={formData.dbType}
                            onChange={handleChange}
                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                        >
                            {availableDbTypes.map(db => (
                                <option key={db.id} value={db.id}>
                                    {db.icon} {db.name}
                                </option>
                            ))}
                        </select>
                        {!loadingDrivers && availableDrivers.length > 0 && (
                            <p className="text-xs text-modal-text-muted mt-1">
                                {availableDrivers.length} driver(s) available in drivers/ folder
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-modal-text-muted mb-1">Host</label>
                            <input
                                name="host"
                                value={formData.host}
                                onChange={handleChange}
                                className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                placeholder="localhost"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-modal-text-muted mb-1">Port</label>
                            <input
                                name="port"
                                value={formData.port}
                                onChange={handleChange}
                                className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                placeholder={selectedDb?.defaultPort.toString()}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-1">Database</label>
                        <input
                            name="database"
                            value={formData.database}
                            onChange={handleChange}
                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                            placeholder={selectedDb?.defaultDb}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-1">Username</label>
                        <input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {selectedDb && (
                        <div className="text-xs text-modal-text-muted bg-modal-input-bg p-2 rounded">
                            <div><strong>Driver:</strong> {selectedDb.driverClass}</div>
                            <div><strong>URL:</strong> {selectedDb.urlTemplate
                                .replace('{host}', formData.host)
                                .replace('{port}', formData.port)
                                .replace('{db}', formData.database)}
                            </div>
                        </div>
                    )}
                </div>

                {testStatus && (
                    <div className={`mt-4 p-3 rounded text-sm ${testStatus.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                        <div className={testStatus.success ? 'text-green-400' : 'text-red-400'}>
                            <strong>{testStatus.message}</strong>
                        </div>
                        {testStatus.error && (
                            <div className="text-red-300 mt-2 text-xs">
                                <strong>Error:</strong> {testStatus.error}
                            </div>
                        )}
                        {testStatus.details?.errorType && (
                            <div className="text-red-300 mt-1 text-xs">
                                <strong>Type:</strong> {testStatus.details.errorType}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={handleTest}
                        className="px-4 py-2 bg-modal-button-secondary-bg hover:bg-modal-button-secondary-hover text-modal-button-secondary-text border border-modal-input-border rounded text-sm font-medium transition-colors"
                    >
                        Test
                    </button>
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

export default ConnectionModal;
