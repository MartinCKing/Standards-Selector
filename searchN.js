// Function to extract keywords from the context (for general text searches)
export function extractKeywords(context) {
    return context.match(/(?:\w+\s+){0,2}\w+/g) || []; // Extract groups of 1-3 words
}

// Function to extract complex designations like "BS EN ISO 10993-18:2020+A1:2023"
export function extractNumbers(context) {
    return context.match(/\b(?:[A-Z]{2,}\s+)?(?:ISO|IEC|EN|MDCG|IAF|ICH|NEMA|GB\/T|ASTM|DS|AAMI|NITA|NIST|BS|CSA|CEN|TC|TR|TIR|CLC|JTC)?\s?\d{4}(?:[-\/:+]\d{1,4})*(?:\s+\+\s+[A-Z]\d*:\d+)?\b/gi) || [];
}


// Function to match and display rows that match the search criteria
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

// Function to perform keyword search and highlight them in orange (excluding links)
export function performSearch(searchString) {
    const lowerCaseSearchString = searchString.trim().toLowerCase();
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const designationCell = row.find('td:nth-child(2)'); // Second column for standard designation
        const rowText = row.text().toLowerCase();
        const designationText = designationCell.text().toLowerCase();

        // Check if the entire row contains the search string
        if (rowText.includes(lowerCaseSearchString)) {
            highlightWordsInRow(row, lowerCaseSearchString); // Highlight matches in all columns except links
        } else {
            unhighlightRow(row); // Unhighlight if not found
        }

        // Additionally, check if the designation (second column) matches the search string
        if (designationText.includes(lowerCaseSearchString)) {
            highlightDesignationTextOnly(designationCell, lowerCaseSearchString); // Highlight the designation in orange (text only)
        }
    });
}

// Function to escape special characters in the search string
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters for use in regex
}

// Function to highlight matched designation in orange (excluding links)
function highlightDesignationTextOnly(cell, searchString) {
    const link = cell.find('a'); // Check if there's a link in the cell
    const textOnly = link.length ? link.text() : cell.text(); // Get only the text, excluding the link

    // Escape special characters in the search string
    const escapedSearchString = escapeRegExp(searchString);
    const highlightedHtml = textOnly.replace(new RegExp(`(${escapedSearchString})`, 'gi'), '<span class="highlight orange-highlight">$1</span>');

    if (link.length) {
        // If there's a link, update its inner HTML with highlighted text
        link.html(highlightedHtml);
    } else {
        // If no link, directly update the cell's HTML
        cell.html(highlightedHtml);
    }
}

// Function to highlight matched words in the row (excluding links)
function highlightWordsInRow(row, searchString) {
    row.find('td').each(function(index) {
        if (index === 1 || $(this).find('a').length > 0) {
            return; // Skip the second column (designation) or cells with links
        }
        const cellHtml = $(this).html();
        const highlightedHtml = cellHtml.replace(new RegExp(`(${searchString})`, 'gi'), '<span class="highlight">$1</span>');
        $(this).html(highlightedHtml);
    });
}

// Function to unhighlight a row (remove <span> tags)
function unhighlightRow(row) {
    row.find('td').each(function() {
        const cellHtml = $(this).html();
        const unhighlightedHtml = cellHtml.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');
        $(this).html(unhighlightedHtml); // Restore the original content
    });
}


// Main search function that integrates keyword extraction, matching, and semantic display
export function searchRows(context) {
    const numbers = extractNumbers(context); // Extract complex designations
    const keywords = extractKeywords(context); // Extract keywords

    // Highlight rows based on exact number and keyword matches
    matchAndDisplay(numbers);
    matchAndDisplay(keywords);

    // Perform semantic matching and highlight relevant phrases in orange
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const titleText = row.find('td:nth-child(1)').text(); // Assuming title is in the first column
        const abstractText = row.find('td:nth-child(4)').text(); // Assuming abstract is in the fourth column

        // Calculate cosine similarity between the context and the title/abstract
        const titleScore = cosineSimilarity(titleText, context);
        const abstractScore = cosineSimilarity(abstractText, context);

        // Check if row should be highlighted based on semantic similarity
        if (titleScore > 0.5 || abstractScore > 0.5) { 
            row.addClass('new-row'); // Apply green highlight if semantically similar

            // Highlight matching words or phrases in the title and abstract
            highlightSemanticMatches(row.find('td:nth-child(1)'), context); // Title
            highlightSemanticMatches(row.find('td:nth-child(4)'), context); // Abstract
        } else {
            row.removeClass('new-row'); // Remove green highlight if not a match
        }
    });

    // Additional keyword search for orange highlights on exact matches
    performSearch(context);
}
