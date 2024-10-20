import { performSearch, highlightDesignationTextOnly, highlightWordsInRow, unhighlightRow } from './search.js';
$(document).ready(function() {
    const csvUrl = 'https://martincking.github.io/Standards-Selector/Standards_iso.csv';
    let allRows = [];
    let originalRows = [];
    let selectedRowIds = new Set(); // Track selected rows
    let header = []; // Declare header globally
    let rowData = []; // To store original structured data for resetting
    let abstractVisible = true; // Track visibility of column 4 (abstract)

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
            $('#entriesLoaded').text(`(${rows.length} entries loaded)`);

            // Add row selection functionality
            $('#dataTable tbody').on('click', 'tr', function() {
                const rowId = $(this).data('id');
                $(this).toggleClass('selected-row');
                $(this).removeClass('new-row'); // Remove green highlight if it's there

                if ($(this).hasClass('selected-row')) {
                    selectedRowIds.add(rowId);
                } else {
                    selectedRowIds.delete(rowId);
                }
            });
        }
    });

    // Toggle abstract (column 4) visibility
    $('#toggleAbstract').click(function() {
        abstractVisible = !abstractVisible;
        if (abstractVisible) {
            $('td:nth-child(4), th:nth-child(4)').hide();
            $('#toggleAbstract').text('Show Abstract');
        } else {
            $('td:nth-child(4), th:nth-child(4)').show();
            $('#toggleAbstract').text('Hide Abstract');
        }
    });

    // Submit context functionality: search rows based on context input
    $('#submitContext').click(function() {
        const context = $('#keywordInput').val();
        $('#loadingIndicator').show();
        $('#progressMessage').text('Searching...');

        // Reset the table by reconstructing rows from original structured data
        const resetHtml = rowData.map(data => {
            const rowHtml = `<tr data-id="${data.id}">${header.map(col => `<td>${data.content[col]}</td>`).join('')}</tr>`;
            return rowHtml;
        });

        $('#dataTable tbody').html(resetHtml.join(''));

        // Restore selected rows (yellow highlighting)
        $('#dataTable tbody tr').each(function() {
            const rowId = $(this).data('id');
            if (selectedRowIds.has(rowId)) {
                $(this).addClass('selected-row');
            }
        });

        const numbers = extractNumbers(context);
        const keywords = extractKeywords(context);

        matchAndDisplay(numbers);
        matchAndDisplay(keywords);

        performSearch(context, rowData, header, selectedRowIds);

        $('#loadingIndicator').hide();
        $('#progressMessage').text('Search complete.');
        $('#tableContainer').scrollTop(0);
    });

    // Clear context functionality (without affecting selected rows)
    $('#clearContext').click(function() {
        $('#keywordInput').val('');

        $('#dataTable tbody tr').removeClass('new-row');
        $('td span.highlight').each(function() {
            const unwrapped = $(this).text();
            $(this).replaceWith(unwrapped);
        });

        $('#dataTable tbody tr').each(function() {
            const rowId = $(this).data('id');
            if (selectedRowIds.has(rowId)) {
                $(this).addClass('selected-row');
            }
        });
        $('#progressMessage').text('Context cleared.');
    });

    // Reset functionality
    $('#reset').click(function() {
        $('#dataTable tbody').html(originalRows.join(''));
        $('#dataTable tbody tr').removeClass('selected-row new-row');
        selectedRowIds.clear();
        $('#progressMessage').text('Table reset.');
    });

    // **Display all selected rows while keeping other rows below**
    $('#displaySelected').click(function() {
        const selectedRowsHtml = $('#dataTable tbody tr.selected-row').clone();
        const unselectedRowsHtml = $('#dataTable tbody tr').not('.selected-row').clone();

        // Keep the other rows below the selected rows
        $('#dataTable tbody').empty().append(selectedRowsHtml).append(unselectedRowsHtml);
        $('#progressMessage').text(`${selectedRowsHtml.length} selected rows displayed at the top.`);
    });

    // Export selected rows functionality
    $('#export').click(function() {
        let csvContent = header.map(col => `"${col}"`).join(',') + '\n';

        $('#dataTable tbody tr.selected-row').each(function() {
            const row = $(this).find('td').map(function() {
                let cellText = $(this).text().trim();
                return `"${cellText.replace(/"/g, '""')}"`;
            }).get();

            if (row.some(cell => cell.length > 0)) {
                csvContent += row.join(',') + '\n';
            }
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'selected_rows.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Helper functions for number and keyword extraction
    function extractKeywords(context) {
        return context.match(/(?:\w+\s+){0,2}\w+/g) || [];
    }

    function extractNumbers(context) {
        return context.match(/\d+/g) || [];
    }

    function matchAndDisplay(matchingItems) {
        let matchingRows = [];
        $('#dataTable tbody tr').each(function() {
            const rowText = $(this).text().toLowerCase();
            let matchFound = false;

            matchingItems.forEach(item => {
                if (rowText.includes(item.trim().toLowerCase())) {
                    if (!$(this).hasClass('selected-row')) {
                        $(this).addClass('new-row');
                    }
                    matchFound = true;
                }
            });

            if (matchFound) {
                matchingRows.push(this);
            } else {
                $(this).removeClass('new-row');
            }
        });

        $('#dataTable tbody').prepend(matchingRows);
        $('#tableContainer').scrollTop(0);
    }
});
