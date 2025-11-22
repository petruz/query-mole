import React, { useState, useEffect } from 'react';

const ConnectionModal = ({ onSave, onCancel, onTest, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        url: 'jdbc:postgresql://localhost:5432/postgres',
        username: 'postgres',
        password: '',
    });
    const [testStatus, setTestStatus] = useState(null); // { success: boolean, message: string }

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTest = async () => {
        setTestStatus({ success: false, message: 'Testing...' });
        try {
            const result = await onTest(formData);
            setTestStatus(result);
        } catch (err) {
            setTestStatus({ success: false, message: 'Test failed: ' + err.message });
        }
    };

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
                        <label className="block text-sm font-medium text-gray-400 mb-1">JDBC URL</label>
                        <input
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="jdbc:postgresql://..."
                        />
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
                        onClick={() => onSave(formData)}
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
