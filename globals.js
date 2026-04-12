// Global variables shared across all scripts
window.AppState = window.AppState || {};
window.AppState.abstractVisible = window.AppState.abstractVisible ?? false;

window.allRows = window.allRows || [];
window.selectedRowIds = window.selectedRowIds || new Set();
window.debounceTimeout = window.debounceTimeout || null;
