// Function to extract keywords from the context (allowing alphanumeric with prefixes, suffixes, and symbols)
export function extractKeywords(context) {
    // Capture complex alphanumeric patterns with optional prefixes/suffixes and symbols
    return context.match(/(?:[A-Z]{2,}\s+)?[\w\/\-:+]+(?:\s+[\w\/\-:+]+){0,2}(?:\s+\+\s+[A-Z]+)?/g) || [];
}

// Function to extract complex designations with multi-part prefixes, suffixes, and specific symbols
export function extractNumbers(context) {
    // Match complex designations like "BS EN ISO 10993-18:2020+A1:2023"
    return context.match(/(?:[A-Z]{2,}\s+)?[A-Z]*\s?ISO\s?\d+(?:[-\/:+]?\d+)*(?:\s+[A-Z]+\d*)?(?:\s*\+\s*[A-Z]\d*:\d+)?/gi) || [];
}

// Function to match and display rows based on extracted items
function matchAndDisplay(matchingItems) {
    let matchingRows = [];
    $('#dataTable tbody tr').each(function() {
        const rowText = $(this).text().toLowerCase();
        let matchFound = false;

        matchingItems.forEach(item => {
            if (rowText.includes(item.trim().toLowerCase())) {
                if (!$(this).hasClass('selected-row')) {
                    $(this).addClass('new-row'); // Highlight row in green
                }
                matchFound = true;
            }
        });

        if (matchFound) {
            matchingRows.push(this); // Collect matching rows
        } else {
            $(this).removeClass('new-row'); // Remove highlight if no match
        }
    });

    $('#dataTable tbody').prepend(matchingRows);
    $('#tableContainer').scrollTop(0);
}

// Function to highlight search terms and designations in rows
export function performSearch(searchString) {
    const lowerCaseSearchString = searchString.trim().toLowerCase();
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const designationCell = row.find('td:nth-child(2)'); // Explicitly target second column for designation
        const rowText = row.text().toLowerCase();
        const designationText = designationCell.text().toLowerCase();

        if (rowText.includes(lowerCaseSearchString)) {
            highlightWordsInRow(row, lowerCaseSearchString); // Highlight matches
        } else {
            unhighlightRow(row); // Remove highlight if no match
        }

        // Check designation specifically and apply orange highlight if found
        if (designationText.includes(lowerCaseSearchString)) {
            highlightDesignationTextOnly(designationCell, lowerCaseSearchString); // Highlight in orange for the designation column
        }
    });
}

// Function to highlight matched designation in orange (excluding links)
function highlightDesignationTextOnly(cell, searchString) {
    const link = cell.find('a');
    const textOnly = link.length ? link.text() : cell.text();
    const originalText = textOnly.replace(/<span class="orange-highlight">(.*?)<\/span>/g, '$1');
    const highlightedHtml = originalText.replace(new RegExp(`(${searchString})`, 'gi'), '<span class="orange-highlight">$1</span>');

    if (link.length) {
        link.html(highlightedHtml); // Update inner HTML if a link is present
    } else {
        cell.html(highlightedHtml); // Directly update cell HTML otherwise
    }
}

// Function to highlight matched words in row (excluding links)
function highlightWordsInRow(row, searchString) {
    row.find('td').each(function(index) {
        if (index === 1 || $(this).find('a').length > 0) {
            return; // Skip designation or cells with links
        }
        const cellHtml = $(this).html();
        const highlightedHtml = cellHtml.replace(new RegExp(`(${searchString})`, 'gi'), '<span class="highlight">$1</span>');
        $(this).html(highlightedHtml);
    });
}

// Function to remove highlights
function unhighlightRow(row) {
    row.find('td').each(function() {
        const cellHtml = $(this).html();
        const unhighlightedHtml = cellHtml.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');
        $(this).html(unhighlightedHtml);
    });
}

// Main search function
export function searchRows(context) {
    const numbers = extractNumbers(context);  // Extract complex designations
    const keywords = extractKeywords(context);  // Extract keywords

    matchAndDisplay(numbers);  // Match and display rows based on designations
    matchAndDisplay(keywords);  // Match and display rows based on keywords

    performSearch(context); // Highlight keywords and designations in orange
}
