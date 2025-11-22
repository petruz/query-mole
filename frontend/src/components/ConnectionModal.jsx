import React, { useState, useEffect } from 'react';

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
        username: 'postgres',
        password: '',
    });
    const [testStatus, setTestStatus] = useState(null);

    useEffect(() => {
        if (initialData) {
            // Parse existing URL to extract dbType, host, port if possible
            // Or just use the data as-is for editing
            setFormData({
                ...initialData,
                dbType: initialData.dbType || 'postgresql',
                host: initialData.host || 'localhost',
                port: initialData.port || '5432',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'dbType') {
            // When database type changes, update port to default
            const dbConfig = DATABASE_TYPES.find(db => db.id === value);
            setFormData({
                ...formData,
                dbType: value,
                port: dbConfig.defaultPort.toString()
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
            .replace('{db}', dbConfig.defaultDb);

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
            setTestStatus({ success: false, message: 'Test failed: ' + err.message });
        }
    };

    const handleSave = () => {
        const connData = buildConnectionData();
        if (connData) {
            onSave(connData);
        }
    };

    const selectedDb = DATABASE_TYPES.find(db => db.id === formData.dbType);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-96 p-6">
                <h2 className="text-xl font-bold text-white mb-4">New Connection</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="My Database"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Database Type</label>
                        <select
                            name="dbType"
                            value={formData.dbType}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        >
                            {DATABASE_TYPES.map(db => (
                                <option key={db.id} value={db.id}>
                                    {db.icon} {db.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Host</label>
                            <input
                                name="host"
                                value={formData.host}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                placeholder="localhost"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Port</label>
                            <input
                                name="port"
                                value={formData.port}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                placeholder={selectedDb?.defaultPort.toString()}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                        <input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {selectedDb && (
                        <div className="text-xs text-gray-500 bg-gray-900 p-2 rounded">
                            <div><strong>Database:</strong> {selectedDb.defaultDb}</div>
                            <div><strong>Driver:</strong> {selectedDb.driverClass}</div>
                        </div>
                    )}
                </div>

                {testStatus && (
                    <div className={`mt-4 text-sm ${testStatus.success ? 'text-green-400' : 'text-red-400'}`}>
                        {testStatus.message}
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={handleTest}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                    >
                        Test
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectionModal;
