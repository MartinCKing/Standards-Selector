$('#displaySelected').click(function() {
    const selectedRows = [];
    const nonSelectedRows = [];
    allRows.forEach(row => {
        const globalIndex = allRows.indexOf(row);
        if (selectedRowIds.has(globalIndex)) {
            selectedRows.push(row);
        } else {
            nonSelectedRows.push(row);
        }
    });
    const sortedData = selectedRows.concat(nonSelectedRows);
    renderTable(sortedData);
    highlightSearchTerms($('#designationSearch').val(), $('#titleSearch').val(), $('#abstractSearch').val());
});

$('#hideAbstract').click(function() {
    abstractVisible = !abstractVisible;
    $('td:nth-child(3), th:nth-child(3)').toggle(abstractVisible);
    $(this).text(abstractVisible ? 'Hide Abstract' : 'Show Abstract');
});

$('#reset').click(function() {
    selectedRowIds.clear();
    $('#designationSearch, #titleSearch, #abstractSearch').val('');
    loadCSV();
});

$('#clearSelections').click(function() {
    selectedRowIds.clear();
    $('#dataTable tbody tr').removeClass('selected-row');
});
