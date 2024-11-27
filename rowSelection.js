// Initialize the set to keep track of selected rows


// Row selection logic
$('#dataTable').on('click', 'tr', function() {
    const rowId = $(this).data('id');  // Get the unique identifier for the row
    const row = $(this);

    // Check if the row is already selected
    if (selectedRowIds.has(rowId)) {
        selectedRowIds.delete(rowId);  // Remove from selected if already selected
        row.removeClass('selected-row').removeClass('match-row');
        console.log(`Row ${rowId} deselected. Current selection:`, Array.from(selectedRowIds));
    } else {
        selectedRowIds.add(rowId);  // Add to selected if not already selected
        row.removeClass('match-row').addClass('selected-row');
        console.log(`Row ${rowId} selected. Current selection:`, Array.from(selectedRowIds));
    }
});

// Export selected rows to CSV
$('#export').click(function() {
    // Do not clear highlights or reset the table

    // Clear search fields to reset the UI input, but keep table as is
    $('#designationSearch, #titleSearch, #abstractSearch').val('');

    let csvContent = 'Designation,Title of Standard,Abstract,Link\n';

    // Loop through each selected row and prepare data for export
    selectedRowIds.forEach(id => {
        const row = allRows[id];
        if (row) {
            const designation = row.Designation || '';
            const title = row['Title of Standard'] || '';
            const abstract = row.Abstract || '';
            const link = row.Link || '';
            csvContent += `"${designation}","${title}","${link}"\n`;
        }
    });

    // Create a Blob from the CSV content and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'selected_rows.csv';
    link.click();
});
