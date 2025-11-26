import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Trash2, Database } from 'lucide-react';
import clsx from 'clsx';
import { useDraggable, useDroppable } from '@dnd-kit/core';

const ConnectionSelector = ({ connections, activeConnectionId, onConnectionChange, onDeleteConnection }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const activeConnection = connections.find(c => c.id === activeConnectionId);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id) => {
        onConnectionChange(id);
        setIsOpen(false);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        onDeleteConnection(id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="w-full flex items-center justify-between bg-tree-bg border border-tree-border text-tree-text text-sm rounded px-2 py-1.5 hover:bg-tree-item-hover transition-colors focus:outline-none focus:border-tree-item-selected-text"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 truncate">
                    <Database size={14} className="text-tree-text-muted" />
                    <span className="truncate">
                        {activeConnection ? activeConnection.name : 'Select Connection'}
                    </span>
                </div>
                <ChevronDown size={14} className="text-tree-text-muted" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-tree-bg border border-tree-border rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                    {connections.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-tree-text-muted italic">
                            No connections found
                        </div>
                    ) : (
                        connections.map(conn => (
                            <div
                                key={conn.id}
                                className={clsx(
                                    "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-tree-item-hover group",
                                    conn.id === activeConnectionId ? "bg-tree-item-selected-bg text-tree-item-selected-text" : "text-tree-text"
                                )}
                                onClick={() => handleSelect(conn.id)}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Database size={14} className={conn.id === activeConnectionId ? "text-tree-item-selected-text" : "text-tree-text-muted"} />
                                    <span className="truncate">{conn.name}</span>
                                </div>
                                <button
                                    className="p-1 rounded hover:bg-ui-error-bg hover:text-ui-error-text text-tree-text-muted opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={(e) => handleDelete(e, conn.id)}
                                    title="Delete Connection"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const TreeNode = ({ node, onSelect, selectedId, onContextMenu, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(true); // Default open for easier DnD
    const isFolder = node.type === 'FOLDER';
    const isSelected = node.id === selectedId;

    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: node.id,
        data: { node, level },
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: node.id,
        data: { node, level },
        disabled: !isFolder, // Only folders can receive drops directly (for nesting)
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
    } : undefined;

    const handleClick = (e) => {
        e.stopPropagation();
        if (isFolder) {
            setIsOpen(!isOpen);
        } else {
            onSelect(node);
        }
    };

    const handleContextMenu = (e) => {
        if (onContextMenu) {
            onContextMenu(e, node);
        }
    };

    return (
        <div style={style} className={clsx(isDragging && "opacity-50")}>
            <div
                ref={(node) => {
                    setDragRef(node);
                    if (isFolder) setDropRef(node);
                }}
                {...listeners}
                {...attributes}
                className={clsx(
                    "flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded text-sm select-none transition-colors border border-transparent",
                    isSelected && "bg-tree-item-selected-bg text-tree-item-selected-text hover:opacity-90",
                    !isSelected && "text-tree-text hover:bg-tree-item-hover",
                    isOver && isFolder && "bg-tree-item-selected-bg/50 border-tree-border"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
            >
                <span className="text-tree-text-muted" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
                    {isFolder ? (
                        isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <span className="w-3.5" /> // Spacer
                    )}
                </span>

                {isFolder ? (
                    <Folder size={14} className="text-tree-icon-folder" />
                ) : (
                    <FileText size={14} className="text-tree-icon-file" />
                )}

                <span className="truncate">{node.name}</span>
            </div>

            {isFolder && isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            onSelect={onSelect}
                            selectedId={selectedId}
                            onContextMenu={onContextMenu}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Sidebar = ({ nodes, onSelect, selectedId, onContextMenu, connections, activeConnectionId, onConnectionChange, onDeleteConnection }) => {
    // if (!nodes) return null; // Allow empty nodes if we just want to show connection selector?

    return (
        <div className="flex flex-col h-full">
            {/* Connection Selector */}
            <div className="p-2 border-b border-tree-border bg-tree-bg-secondary">
                <ConnectionSelector
                    connections={connections}
                    activeConnectionId={activeConnectionId}
                    onConnectionChange={onConnectionChange}
                    onDeleteConnection={onDeleteConnection}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5 pb-10">
                {nodes && nodes.map(node => (
                    <TreeNode
                        key={node.id}
                        node={node}
                        onSelect={onSelect}
                        selectedId={selectedId}
                        onContextMenu={onContextMenu}
                    />
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
