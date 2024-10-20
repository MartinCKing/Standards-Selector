// search.js

export function extractNumbers(context) {
    const numberPattern = /\d+/g;
    return context.match(numberPattern) || [];
}

export function extractKeywords(context) {
    return context.split(/\s+/).filter(keyword => keyword.length > 2);
}

export function performSearch(context, rowData, header, selectedRowIds) {
    const numbers = extractNumbers(context); // Extract numbers
    const keywords = extractKeywords(context); // Extract keywords

    $('#dataTable tbody tr').each(function () {
        const rowId = $(this).data('id');
        const rowContent = rowData.find(data => data.id === rowId).content;

        const matchedNumbers = numbers.some(number => 
            Object.values(rowContent).some(value => value.includes(number))
        );
        const matchedKeywords = keywords.some(keyword => 
            Object.values(rowContent).some(value => value.includes(keyword))
        );

        if (matchedNumbers || matchedKeywords) {
            $(this).addClass('new-row'); // Highlight matching rows in green
        } else {
            $(this).removeClass('new-row');
        }

        // Restore previously selected rows
        if (selectedRowIds.has(rowId)) {
            $(this).addClass('selected-row');
        }
    });
}
