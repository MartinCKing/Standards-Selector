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
    highlightSearchTerms($('#asdAcronymSearch').val(), $('#titleSearch').val(), $('#abstractSearch').val());
});

$('#hideAbstract').click(function() {
    !abstractVisible = abstractVisible;
    $('td:nth-child(3), th:nth-child(3)').toggle(abstractVisible);
    $(this).text(abstractVisible ? 'Hide Abstract' : 'Show Abstract');
});

$('#reset').click(function() {
    selectedRowIds.clear();
    $('#asdAcronymSearch, #titleSearch, #abstractSearch').val('');
    loadCSV();
});

$('#clearSelections').click(function() {
    selectedRowIds.clear();
    $('#dataTable tbody tr').removeClass('selected-row');
});

// Populate the designation search field with "MDCG" when the button is clicked
$('#MDCG').click(function () {
    $('#asdAcronymSearch').val('MDCG'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "FDA" when the button is clicked
$('#FDA').click(function () {
    $('#asdAcronymSearch').val('FDA'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ICH" when the button is clicked
$('#ICH').click(function () {
    $('#asdAcronymSearch').val('ICH'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "IMDRF" when the button is clicked
$('#IMDRF').click(function () {
    $('#asdAcronymSearch').val('IMDRF'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "IPEC" when the button is clicked
$('#IPEC').click(function () {
    $('#asdAcronymSearch').val('IPEC'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "EDQM" when the button is clicked
$('#EDQM').click(function () {
    $('#asdAcronymSearch').val('EDQM'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});


// Populate the designation search field with "CIOMS" when the button is clicked
$('#CIOMS').click(function () {
    $('#asdAcronymSearch').val('CIOMS'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ISPE" when the button is clicked
$('#ISPE').click(function () {
    $('#asdAcronymSearch').val('ISPE'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ISO" when the button is clicked
$('#ISO').click(function () {
    $('#asdAcronymSearch').val('ISO'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});


// Populate the designation search field with "IEC" when the button is clicked
$('#IEC').click(function () {
    $('#asdAcronymSearch').val('IEC'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ASTM" when the button is clicked
$('#ASTM').click(function () {
    $('#asdAcronymSearch').val('ASTM'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "CEN" when the button is clicked
$('#CEN').click(function () {
    $('#asdAcronymSearch').val('CEN'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "AAMI" when the button is clicked
$('#AAMI').click(function () {
    $('#asdAcronymSearch').val('AAMI'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "BSI" when the button is clicked
$('#BSI').click(function () {
    $('#asdAcronymSearch').val('BSI'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ANSI" when the button is clicked
$('#ANSI').click(function () {
    $('#asdAcronymSearch').val('ANSI'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "CSA" when the button is clicked
$('#CSA').click(function () {
    $('#asdAcronymSearch').val('CSA'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "IAF" when the button is clicked
$('#IAF').click(function () {
    $('#asdAcronymSearch').val('IAF'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "FDA Consensus Standards" when the button is clicked
$('#FDA_Consensus_Standards').click(function () {
    $('#asdAcronymSearch').val('FDACS'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "NIST" when the button is clicked
$('#NIST').click(function () {
    $('#asdAcronymSearch').val('NIST'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "PIC/S" when the button is clicked
$('#PICS').click(function () {
    $('#asdAcronymSearch').val('PIC/S'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "GHWP" when the button is clicked
$('#GHWP').click(function () {
    $('#asdAcronymSearch').val('GHWP'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});
