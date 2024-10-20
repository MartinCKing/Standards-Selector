import { performSearch, extractKeywords, extractNumbers } from './search.js';

$(document).ready(function () {
    const csvUrl = 'https://martincking.github.io/Standards-Selector/Standards_iso.csv';
    let allRows = [];
    let originalRows = [];
    let selectedRowIds = new Set(); // Track selected rows
    let header = [];
    let abstractVisible = true;
    let rowData = []; // Store original data for resetting

    // Load and parse CSV data
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function (results) {
            header = Object.keys(results.data[0]).slice(0, 5); // Get header (first 5 columns)
            const rows = results.data.map((row, index) => {
                row['id'] = index; // Add unique identifier
                return row;
            });

            const headerHtml = header.map((col) => `<th>${col}</th>`).join('');
            $('#dataTable thead').html(`<tr>${headerHtml}</tr>`);

            allRows = rows.map((row, index) => {
                const link = row[header[4]]; // Get the link from column 5
                if (link && link.trim().startsWith('https://')) {
                    row[header[1]] = `<a href="${link}" target="_blank">${row[header[1]]}</a>`; // Link in the title column
                } else {
                    row[header[4]] = ''; // Remove invalid links
                }
                rowData.push({ id: row['id'], content: row }); // Store original row data
                return `<tr data-id="${row['id']}">${header.map((col) => `<td>${row[col]}</td>`).join('')}</tr>`;
            });

            originalRows = allRows.slice();
            $('#dataTable tbody').html(originalRows.join(''));

            // Row selection functionality
            $('#dataTable tbody').on('click', 'tr', function () {
                const rowId = $(this).data('id');
                $(this).toggleClass('selected-row'); // Toggle yellow highlight
                $(this).removeClass('new-row'); // Remove green highlight if selected

                if (selectedRowIds.has(rowId)) {
                    selectedRowIds.delete(rowId);
                } else {
                    selectedRowIds.add(rowId);
                }
            });
        }
    });

    // Submit context functionality: search based on context input
    $('#submitContext').click(function () {
        const context = $('#keywordInput').val(); // Get context input
        $('#loadingIndicator').show(); // Show loading indicator
        $('#progressMessage').text('Searching...');

        // Reset the table
        const resetHtml = rowData.map((data) => {
            const rowHtml = `<tr data-id="${data.id}">${header.map((col) => `<td>${data.content[col]}</td>`).join('')}</tr>`;
            return rowHtml;
        });
        $('#dataTable tbody').html(resetHtml.join(''));

        // Restore selected rows (yellow highlight)
        $('#dataTable tbody tr').each(function () {
            const rowId = $(this).data('id');
            if (selectedRowIds.has(rowId)) {
                $(this).addClass('selected-row');
            }
        });

        const numbers = extractNumbers(context); // Extract numbers
        const keywords = extractKeywords(context); // Extract keywords

        // Perform search and highlight matching rows in green
        performSearch(context, rowData, header, selectedRowIds); // Call search function from search.js

        $('#loadingIndicator').hide(); // Hide loading indicator
        $('#progressMessage').text('Search complete.');
        $('#tableContainer').scrollTop(0); // Scroll to top of table
    });

    // Reset functionality
    $('#reset').click(function () {
        $('#dataTable tbody tr').removeClass('selected-row new-row');
        selectedRowIds.clear();
        $('#dataTable tbody').html(originalRows.join(''));
    });

    // Clear context functionality
    $('#clearContext').click(function () {
        $('#keywordInput').val(''); // Clear input
        $('#dataTable tbody tr').each(function () {
            if (!$(this).hasClass('selected-row')) {
                $(this).removeClass('new-row'); // Clear green highlight
            }
        });
    });

    // Export functionality
    $('#export').click(function () {
        let csvContent = header.map((col) => `"${col}"`).join(',') + '\n'; // Quote headers

        $('#dataTable tbody tr.selected-row').each(function () {
            const row = $(this).find('td').map(function () {
                let cellText = $(this).text().trim();
                return `"${cellText.replace(/"/g, '""')}"`; // Escape double quotes
            }).get();

            if (row.some((cell) => cell.length > 0)) {
                csvContent += row.join(',') + '\n'; // Format rows
            }
        });

        // Trigger CSV download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.create
