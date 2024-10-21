import { performSearch, extractKeywordsWithNLP, extractNumbers } from './search.js';

$(document).ready(function() {
    const csvUrl = 'https://martincking.github.io/Standards-Selector/Standards_iso.csv';
    let allRows = [];
    let originalRows = [];
    let selectedRowIds = new Set(); // Track selected rows
    let header = [];
    let abstractVisible = true; // Track visibility of column 4 (abstract)
    let rowData = []; // To store original structured data for resetting

    // Load and parse CSV data with PapaParse
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            header = Object.keys(results.data[0]).slice(0, 5); // Get header (first 5 columns)
            const rows = results.data.map((row, index) => {
                row['id'] = index; // Add a unique identifier (row ID)
                return row;
            });

            // Create table header
            const headerHtml = header.map(col => `<th>${col}</th>`).join('');
            $('#dataTable thead').html(`<tr>${headerHtml}</tr>`);

            // Create table rows and store original data
            allRows = rows.map((row, index) => {
                const link = row[header[4]]; // Get the link from column 5
                if (link && link.trim().startsWith('https://')) {
                    row[header[1]] = `<a href="${link}" target="_blank">${row[header[1]]}</a>`; // Hyperlink column 2
                } else {
                    row[header[4]] = ''; // Remove invalid links
                }
                rowData.push({ id: row['id'], content: row }); // Store original data for resetting
                return `<tr data-id="${row['id']}">${header.map(col => `<td>${row[col]}</td>`).join('')}</tr>`;
            });

            originalRows = allRows.slice(); // Store original rows for resetting
            $('#dataTable tbody').html(originalRows.join(''));

            // Update the number of entries loaded
            const entryCount = rows.length - 1; // Number of entries minus 1
            $('#entriesLoaded').text(`(${entryCount} entries loaded)`);

            // Add row selection functionality
            $('#dataTable tbody').on('click', 'tr', function() {
                const rowId = $(this).data('id'); // Use the unique identifier
                $(this).toggleClass('selected-row');
                $(this).removeClass('new-row'); // Remove the "new-row" class if it's highlighted green

                // Toggle selection in the selectedRowIds set
                if (selectedRowIds.has(rowId)) {
                    selectedRowIds.delete(rowId); // Remove the row if it's already selected
                } else {
                    selectedRowIds.add(rowId); // Add the row if it's not selected
                }
            });
        }
    });

    // Toggle abstract (column 4) visibility
    $('#toggleAbstract').click(function() {
        abstractVisible = !abstractVisible; // Toggle the state

        if (abstractVisible) {
            $('td:nth-child(4), th:nth-child(4)').show();
            $('#toggleAbstract').text('Hide Abstract');
        } else {
            $('td:nth-child(4), th:nth-child(4)').hide();
            $('#toggleAbstract').text('Show Abstract');
        }
    });

    // Submit context functionality: search rows based on context input
    $('#submitContext').click(function() {
        const context = $('#keywordInput').val(); // Get the context from the textarea
        $('#loadingIndicator').show(); // Show the loading indicator
        $('#progressMessage').text('Searching...');

        // Extract numbers and keywords using the imported functions
        const numbers = extractNumbers(context);  // Extract numbers from the context
        const refinedKeywords = extractKeywordsWithNLP(context);  // Extract keywords using NLP

        // Use performSearch function from search.js to apply the search logic
        performSearch(context, rowData, header, selectedRowIds, abstractVisible);

        $('#loadingIndicator').hide(); // Hide the loading indicator
        $('#progressMessage').text('Search complete.');

        // Scroll to the top of the table
        $('#tableContainer').scrollTop(0);
    });

    // Other functionality (clear context, reset, export) should remain the same
});
