import { extractNumbers, extractKeywords, performSearch, matchAndDisplay } from './search.js';

$(document).ready(function() {
    // Other parts of your code remain as they are...

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

    // Clear context functionality
    $('#clearContext').click(function() {
        $('#keywordInput').val(''); // Clear the keyword input
        $('#dataTable tbody tr').removeClass('new-row');

        // Remove any orange highlights for search matches
        $('td span.highlight').each(function() {
            const unwrapped = $(this).text();
            $(this).replaceWith(unwrapped); // Replace the span with plain text
        });

        $('#progressMessage').text('Context cleared.');

        // Maintain abstract visibility after clearing the context
        if (!abstractVisible) {
            $('td:nth-child(4), th:nth-child(4)').hide();
        }
    });

    // Other parts of your code remain as they are...
});
