// Function to extract keywords from the context
export function extractKeywords(context) {
    return context.match(/\b(?:\w+\s?){1,3}\b/g) || []; // Extract groups of 1-3 words
}

// Function to extract complex designations like "BS EN ISO 10993-18:2020+A1:2023"
export function extractNumbers(context) {
    return context.match(/\b(?:[A-Z]{2,}\s+)?(?:ISO|IEC|EN|MDCG|IAF|ICH|NEMA|GB\/T|ASTM|DS|AAMI|NITA|NIST|BS|CSA|CEN|TC|TR|TIR|CLC|JTC)?\s?\d{4}(?:[-\/:+]\d{1,4})*(?:\s+\+\s+[A-Z]\d*:\d+)?\b/gi) || [];
}

// Function to perform the search and highlight matched rows based on keywords and numbers
export function searchRows(context) {
    const numbers = extractNumbers(context);
    const keywords = extractKeywords(context);

    // Clear previous highlights
    $('#dataTable tbody tr').each(function() {
        $(this).removeClass('new-row').removeClass('keyword-match').removeClass('number-match');
        $(this).find('td').each(function() {
            $(this).html($(this).text()); // Remove existing highlights
        });
    });

    // Find and highlight matching rows
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const rowText = row.text().toLowerCase();
        let isNumberMatch = false;
        let isKeywordMatch = false;

        // Check for number matches in the designation column
        const designationCell = row.find('td:nth-child(2)');
        const designationText = designationCell.text().toLowerCase();
        numbers.forEach(number => {
            if (designationText.includes(number.toLowerCase())) {
                isNumberMatch = true;
                highlightMatch(designationCell, number, 'highlight-green');
            }
        });

        // Check for keyword matches in non-designation cells
        row.find('td').each(function(index) {
            if (index === 1 || $(this).find('a').length > 0) return; // Skip designation cell and cells with links
            keywords.forEach(keyword => {
                if ($(this).text().toLowerCase().includes(keyword.toLowerCase())) {
                    isKeywordMatch = true;
                    highlightMatch($(this), keyword, 'highlight-orange');
                }
            });
        });

        // Add classes based on match type
        if (isNumberMatch) row.addClass('number-match');
        if (isKeywordMatch) row.addClass('keyword-match');
    });

    // Move matching rows to the top
    $('#dataTable tbody').prepend($('.number-match, .keyword-match'));
    $('#tableContainer').scrollTop(0);
}

// Utility to highlight matched text with a specified class
function highlightMatch(cell, text, highlightClass) {
    const escapedText = escapeRegExp(text);
    const highlightedHtml = cell.html().replace(new RegExp(`(${escapedText})`, 'gi'), `<span class="${highlightClass}">$1</span>`);
    cell.html(highlightedHtml);
}

// Function to escape special characters in the search string for regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
