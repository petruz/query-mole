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
            <div className="flex items-center justify-center h-full text-ui-text-muted">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ui-spinner"></div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex items-center justify-center h-full text-ui-text-muted text-sm">
                No results to display
            </div>
        );
    }

    if (results.rows.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-ui-text-secondary text-sm">
                Query returned 0 rows.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-grid-border">
                    <thead className="bg-grid-header-bg sticky top-0 z-10">
                        <tr>
                            {results.columns.map((col) => (
                                <th
                                    key={col}
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-grid-header-text uppercase tracking-wider whitespace-nowrap border-b border-grid-border cursor-pointer hover:bg-grid-header-hover hover:text-grid-text transition-colors select-none group border-r border-grid-border last:border-r-0"
                                    onClick={() => requestSort(col)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col}
                                        <span className="text-ui-text-muted group-hover:text-grid-header-text">
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
                    <tbody className="bg-grid-bg divide-y divide-grid-row-border">
                        {paginatedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-grid-row-hover transition-colors">
                                {results.columns.map((col) => (
                                    <td
                                        key={`${idx}-${col}`}
                                        className="px-4 py-2 whitespace-nowrap text-sm text-grid-text font-mono border-r border-grid-row-border last:border-r-0"
                                    >
                                        {row[col] !== null && row[col] !== undefined
                                            ? String(row[col])
                                            : <span className="text-grid-text-null italic">null</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="bg-grid-pagination-bg border-t border-grid-border px-4 py-2 flex items-center justify-between flex-shrink-0">
                    <div className="text-xs text-grid-pagination-text">
                        Showing <span className="font-medium text-grid-text">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium text-grid-text">{Math.min(currentPage * rowsPerPage, sortedRows.length)}</span> of <span className="font-medium text-grid-text">{sortedRows.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-grid-pagination-button-hover disabled:opacity-50 disabled:hover:bg-transparent text-grid-pagination-text transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs text-grid-pagination-text font-mono">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-grid-pagination-button-hover disabled:opacity-50 disabled:hover:bg-transparent text-grid-pagination-text transition-colors"
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
