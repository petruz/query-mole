import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const MenuDropdown = ({ label, items, hasSubmenu }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setOpenSubmenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className={`px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center gap-1 transition-colors ${isOpen ? 'bg-gray-700 text-white' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {label}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 py-1">
                    {items.map((item, index) => (
                        item.submenu ? (
                            <div
                                key={index}
                                className="relative"
                                onMouseEnter={() => setOpenSubmenu(index)}
                                onMouseLeave={() => setOpenSubmenu(null)}
                            >
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-between"
                                >
                                    {item.label}
                                    <span className="text-xs">▶</span>
                                </button>

                                {openSubmenu === index && (
                                    <div className="absolute left-full top-0 ml-1 w-40 bg-gray-800 border border-gray-700 rounded shadow-lg py-1">
                                        {item.submenu.map((subItem, subIndex) => (
                                            <button
                                                key={subIndex}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-between"
                                                onClick={() => {
                                                    subItem.onClick?.();
                                                    setIsOpen(false);
                                                    setOpenSubmenu(null);
                                                }}
                                            >
                                                <span className="capitalize">{subItem.label}</span>
                                                {subItem.isActive && <Check size={14} className="text-blue-400" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                key={index}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                onClick={() => {
                                    item.onClick?.();
                                    setIsOpen(false);
                                }}
                            >
                                {item.label}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
};

const MenuBar = ({ onOpenLibrary, onSaveLibrary, onNewConnection, onLoadConnections, onSaveConnections, onAbout, currentTheme, availableThemes, onThemeChange }) => {
    return (
        <div className="flex items-center px-2 py-1 bg-gray-900 border-b border-gray-700 select-none">
            <MenuDropdown
                label="File"
                items={[
                    { label: 'Open Library', onClick: onOpenLibrary },
                    { label: 'Save Library', onClick: onSaveLibrary },
                ]}
            />
            <MenuDropdown
                label="Connection"
                items={[
                    { label: 'New Connection', onClick: onNewConnection },
                    { label: 'Load Connections', onClick: onLoadConnections },
                    { label: 'Save Connections', onClick: onSaveConnections },
                ]}
            />
            <MenuDropdown
                label="Options"
                items={[
                    {
                        label: 'Theme',
                        submenu: availableThemes?.map(theme => ({
                            label: theme,
                            isActive: theme === currentTheme,
                            onClick: () => onThemeChange?.(theme)
                        })) || []
                    },
                    { label: 'Settings', onClick: () => alert('Settings - Coming soon!') },
                ]}
            />
            <MenuDropdown
                label="Help"
                items={[
                    { label: 'About', onClick: onAbout },
                ]}
            />
        </div>
    );
};

export default MenuBar;

