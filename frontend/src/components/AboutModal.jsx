import React from 'react';

const AboutModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-96 p-6">
                <h2 className="text-2xl font-bold text-white mb-4 text-center">Query Mole</h2>

                <div className="space-y-3 text-gray-300 text-sm">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🦫</div>
                    </div>

                    <div className="border-t border-gray-700 pt-3 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Version:</span>
                            <span className="font-mono">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Year:</span>
                            <span>{new Date().getFullYear()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">License:</span>
                            <span>MIT</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-3">
                        <p className="text-gray-400 text-xs text-center">
                            A database diagnostic tool for executing raw SQL queries, analyzing performance, and managing query libraries.
                        </p>
                    </div>

                    <div className="border-t border-gray-700 pt-3">
                        <div className="text-center">
                            <a
                                href="https://github.com/petruz/query-mole"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                                github.com/petruz/query-mole
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
