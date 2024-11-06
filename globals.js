// Global variables shared across all scripts
let allRows = [];           // Store all data rows
let selectedRowIds = new Set();  // Track selected rows
let abstractVisible = true;  // Track abstract visibility state
let debounceTimeout;         // Timeout for debouncing
