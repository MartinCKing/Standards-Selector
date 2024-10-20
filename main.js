import { performSearch, highlightDesignationTextOnly, highlightWordsInRow, unhighlightRow } from './search.js';

$(document).ready(function() {
    const csvUrl = 'https://martincking.github.io/Standards-Selector/Standards_iso.csv';
    let allRows = [];
    let originalRows = [];
    let rowData = [];
    let selectedRowIds = new Set(); // Track selected rows
    let header = [];
    let abstractVisible = false; // Abstract is initially hidden
    let totalEntries = 0; // Store total number of entries

    // Load and parse CSV data with PapaParse
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            header = Object.keys(results.data[0]).slice(0, 5); // Get header (first 5 columns)
            const rows = results.data.map((row, index) => {
                row['id'] = index; // Add unique identifier
                return row;
            });

            totalEntries = rows.length; // Set total number of entries
            $('#entriesLoaded').text(`(${totalEntries} entries loaded)`); // Display total entries

            const headerHtml = header.map(col => `<th>${col}</th>`).join('');
            $('#dataTable thead').html(`<tr>${headerHtml}</tr>`);

            allRows = rows.map((row, index) => {
                const link = row[header[4]]; // Get the link from column 5
                if (link && link.trim().startsWith('https://')) {
                    row[header[1]] = `<a href="${link}" target="_blank">${row[header[1]]}</a>`; // Link in the title column
                } else {
                    row[header[4]] = ''; // Remove invalid links
                }
                rowData.push({ id: row['id'], content: row }); // Store original row data
                return `<tr data-id="${row['id']}">${header.map(col => `<td>${row[col]}</td>`).join('')}</tr>`;
            });

            originalRows = allRows.slice();
            $('#dataTable tbody').html(originalRows.join(''));

            // Enable row selection
            $('#dataTable tbody').on('click', 'tr', function() {
                const rowId = $(this).data('id');
                $(this).toggleClass('selected-row'); // Toggle yellow highlight
                $(this).removeClass('new-row'); // Remove green highlight

                if (selectedRowIds.has(rowId)) {
                    selectedRowIds.delete(rowId);
                } else {
                    selectedRowIds.add(rowId);
                }
            });
        }
    });

    // Toggle abstract (column 4) visibility
    $('#toggleAbstract').click(function() {
        abstractVisible = !abstractVisible; // Toggle the state of abstractVisible
        if (abstractVisible) {
            $('td:nth-child(4), th:nth-child(4)').show(); // Show column 4 (Abstract)
            $('#toggleAbstract').text('Hide Abstract');
        } else {
            $('td:nth-child(4), th:nth-child(4)').hide(); // Hide column 4
            $('#toggleAbstract').text('Show Abstract');
        }
    });

    // Submit context and search
    $('#submitContext').click(function() {
        const context = $('#keywordInput').val();
        $('#loadingIndicator').show();
        $('#progressMessage').text('Searching...');

        const resetHtml = rowData.map(data => {
            return `<tr data-id="${data.id}">${header.map(col => `<td>${data.content[col]}</td>`).join('')}</tr>`;
        });

        $('#dataTable tbody').html(resetHtml.join(''));

        // Restore selected rows (yellow highlighting)
        $('#dataTable tbody tr').each(function() {
            const rowId = $(this).data('id');
            if (selectedRowIds.has(rowId)) {
                $(this).addClass('selected-row');
            }
        });

        performSearch(context, rowData, header, selectedRowIds); // Perform keyword-based search
        runSemanticSearch(context); // Run the natural language search

        $('#loadingIndicator').hide();
        $('#progressMessage').text('Search complete.');
    });

    // Display only selected rows but keep unselected rows below
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
    });

    // Clear context functionality (without affecting selected rows)
    $('#clearContext').click(function() {
        $('#keywordInput').val(''); // Clear the keyword input
        $('#dataTable tbody tr').removeClass('new-row'); // Only clear new-row (green)

        // Unhighlight all orange spans
        $('td span.highlight').each(function() {
            const unwrapped = $(this).text(); // Get the text inside the span
            $(this).replaceWith(unwrapped); // Replace the span with plain text
        });

        $('#progressMessage').text('Context cleared.');
    });

    // Reset functionality
    $('#reset').click(function() {
        $('#dataTable tbody').html(originalRows.join(''));
        $('#dataTable tbody tr').removeClass('selected-row new-row');
        selectedRowIds.clear();
        $('#progressMessage').text('Reset complete.');
        $('#entriesLoaded').text(`(${totalEntries} entries loaded)`); // Update total number of entries
    });

    // Export functionality
    $('#export').click(function() {
        let csvContent = header.map(col => `"${col}"`).join(',') + '\n';

        $('#dataTable tbody tr.selected-row').each(function() {
            const row = $(this).find('td').map(function() {
                let cellText = $(this).text().trim();
                return `"${cellText.replace(/"/g, '""')}"`; // Escape double quotes
            }).get();

            if (row.some(cell => cell.length > 0)) {
                csvContent += row.join(',') + '\n';
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

    // Cosine similarity function for semantic search
    function cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
});
