import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import clsx from 'clsx';
import { useDraggable, useDroppable } from '@dnd-kit/core';

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

const Sidebar = ({ nodes, onSelect, selectedId, onContextMenu, connections, activeConnectionId, onConnectionChange }) => {
    // if (!nodes) return null; // Allow empty nodes if we just want to show connection selector?

    return (
        <div className="flex flex-col h-full">
            {/* Connection Selector */}
            <div className="p-2 border-b border-tree-border bg-tree-bg-secondary">
                <select
                    className="w-full bg-tree-bg border border-tree-border text-tree-text text-sm rounded px-2 py-1 focus:outline-none focus:border-tree-item-selected-text"
                    value={activeConnectionId || ''}
                    onChange={(e) => onConnectionChange(e.target.value)}
                >
                    <option value="" disabled>Select Connection</option>
                    {connections && connections.map(conn => (
                        <option key={conn.id} value={conn.id}>{conn.name}</option>
                    ))}
                </select>
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
