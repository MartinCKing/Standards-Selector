document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.querySelector('#dataTable tbody');
    const showSelectedButton = document.getElementById('displaySelected');
    const clearSelectionsButton = document.getElementById('clearSelections');

    if (!window.selectedRowIds) {
        window.selectedRowIds = new Set();
    }

    function getVisibleRows() {
        return Array.from(document.querySelectorAll('#dataTable tbody tr'));
    }

    function refreshSelectedStyling() {
        getVisibleRows().forEach(row => {
            const rowIndex = Number(row.dataset.index);
            row.classList.toggle('selected-row', window.selectedRowIds.has(rowIndex));
        });
    }

    if (tableBody) {
        tableBody.addEventListener('click', function (event) {
            const clickedLink = event.target.closest('a');
            if (clickedLink) return;

            const row = event.target.closest('tr');
            if (!row) return;

            const rowIndex = Number(row.dataset.index);
            if (Number.isNaN(rowIndex)) return;

            if (window.selectedRowIds.has(rowIndex)) {
                window.selectedRowIds.delete(rowIndex);
            } else {
                window.selectedRowIds.add(rowIndex);
            }

            refreshSelectedStyling();
        });
    }

    if (showSelectedButton) {
        showSelectedButton.addEventListener('click', function () {
            if (!window.allRows || window.allRows.length === 0) return;

            const selectedRows = window.allRows.filter((row, index) => window.selectedRowIds.has(index));
            renderTable(selectedRows);

            if (typeof highlightSearchTerms === 'function') {
                const designationSearch = ($('#designationSearch').val() || '').toLowerCase();
                const titleSearch = ($('#titleSearch').val() || '').toLowerCase();
                const abstractSearch = ($('#abstractSearch').val() || '').toLowerCase();
                highlightSearchTerms(designationSearch, titleSearch, abstractSearch);
            }
        });
    }

    if (clearSelectionsButton) {
        clearSelectionsButton.addEventListener('click', function () {
            window.selectedRowIds.clear();

            if (typeof debouncedFilter === 'function') {
                debouncedFilter();
            } else {
                renderTable(window.allRows || []);
            }
        });
    }
});