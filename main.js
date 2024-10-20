import { performSearch, highlightDesignationTextOnly, highlightWordsInRow, unhighlightRow } from './search.js';
$(document).ready(function() {
    const csvUrl = 'https://martincking.github.io/Standards-Selector/Standards_iso.csv';
    let allRows = [];
    let originalRows = [];
    let selectedRowIds = new Set(); // Track selected rows
    let header = [];
    let rowData = [];
    let abstractVisible = false; // Track abstract visibility

    // Load and parse CSV data with PapaParse
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            header = Object.keys(results.data[0]).slice(0, 5);
            const rows = results.data.map((row, index) => {
                row['id'] = index;
                return row;
            });

            const headerHtml = header.map(col => `<th>${col}</th>`).join('');
            $('#dataTable thead').html(`<tr>${headerHtml}</tr>`);

            allRows = rows.map((row, index) => {
                const link = row[header[4]]; // Get the link from column 5
                if (link && link.trim().startsWith('https://')) {
                    row[header[1]] = `<a href="${link}" target="_blank">${row[header[1]]}</a>`;
                } else {
                    row[header[4]] = ''; // Remove invalid links
                }
                rowData.push({ id: row['id'], content: row });
                return `<tr data-id="${row['id']}">${header.map(col => `<td>${row[col]}</td>`).join('')}</tr>`;
            });

            originalRows = allRows.slice();
            $('#dataTable tbody').html(originalRows.join(''));
        }
    });

    // Show/hide the abstract display area based on abstract column visibility
    $('#toggleAbstract').click(function() {
        abstractVisible = !abstractVisible;
        if (abstractVisible) {
            $('td:nth-child(4), th:nth-child(4)').show();
            $('#toggleAbstract').text('Hide Abstract');
            $('#abstractDisplay').show(); // Show abstract display
        } else {
            $('td:nth-child(4), th:nth-child(4)').hide();
            $('#toggleAbstract').text('Show Abstract');
            $('#abstractDisplay').hide(); // Hide abstract display
        }
    });

    // Submit context functionality (without affecting abstract column visibility)
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

    // Update the abstract content when hovering over or selecting a row
    $('#dataTable tbody').on('mouseenter', 'tr', function() {
        if (abstractVisible) {
            const abstractText = $(this).find('td:nth-child(4)').text().trim();
            $('#abstractContent').text(abstractText || 'No abstract available');
        }
    });

    // Also update the abstract content on row selection
    $('#dataTable tbody').on('click', 'tr', function() {
        if (abstractVisible) {
            const abstractText = $(this).find('td:nth-child(4)').text().trim();
            $('#abstractContent').text(abstractText || 'No abstract available');
        }
    });

    // Other existing functionality...

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
