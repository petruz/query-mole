import { useState, useRef } from 'react';
import axios from 'axios';
import { extractSqlComments } from '../utils/commentExtractor';

/**
 * Custom hook to manage SQL query execution and results
 * Handles SQL state, execution, results, filtering, and exports
 */
export function useQueryExecution(selectedQuery) {
    const [sql, setSql] = useState('');
    const [queryComments, setQueryComments] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterText, setFilterText] = useState('');

    const resultsTableRef = useRef(null);

    // Update SQL when selectedQuery changes
    const updateSqlFromQuery = (query) => {
        if (query && query.type === 'QUERY') {
            const queryText = query.query || '';
            setSql(queryText);
            setQueryComments(extractSqlComments(queryText));
            setResults(null);
            setError(null);
        }
    };

    const handleExecute = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/execute', { sql });
            if (response.data.success) {
                setResults(response.data);
            } else {
                setError(response.data.error);
                setResults(null);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => resultsTableRef.current?.exportToCSV();
    const handleExportExcel = () => resultsTableRef.current?.exportToExcel();
    const handleExportPDF = () => resultsTableRef.current?.exportToPDF();

    return {
        sql,
        setSql,
        queryComments,
        setQueryComments,
        results,
        loading,
        error,
        filterText,
        setFilterText,
        handleExecute,
        resultsTableRef,
        handleExportCSV,
        handleExportExcel,
        handleExportPDF,
        updateSqlFromQuery,
    };
}
