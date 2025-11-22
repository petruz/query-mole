import React, { useState, useEffect, useRef } from 'react';

const MenuDropdown = ({ label, items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
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
                    ))}
                </div>
            )}
        </div>
    );
};

const MenuBar = ({ onOpenLibrary, onSaveLibrary, onNewConnection, onLoadConnections, onSaveConnections }) => {
    const menuStructure = [
        {
            label: 'File',
            items: [
                { label: 'Open Library', onClick: onOpenLibrary },
                { label: 'Save Library', onClick: onSaveLibrary },
            ]
        },
        {
            label: 'Connection',
            items: [
                { label: 'New Connection', onClick: onNewConnection },
                { label: 'Load Connections', onClick: onLoadConnections },
                { label: 'Save Connections', onClick: onSaveConnections },
            ]
        },
        {
            label: 'Settings',
            items: [
                { label: 'Theme', onClick: () => console.log('Theme') },
            ]
        },
        {
            label: 'Help',
            items: [
                { label: 'About', onClick: () => console.log('About') },
            ]
        }
    ];

    return (
        <div className="flex items-center px-2 py-1 bg-gray-900 border-b border-gray-700 select-none">
            {menuStructure.map((menu, index) => (
                <MenuDropdown key={index} label={menu.label} items={menu.items} />
            ))}
        </div>
    );
};

export default MenuBar;
