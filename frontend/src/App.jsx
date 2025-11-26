import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import QueryEditor from './components/QueryEditor';
import ResultsTable from './components/ResultsTable';
import StatusFooter from './components/StatusFooter';
import MenuBar from './components/MenuBar';
import ContextMenu from './components/ContextMenu';
import InputModal from './components/InputModal';
import ConnectionModal from './components/ConnectionModal';
import AboutModal from './components/AboutModal';
import { Play, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useTheme } from './context/ThemeContext';

function App() {
    // Theme
    const { theme, availableThemes, switchTheme } = useTheme();

    const [treeData, setTreeData] = useState([]);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [sql, setSql] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeDragNode, setActiveDragNode] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Layout State
    const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px
    const [editorHeight, setEditorHeight] = useState(300); // Default 300px
    const [footerHeight, setFooterHeight] = useState(32); // Default 32px
    const [isEditorVisible, setIsEditorVisible] = useState(true);

    // UI State
    const [contextMenu, setContextMenu] = useState(null); // { x, y, node }
    const [modal, setModal] = useState(null); // { type: 'RENAME'|'ADD_FOLDER'|'ADD_QUERY', node?, parentId? }
    const [connectionModal, setConnectionModal] = useState(false);
    const [aboutModal, setAboutModal] = useState(false);

    // Connection State
    const [connections, setConnections] = useState([]);
    const [activeConnectionId, setActiveConnectionId] = useState(null);

    const sidebarRef = useRef(null);
    const editorRef = useRef(null);
    const isResizingSidebar = useRef(false);
    const isResizingEditor = useRef(false);
    const isResizingFooter = useRef(false);

    useEffect(() => {
        // Auto-load state
        const savedConnections = localStorage.getItem('qm_connections');
        const savedActiveId = localStorage.getItem('qm_active_connection_id');
        const savedTree = localStorage.getItem('qm_last_tree');

        if (savedConnections) {
            setConnections(JSON.parse(savedConnections));
        }
        if (savedActiveId) {
            setActiveConnectionId(savedActiveId);
            // Trigger connection if we have one?
            // We might need to wait for connections to be set, but here we can just set the ID.
            // The actual connection logic might need to be triggered explicitly or via effect.
        }
        if (savedTree) {
            setTreeData(JSON.parse(savedTree));
        } else {
            fetchTree();
        }
    }, []);

    useEffect(() => {
        // Auto-save tree to local storage on change
        if (treeData.length > 0) {
            localStorage.setItem('qm_last_tree', JSON.stringify(treeData));
        }
    }, [treeData]);

    useEffect(() => {
        // Attempt to connect when activeConnectionId changes (and connections are loaded)
        if (activeConnectionId && connections.length > 0) {
            const conn = connections.find(c => c.id === activeConnectionId);
            if (conn) {
                connectToDatabase(conn);
                localStorage.setItem('qm_active_connection_id', activeConnectionId);
            }
        }
    }, [activeConnectionId]); // Be careful with dependency on connections if it changes often

    const connectToDatabase = async (conn) => {
        try {
            await axios.post('/api/connection/connect', conn);
            console.log("Connected to", conn.name);
        } catch (err) {
            console.error("Failed to connect", err);
            alert(`Failed to connect to ${conn.name}: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleSaveConnection = (formData) => {
        const newConn = { ...formData, id: uuidv4() };
        const newConnections = [...connections, newConn];
        setConnections(newConnections);
        localStorage.setItem('qm_connections', JSON.stringify(newConnections));
        setConnectionModal(false);
        setActiveConnectionId(newConn.id); // Auto-select new connection
    };

    const handleTestConnection = async (formData) => {
        const response = await axios.post('/api/connection/test', formData);
        return response.data;
    };

    const handleSaveConnectionsToFile = async () => {
        const jsonString = JSON.stringify(connections, null, 2);
        // ... (reuse file saving logic or genericize it)
        try {
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'connections.json',
                    types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
                });
                const writable = await handle.createWritable();
                await writable.write(jsonString);
                await writable.close();
            } else {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
                const a = document.createElement('a');
                a.href = dataStr;
                a.download = "connections.json";
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            if (err.name !== 'AbortError') alert('Failed to save connections');
        }
    };

    const handleLoadConnectionsFromFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    setConnections(json);
                    localStorage.setItem('qm_connections', JSON.stringify(json));
                    if (json.length > 0) setActiveConnectionId(json[0].id);
                } catch (err) {
                    alert("Failed to load connections: Invalid JSON");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Mouse move handler for resizing
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingSidebar.current) {
                const newWidth = e.clientX;
                if (newWidth > 150 && newWidth < 600) setSidebarWidth(newWidth);
            }
            if (isResizingEditor.current && isEditorVisible) {
                const newHeight = e.clientY;
                if (newHeight > 100 && newHeight < window.innerHeight - 100) setEditorHeight(newHeight);
            }
            if (isResizingFooter.current) {
                const newHeight = window.innerHeight - e.clientY;
                if (newHeight > 24 && newHeight < 200) setFooterHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            isResizingSidebar.current = false;
            isResizingEditor.current = false;
            isResizingFooter.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isEditorVisible]);

    const fetchTree = async () => {
        try {
            const response = await axios.get('/api/queries');
            setTreeData(response.data);
        } catch (err) {
            console.error("Failed to fetch query tree", err);
        }
    };

    // --- Tree Operations ---

    const handleNodeContextMenu = (e, node) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    };

    const handleRename = (newName) => {
        if (!modal || !modal.node) return;
        const updateTree = (nodes) => {
            return nodes.map(node => {
                if (node.id === modal.node.id) {
                    return { ...node, name: newName };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };
        setTreeData(updateTree(treeData));
        setModal(null);
    };

    const handleDelete = () => {
        if (!contextMenu || !contextMenu.node) return;
        const nodeId = contextMenu.node.id;
        const deleteFromTree = (nodes) => {
            return nodes.filter(node => node.id !== nodeId).map(node => {
                if (node.children) {
                    return { ...node, children: deleteFromTree(node.children) };
                }
                return node;
            });
        };
        setTreeData(deleteFromTree(treeData));
        if (selectedQuery?.id === nodeId) {
            setSelectedQuery(null);
            setSql('');
        }
        setContextMenu(null);
    };

    const handleAddFolder = (name) => {
        const newFolder = { id: uuidv4(), name, type: 'FOLDER', children: [] };

        if (modal?.parentNode) {
            // Add to parent folder
            const addToParent = (nodes) => {
                return nodes.map(node => {
                    if (node.id === modal.parentNode.id) {
                        return { ...node, children: [...(node.children || []), newFolder] };
                    }
                    if (node.children) {
                        return { ...node, children: addToParent(node.children) };
                    }
                    return node;
                });
            };
            setTreeData(addToParent(treeData));
        } else {
            // Add to root
            setTreeData([...treeData, newFolder]);
        }
        setModal(null);
    };

    const handleAddQuery = (name) => {
        const newQuery = { id: uuidv4(), name, type: 'QUERY', query: 'SELECT * FROM ...', children: [] };

        if (modal?.parentNode) {
            // Add to parent folder
            const addToParent = (nodes) => {
                return nodes.map(node => {
                    if (node.id === modal.parentNode.id) {
                        return { ...node, children: [...(node.children || []), newQuery] };
                    }
                    if (node.children) {
                        return { ...node, children: addToParent(node.children) };
                    }
                    return node;
                });
            };
            setTreeData(addToParent(treeData));
        } else {
            // Add to root
            setTreeData([...treeData, newQuery]);
        }
        setModal(null);
    };

    const handleSaveQuery = () => {
        if (!selectedQuery) return;

        const updateTree = (nodes) => {
            return nodes.map(node => {
                if (node.id === selectedQuery.id) {
                    return { ...node, query: sql };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };

        const newTreeData = updateTree(treeData);
        setTreeData(newTreeData);

        // Update selectedQuery to reflect the saved state so the icon disappears
        setSelectedQuery({ ...selectedQuery, query: sql });
    };

    // --- File Operations ---

    const handleSaveLibrary = async () => {
        const jsonString = JSON.stringify(treeData, null, 2); // Pretty print

        try {
            // Check if the File System Access API is supported
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'query_library.json',
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(jsonString);
                await writable.close();
            } else {
                // Fallback for browsers that don't support the API
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "query_library.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to save library:', err);
                alert('Failed to save library');
            }
        }
    };

    const handleOpenLibrary = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    setTreeData(json);
                } catch (err) {
                    console.error("Invalid JSON", err);
                    alert("Failed to load library: Invalid JSON");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // --- Execution ---

    const handleSelectQuery = (node) => {
        if (node.type === 'QUERY') {
            setSelectedQuery(node);
            setSql(node.query || '');
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

    // --- Resizing Handlers ---
    const startResizingSidebar = () => {
        isResizingSidebar.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };
    const startResizingEditor = () => {
        isResizingEditor.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    };
    const startResizingFooter = () => {
        isResizingFooter.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    };

    const handleDragStart = (event) => {
        setActiveDragNode(event.active.data.current.node);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragNode(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        // Simple logic: If dropped on a folder, move it inside.
        // If dropped on an item, maybe reorder? (Reordering is harder without Sortable)
        // Let's implement "Move to Folder" first.

        const moveNode = (nodes, nodeId, targetFolderId) => {
            let nodeToMove = null;

            // 1. Remove node from old location
            const removeNode = (list) => {
                return list.filter(item => {
                    if (item.id === nodeId) {
                        nodeToMove = item;
                        return false;
                    }
                    if (item.children) {
                        item.children = removeNode(item.children);
                    }
                    return true;
                });
            };

            let newTree = removeNode([...nodes]);

            if (!nodeToMove) return nodes; // Failed to find node

            // 2. Add node to new location
            const addNode = (list) => {
                return list.map(item => {
                    if (item.id === targetFolderId && item.type === 'FOLDER') {
                        return { ...item, children: [...(item.children || []), nodeToMove] };
                    }
                    if (item.children) {
                        return { ...item, children: addNode(item.children) };
                    }
                    return item;
                });
            };

            // If target is root (we can define a special ID or just check if overId is null/special)
            // For now, only drop ON folders.

            return addNode(newTree);
        };

        setTreeData(prev => moveNode(prev, activeId, overId));
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-screen bg-ui-bg-primary text-ui-text-primary overflow-hidden font-sans" onClick={() => setContextMenu(null)}>
                {/* Menu Bar */}
                <MenuBar
                    onOpenLibrary={handleOpenLibrary}
                    onSaveLibrary={handleSaveLibrary}
                    onNewConnection={() => setConnectionModal(true)}
                    onLoadConnections={handleLoadConnectionsFromFile}
                    onSaveConnections={handleSaveConnectionsToFile}
                    onAbout={() => setAboutModal(true)}
                    currentTheme={theme}
                    availableThemes={availableThemes}
                    onThemeChange={switchTheme}
                />

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div
                        className="flex flex-col border-r border-ui-border relative flex-shrink-0"
                        style={{ width: sidebarWidth }}
                    >
                        <div className="p-4 border-b border-tree-border flex justify-between items-center bg-tree-header-bg">
                            <span className="font-bold text-xl tracking-tight text-tree-header-text">Query Mole</span>
                            <div className="flex gap-1">
                                <button onClick={() => setModal({ type: 'ADD_FOLDER' })} className="text-tree-text-muted hover:text-tree-text" title="Add Folder">+</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0"> {/* Removed padding to fit selector */}
                            <Sidebar
                                nodes={treeData}
                                onSelect={handleSelectQuery}
                                selectedId={selectedQuery?.id}
                                onContextMenu={handleNodeContextMenu}
                                connections={connections}
                                activeConnectionId={activeConnectionId}
                                onConnectionChange={setActiveConnectionId}
                            />
                        </div>

                        {/* Sidebar Resizer Handle */}
                        <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-ui-resize-handle transition-colors z-10"
                            onMouseDown={startResizingSidebar}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 h-full">
                        {/* Top: Editor */}
                        <div
                            className="flex flex-col bg-editor-header-bg border-b border-editor-border relative flex-shrink-0"
                            style={{ height: isEditorVisible ? editorHeight : 'auto' }}
                        >
                            <div className="p-2 border-b border-editor-border flex justify-between items-center bg-editor-header-bg select-none">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsEditorVisible(!isEditorVisible)}
                                        className="text-editor-header-text hover:text-editor-text transition-colors focus:outline-none"
                                        title={isEditorVisible ? "Collapse Editor" : "Expand Editor"}
                                    >
                                        {isEditorVisible ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                    <span className="text-sm text-editor-header-text font-medium truncate">
                                        {selectedQuery ? selectedQuery.name : 'Select a query'}
                                    </span>
                                    {selectedQuery && sql !== (selectedQuery.query || '') && (
                                        <button
                                            onClick={handleSaveQuery}
                                            className="text-editor-header-text hover:text-tree-item-selected-text transition-colors"
                                            title="Save Query Change"
                                        >
                                            <Save size={16} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={handleExecute}
                                    disabled={loading || !sql}
                                    className="flex items-center gap-2 bg-editor-button-bg hover:bg-editor-button-hover disabled:bg-editor-button-disabled text-editor-button-text px-4 py-1.5 rounded text-sm font-medium transition-colors"
                                >
                                    <Play size={16} />
                                    Execute
                                </button>
                            </div>

                            {isEditorVisible && (
                                <>
                                    <div className="flex-1 relative overflow-hidden">
                                        <QueryEditor value={sql} onChange={setSql} />
                                    </div>
                                    {/* Editor Resizer Handle */}
                                    <div
                                        className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-ui-resize-handle transition-colors z-10"
                                        onMouseDown={startResizingEditor}
                                    />
                                </>
                            )}
                        </div>

                        {/* Middle: Results */}
                        <div className="flex-1 overflow-hidden bg-grid-bg flex flex-col min-h-0">
                            {error && (
                                <div className="p-4 bg-ui-error-bg text-ui-error-text border-b border-ui-error-border flex-shrink-0">
                                    Error: {error}
                                </div>
                            )}
                            <div className="flex-1 overflow-auto">
                                <ResultsTable results={results} loading={loading} />
                            </div>
                        </div>

                        {/* Bottom: Footer */}
                        <div
                            className="relative bg-ui-bg-secondary border-t border-ui-border flex-shrink-0"
                            style={{ height: footerHeight }}
                        >
                            {/* Footer Resizer Handle */}
                            <div
                                className="absolute top-0 left-0 w-full h-1 cursor-row-resize hover:bg-ui-resize-handle transition-colors z-10"
                                onMouseDown={startResizingFooter}
                            />
                            <StatusFooter
                                executionTime={results?.executionTimeMs}
                                rowCount={results?.rows?.length}
                            />
                        </div>
                    </div>
                </div>

                {/* Modals & Menus */}
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        onRename={() => {
                            setModal({ type: 'RENAME', node: contextMenu.node });
                            setContextMenu(null);
                        }}
                        onDelete={handleDelete}
                        onAddQuery={() => {
                            setModal({ type: 'ADD_QUERY', parentNode: contextMenu.node });
                            setContextMenu(null);
                        }}
                        onAddFolder={() => {
                            setModal({ type: 'ADD_FOLDER', parentNode: contextMenu.node });
                            setContextMenu(null);
                        }}
                        type={contextMenu.node.type}
                    />
                )}

                {modal && (
                    <InputModal
                        title={
                            modal.type === 'RENAME' ? 'Rename Item' :
                                modal.type === 'ADD_FOLDER' ? 'New Folder' : 'New Query'
                        }
                        initialValue={modal.type === 'RENAME' ? modal.node.name : ''}
                        onConfirm={(val) => {
                            if (modal.type === 'RENAME') handleRename(val);
                            else if (modal.type === 'ADD_FOLDER') handleAddFolder(val);
                            else if (modal.type === 'ADD_QUERY') handleAddQuery(val);
                        }}
                        onCancel={() => setModal(null)}
                    />
                )}

                {connectionModal && (
                    <ConnectionModal
                        onSave={handleSaveConnection}
                        onCancel={() => setConnectionModal(false)}
                        onTest={handleTestConnection}
                    />
                )}

                {aboutModal && (
                    <AboutModal onClose={() => setAboutModal(false)} />
                )}

                <DragOverlay>
                    {activeDragNode ? (
                        <div className="px-2 py-1 bg-tree-item-hover rounded shadow text-tree-text opacity-80">
                            {activeDragNode.name}
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext >
    );
}

export default App;
