import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const ResultsTable = ({ results, loading }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;

    // Reset pagination when results change
    React.useEffect(() => {
        setCurrentPage(1);
        setSortConfig({ key: null, direction: 'asc' });
    }, [results]);

    const sortedRows = useMemo(() => {
        if (!results || !results.rows) return [];

        let sortableRows = [...results.rows];
        if (sortConfig.key !== null) {
            sortableRows.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null) return 1;
                if (bValue === null) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableRows;
    }, [results, sortConfig]);

    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return sortedRows.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedRows, currentPage]);

    const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                No results to display
            </div>
        );
    }

    if (results.rows.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Query returned 0 rows.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800 sticky top-0 z-10">
                        <tr>
                            {results.columns.map((col) => (
                                <th
                                    key={col}
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-700 cursor-pointer hover:bg-gray-700 hover:text-white transition-colors select-none group border-r border-gray-700 last:border-r-0"
                                    onClick={() => requestSort(col)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col}
                                        <span className="text-gray-600 group-hover:text-gray-400">
                                            {sortConfig.key === col ? (
                                                sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                            ) : (
                                                <div className="w-3.5 h-3.5" /> // Placeholder to prevent jump
                                            )}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-800">
                        {paginatedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                                {results.columns.map((col) => (
                                    <td
                                        key={`${idx}-${col}`}
                                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-mono border-r border-gray-800 last:border-r-0"
                                    >
                                        {row[col] !== null && row[col] !== undefined
                                            ? String(row[col])
                                            : <span className="text-gray-600 italic">null</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
                    <div className="text-xs text-gray-400">
                        Showing <span className="font-medium text-gray-200">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium text-gray-200">{Math.min(currentPage * rowsPerPage, sortedRows.length)}</span> of <span className="font-medium text-gray-200">{sortedRows.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent text-gray-400 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs text-gray-400 font-mono">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent text-gray-400 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsTable;
