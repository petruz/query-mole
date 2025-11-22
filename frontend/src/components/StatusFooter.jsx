import React from 'react';

const StatusFooter = ({ executionTime, rowCount }) => {
    return (
        <div className="flex items-center gap-6 px-4 py-1 text-xs text-gray-400 bg-gray-800 border-t border-gray-700 h-full select-none">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-500">Execution Time:</span>
                <span className="text-blue-300 font-mono">
                    {executionTime !== undefined ? `${executionTime} ms` : '-'}
                </span>
            </div>
            <div className="h-3 w-px bg-gray-700"></div>
            <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-500">Rows:</span>
                <span className="text-blue-300 font-mono">
                    {rowCount !== undefined ? rowCount : '-'}
                </span>
            </div>
        </div>
    );
};

export default StatusFooter;
