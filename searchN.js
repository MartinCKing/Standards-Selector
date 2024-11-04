// Function to extract keywords from the context (for general text searches)
export function extractKeywords(context) {
    return context.match(/(?:\w+\s+){0,2}\w+/g) || []; // Extract groups of 1-3 words
}

// Function to extract complex designations like "BS EN ISO 10993-18:2020+A1:2023"
export function extractNumbers(context) {
    return context.match(/\b(?:[A-Z]{2,}\s+)?(?:ISO|IEC|EN|MDCG|IAF|ICH|NEMA|GB\/T|ASTM|DS|AAMI|NITA|NIST|BS|CSA|CEN|TC|TR|TIR|CLC|JTC)?\s?\d{4}(?:[-\/:+]\d{1,4})*(?:\s+\+\s+[A-Z]\d*:\d+)?\b/gi) || [];
}

// Function to calculate cosine similarity between two text strings
function cosineSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    const wordSet = new Set([...words1, ...words2]);
    const wordMap1 = Array.from(wordSet).map(word => words1.filter(w => w === word).length);
    const wordMap2 = Array.from(wordSet).map(word => words2.filter(w => w === word).length);

    const dotProduct = wordMap1.reduce((sum, val, i) => sum + val * wordMap2[i], 0);
    const mag1 = Math.sqrt(wordMap1.reduce((sum, val) => sum + val ** 2, 0));
    const mag2 = Math.sqrt(wordMap2.reduce((sum, val) => sum + val ** 2, 0));

    return mag1 && mag2 ? dotProduct / (mag1 * mag2) : 0;
}

// Main function to match rows based on semantic similarity and highlight
export function searchRows(context) {
    const numbers = extractNumbers(context);
    const keywords = extractKeywords(context);

    // Highlight rows based on exact number and keyword matches
    matchAndDisplay(numbers);
    matchAndDisplay(keywords);

    // Perform semantic matching and highlight relevant words in orange
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const titleText = row.find('td:nth-child(1)').text(); // Assume title is in the first column
        const abstractText = row.find('td:nth-child(4)').text(); // Assume abstract is in the fourth column

        // Calculate cosine similarity between the context and the title/abstract
        const titleScore = cosineSimilarity(titleText, context);
        const abstractScore = cosineSimilarity(abstractText, context);

        if (titleScore > 0.5 || abstractScore > 0.5) { // Adjust threshold as needed
            row.addClass('new-row'); // Highlight row in green if it's semantically similar

            // Highlight words in the title and abstract that contribute to the similarity
            highlightSemanticMatches(row.find('td:nth-child(1)'), context); // Title
            highlightSemanticMatches(row.find('td:nth-child(4)'), context); // Abstract
        } else {
            row.removeClass('new-row');
        }
    });

    // Additional keyword search for orange highlights on exact matches
    performSearch(context);
}

// Function to highlight semantic matches in orange in a given cell
function highlightSemanticMatches(cell, context) {
    const words = context.split(/\s+/);
    words.forEach(word => {
        const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
        cell.html(cell.html().replace(regex, '<span class="highlight orange-highlight">$1</span>'));
    });
}

// Function to escape special characters in a search string
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to match and display rows that match the search criteria
function matchAndDisplay(matchingItems) {
    let matchingRows = [];
    $('#dataTable tbody tr').each(function() {
        const rowText = $(this).text().toLowerCase();
        let matchFound = false;

        matchingItems.forEach(item => {
            if (rowText.includes(item.trim().toLowerCase())) {
                if (!$(this).hasClass('selected-row')) {
                    $(this).addClass('new-row'); // Highlight the row in green
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

// Function to highlight exact keyword matches in orange
export function performSearch(searchString) {
    const lowerCaseSearchString = searchString.trim().toLowerCase();
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const designationCell = row.find('td:nth-child(2)'); // Assume designation is in the second column
        const rowText = row.text().toLowerCase();
        const designationText = designationCell.text().toLowerCase();

        if (rowText.includes(lowerCaseSearchString)) {
            highlightWordsInRow(row, lowerCaseSearchString);
        } else {
            unhighlightRow(row);
        }

        if (designationText.includes(lowerCaseSearchString)) {
            highlightDesignationTextOnly(designationCell, lowerCaseSearchString);
        }
    });
}

// Function to highlight matched designation in orange (excluding links)
function highlightDesignationTextOnly(cell, searchString) {
    const link = cell.find('a');
    const textOnly = link.length ? link.text() : cell.text();
    const escapedSearchString = escapeRegExp(searchString);
    const highlightedHtml = textOnly.replace(new RegExp(`(${escapedSearchString})`, 'gi'), '<span class="highlight orange-highlight">$1</span>');

    if (link.length) {
        link.html(highlightedHtml);
    } else {
        cell.html(highlightedHtml);
    }
}

// Function to highlight matched words in the row (excluding links)
function highlightWordsInRow(row, searchString) {
    row.find('td').each(function(index) {
        if (index === 1 || $(this).find('a').length > 0) {
            return;
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
        $(this).html(unhighlightedHtml);
    });
}
