// similaritySearch.js
import similarity from 'similarity';
import $ from 'jquery';

// Function to extract keywords from the context (for general text searches)
export function extractKeywords(context) {
    return context.match(/(?:\w+\s+){0,2}\w+/g) || []; // Extract groups of 1-3 words
}

// Function to extract complex designations like "BS EN ISO 10993-18:2020+A1:2023"
export function extractNumbers(context) {
    return context.match(/\b(?:[A-Z]{2,}\s+)?(?:ISO|IEC|EN|MDCG|IAF|ICH|NEMA|GB\/T|ASTM|DS|AAMI|NITA|NIST|BS|CSA|CEN|TC|TR|TIR|CLC|JTC)?\s?\d{4}(?:[-\/:+]\d{1,4})*(?:\s+\+\s+[A-Z]\d*:\d+)?\b/gi) || [];
}

// Function to calculate a semantic match score
function semanticMatchScore(text, keywords) {
    let score = 0;
    keywords.forEach(keyword => {
        score += similarity(text, keyword);
    });
    return score / keywords.length; // Return the average score
}

// Function to match rows using semantic similarity and sort by relevance
function matchAndDisplay(matchingItems) {
    let rowScores = [];
    $('#dataTable tbody tr').each(function() {
        const rowText = $(this).text().toLowerCase();
        let score = semanticMatchScore(rowText, matchingItems); // Calculate similarity score
        if (score > 0.5) { // Adjust this threshold based on needs
            rowScores.push({ row: this, score });
            $(this).addClass('new-row'); // Highlight the row in green
        } else {
            $(this).removeClass('new-row');
        }
    });

    rowScores.sort((a, b) => b.score - a.score); // Sort rows by highest score first
    rowScores.forEach(({ row }) => $('#dataTable tbody').prepend(row)); // Move matched rows to the top
    $('#tableContainer').scrollTop(0);
}

// Function to perform keyword search and highlight them in orange
export function performSearch(searchString) {
    const lowerCaseSearchString = searchString.trim().toLowerCase();
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const designationCell = row.find('td:nth-child(2)'); // Second column for standard designation
        const rowText = row.text().toLowerCase();
        const designationText = designationCell.text().toLowerCase();

        // Highlight matches in title and abstract (semantic match)
        if (semanticMatchScore(rowText, [searchString]) > 0.5) {
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
        if (index === 1 || $(this).find('a').length > 0) return;
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

// Main search function integrating NLP-based matching
export function searchRows(context) {
    const numbers = extractNumbers(context);
    const keywords = extractKeywords(context);

    matchAndDisplay([...numbers, ...keywords]);
    performSearch(context);
}
