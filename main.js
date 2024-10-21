import { performSearch, matchAndDisplay, highlightDesignationTextOnly, highlightWordsInRow, unhighlightRow } from './search.js';

$(document).ready(function() {
    const csvUrl = 'https://martincking.github.io/Standards-Selector/Standards_iso.csv';
    let allRows = [];
    let originalRows = [];
    let selectedRowIds = new Set(); // Use unique identifiers to track selected rows
    let newTopRows = new Set();
    let header = []; // Declare header globally
    let abstractVisible = true; // Track visibility of column 4 (abstract)

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

            // Handle initial abstract visibility
            if (!abstractVisible) {
                $('td:nth-child(4), th:nth-child(4)').hide();
            }
        }
    });

    // Toggle abstract (column 4) visibility
    $('#toggleAbstract').click(function() {
        abstractVisible = !abstractVisible; // Toggle the state

        if (abstractVisible) {
            // Show column 4
            $('td:nth-child(4), th:nth-child(4)').show();
            $('#toggleAbstract').text('Hide Abstract');
        } else {
            // Hide column 4
            $('td:nth-child(4), th:nth-child(4)').hide();
            $('#toggleAbstract').text('Show Abstract');
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

        // Maintain abstract visibility after search
        if (!abstractVisible) {
            $('td:nth-child(4), th:nth-child(4)').hide();
        }

        const numbers = extractNumbers(context);  // Extract numbers from the context
        const keywords = extractKeywords(context);  // Extract keywords from the context

        matchAndDisplay(numbers);  // Match and display rows based on numbers
        matchAndDisplay(keywords);  // Match and display rows based on keywords

        performSearch(context); // Highlight matching keywords and designation in orange

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
            // Remove highlight spans
            const unwrapped = $(this).text(); // Get the text inside the span
            $(this).replaceWith(unwrapped); // Replace the span with plain text
        });

        $('#progressMessage').text('Context cleared.');

        // Maintain abstract visibility after clearing the context
        if (!abstractVisible) {
            $('td:nth-child(4), th:nth-child(4)').hide();
        }
    });

    // Display only selected rows and scroll to the top
    $('#displaySelected').click(function() {
        const selectedHtml = $('#dataTable tbody tr.selected-row').clone();
        const unselectedHtml = $('#dataTable tbody tr').not('.selected-row').clone();

        if (selectedHtml.length === 0) {
            $('#dataTable tbody').html(originalRows.join(''));
            selectedRowIds.clear();
        } else {
            $('#dataTable tbody').empty().append(selectedHtml).append(unselectedHtml);
            $('#tableContainer').scrollTop(0); // Scroll to the top of the table
        }

        // Maintain abstract visibility after displaying selected rows
        if (!abstractVisible) {
            $('td:nth-child(4), th:nth-child(4)').hide();
        }
    });

    // Export selected rows functionality
    $('#export').click(function() {
        let csvContent = header.map(col => `"${col}"`).join(',') + '\n'; // Properly quote the headers

        $('#dataTable tbody tr.selected-row').each(function() {
            const row = $(this).find('td').map(function() {
                let cellText = $(this).text().trim();
                // Quote the text to handle commas within cell data
                return `"${cellText.replace(/"/g, '""')}"`; // Escape any existing double quotes
            }).get();

            if (row.some(cell => cell.length > 0)) {
                csvContent += row.join(',') + '\n'; // Properly format rows
            }
        });

        // Create and trigger the CSV file download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'selected_rows.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Reset functionality
    $('#reset').click(function() {
        $('#dataTable tbody tr').removeClass('selected-row new-row');
        selectedRowIds.clear();
        $('#dataTable tbody').html(originalRows.join(''));
        newTopRows.clear();

        // Maintain abstract visibility after reset
        if (!abstractVisible) {
            $('td:nth-child(4), th:nth-child(4)').hide();
        }
    });
});
