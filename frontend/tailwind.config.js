/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Tree/Sidebar colors
                tree: {
                    bg: 'var(--tree-bg)',
                    'bg-secondary': 'var(--tree-bg-secondary)',
                    text: 'var(--tree-text)',
                    'text-muted': 'var(--tree-text-muted)',
                    'item-hover': 'var(--tree-item-hover)',
                    'item-selected-bg': 'var(--tree-item-selected-bg)',
                    'item-selected-text': 'var(--tree-item-selected-text)',
                    border: 'var(--tree-border)',
                    'icon-folder': 'var(--tree-icon-folder)',
                    'icon-file': 'var(--tree-icon-file)',
                    'header-bg': 'var(--tree-header-bg)',
                    'header-text': 'var(--tree-header-text)',
                },
                // Query Editor colors
                editor: {
                    bg: 'var(--editor-bg)',
                    text: 'var(--editor-text)',
                    border: 'var(--editor-border)',
                    'header-bg': 'var(--editor-header-bg)',
                    'header-text': 'var(--editor-header-text)',
                    'button-bg': 'var(--editor-button-bg)',
                    'button-hover': 'var(--editor-button-hover)',
                    'button-text': 'var(--editor-button-text)',
                    'button-disabled': 'var(--editor-button-disabled)',
                },
                // Results Grid colors
                grid: {
                    bg: 'var(--grid-bg)',
                    'header-bg': 'var(--grid-header-bg)',
                    'header-text': 'var(--grid-header-text)',
                    'header-hover': 'var(--grid-header-hover)',
                    text: 'var(--grid-text)',
                    'text-null': 'var(--grid-text-null)',
                    border: 'var(--grid-border)',
                    'row-border': 'var(--grid-row-border)',
                    'row-hover': 'var(--grid-row-hover)',
                    'pagination-bg': 'var(--grid-pagination-bg)',
                    'pagination-text': 'var(--grid-pagination-text)',
                    'pagination-button-hover': 'var(--grid-pagination-button-hover)',
                },
                // General UI colors
                ui: {
                    'bg-primary': 'var(--ui-bg-primary)',
                    'bg-secondary': 'var(--ui-bg-secondary)',
                    border: 'var(--ui-border)',
                    'text-primary': 'var(--ui-text-primary)',
                    'text-secondary': 'var(--ui-text-secondary)',
                    'text-muted': 'var(--ui-text-muted)',
                    'error-bg': 'var(--ui-error-bg)',
                    'error-text': 'var(--ui-error-text)',
                    'error-border': 'var(--ui-error-border)',
                    'resize-handle': 'var(--ui-resize-handle)',
                    spinner: 'var(--ui-spinner)',
                },
            },
        },
    },
    plugins: [],
}
