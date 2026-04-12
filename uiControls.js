function applyGuidanceDropdownFilter() {
    const guidanceDropdown = document.getElementById('guidanceDropdown');
    if (!guidanceDropdown) return;

    if (typeof filterTable === 'function') {
        filterTable();
    } else if (typeof debouncedFilter === 'function') {
        debouncedFilter();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const exportButton = document.getElementById('export');
    const guidanceDropdown = document.getElementById('guidanceDropdown');

    function downloadCSV(filename, rows) {
        const headers = ['ASD Acronym', 'Designation', 'Title of Standard', 'Abstract', 'Link'];

        const escapeCSV = (value) => {
            const text = String(value ?? '');
            if (text.includes('"') || text.includes(',') || text.includes('\n')) {
                return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        };

        const csvContent = [
            headers.join(','),
            ...rows.map(row => [
                escapeCSV(row['ASD Acronym']),
                escapeCSV(row.Designation),
                escapeCSV(row['Title of Standard']),
                escapeCSV(row.Abstract),
                escapeCSV(row.Link)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    if (exportButton) {
        exportButton.addEventListener('click', function () {
            if (!window.allRows || window.allRows.length === 0) return;

            const selectedRows = window.allRows.filter((row, index) => window.selectedRowIds.has(index));

            if (selectedRows.length === 0) {
                alert('No rows selected.');
                return;
            }

            downloadCSV('Selected_Standards.csv', selectedRows);
        });
    }

    if (guidanceDropdown) {
        guidanceDropdown.addEventListener('change', applyGuidanceDropdownFilter);
    }
});