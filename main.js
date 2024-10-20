import { performSearch, highlightDesignationTextOnly, highlightWordsInRow, unhighlightRow } from './search.js';

$(document).ready(function() {
    const csvUrl = 'https://martincking.github.io/Standards-Selector/Standards_iso.csv';
    let allRows = [];
    let originalRows = [];
    let selectedRowIds = new Set(); // Keep track of selected rows
    let header = []; // Declare header globally
    let rowData = []; // To store original structured data for resetting

    // Load and parse CSV data with PapaParse
    Papa.parse(csvUrl, {
        download: true,
        header: true, // If your CSV has a header row
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
                    row[header[1]] = `<a href="${link}" target="_blank">${row[header[1]]}</a>`; // Hyperlink column 2 (designation)
                } else {
                    row[header[4]] = ''; // Remove invalid links
                }
                rowData.push({ id: row['id'], content: row }); // Store original data for resetting
                return `<tr data-id="${row['id']}">${header.map(col => `<td>${row[col]}</td>`).join('')}</tr>`;
            });

            originalRows = allRows.slice(); // Store original rows for resetting
            $('#dataTable tbody').html(originalRows.join(''));

            // Update the number of entries loaded
            $('#entriesLoaded').text(`(${rows.length} entries loaded)`);

            // Add row selection functionality
            $('#dataTable tbody').on('click', 'tr', function() {
                const rowId = $(this).data('id');
                $(this).toggleClass('selected-row');
                if ($(this).hasClass('selected-row')) {
                    selectedRowIds.add(rowId); // Add row ID to selected set
                } else {
                    selectedRowIds.delete(rowId); // Remove row ID from selected set
                }
            });
        }
    });

    // Submit context functionality: search rows based on context input
    $('#submitContext').click(function() {
        const context = $('#keywordInput').val(); // Get the context from the textarea
        $('#loadingIndicator').show(); // Show the loading indicator
        $('#progressMessage').text('Searching...');

        // Reset the table by reconstructing rows from original structured data
        const resetHtml = rowData.map(data => {
            const rowHtml = `<tr data-id="${data.id}">${header.map(col => `<td>${data.content[col]}</td>`).join('')}</tr>`;
            return rowHtml;
        });

        // Apply the reset HTML back to the table
        $('#dataTable tbody').html(resetHtml.join(''));

        // Restore selected rows (yellow highlighting)
        $('#dataTable tbody tr').each(function() {
            const rowId = $(this).data('id');
            if (selectedRowIds.has(rowId)) {
                $(this).addClass('selected-row'); // Restore yellow highlight for selected rows
            }
        });

        const numbers = extractNumbers(context);  // Extract numbers from the context
        const keywords = extractKeywords(context);  // Extract keywords from the context

        matchAndDisplay(numbers);  // Match and display rows based on numbers
        matchAndDisplay(keywords);  // Match and display rows based on keywords

        performSearch(context, rowData, header, selectedRowIds); // Call the separated search function

        $('#loadingIndicator').hide(); // Hide the loading indicator
        $('#progressMessage').text('Search complete.');

        // Scroll to the top of the table
        $('#tableContainer').scrollTop(0);
    });

    // Clear context functionality (without affecting selected rows)
    $('#clearContext').click(function() {
        $('#keywordInput').val(''); // Clear the keyword input

        // Only remove new-row (green) and search highlights (orange) but keep selected rows (yellow)
        $('#dataTable tbody tr').removeClass('new-row');

        // Remove any orange highlights for search matches
        $('td span.highlight').each(function() {
            const unwrapped = $(this).text();
            $(this).replaceWith(unwrapped); // Replace the span with plain text
        });

        // Keep selected rows intact (yellow highlighting should remain)
        $('#dataTable tbody tr').each(function() {
            const rowId = $(this).data('id');
            if (selectedRowIds.has(rowId)) {
                $(this).addClass('selected-row'); // Reapply yellow highlight
            }
        });

        $('#progressMessage').text('Context cleared.');
    });

    // Helper functions (Extracting Numbers, Keywords)
    function extractKeywords(context) {
        return context.match(/(?:\w+\s+){0,2}\w+/g) || []; // Extract groups of 1-3 words
    }

    function extractNumbers(context) {
        return context.match(/\d+/g) || []; // Extract numbers
    }

    // Function to match and display rows based on search criteria
    function matchAndDisplay(matchingItems) {
        let matchingRows = [];
        $('#dataTable tbody tr').each(function() {
            const rowText = $(this).text().toLowerCase();
            let matchFound = false;

            matchingItems.forEach(item => {
                if (rowText.includes(item.trim().toLowerCase())) {
                    if (!$(this).hasClass('selected-row')) { // Do not overwrite yellow (selected rows)
                        $(this).addClass('new-row'); // Highlight the row in green
                    }
                    matchFound = true;
                }
            });

            if (matchFound) {
                matchingRows.push(this); // Collect matching rows
            } else {
                $(this).removeClass('new-row'); // Remove green highlight from non-matching rows
            }
        });

        $('#dataTable tbody').prepend(matchingRows);
        $('#tableContainer').scrollTop(0);
    }
});
