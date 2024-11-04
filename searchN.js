// Synonym dictionary to capture some common variations
const synonyms = {
    "human": ["humans", "people"],
    "design": ["designing", "designed", "plan"],
    "factors": ["elements", "components"]
    // Add more synonyms if needed
};

// Function to replace synonyms in a given text based on the synonyms dictionary
function replaceSynonyms(text) {
    const words = text.split(/\s+/);
    return words.map(word => {
        for (let key in synonyms) {
            if (synonyms[key].includes(word.toLowerCase())) {
                return key; // Replace synonym with the base word
            }
        }
        return word;
    }).join(' ');
}

// Function to generate n-grams from text (supports bigrams and trigrams)
function generateNGrams(text, n = 2) {
    const words = text.split(/\s+/);
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
        ngrams.push(words.slice(i, i + n).join(' '));
    }
    return ngrams;
}

// Enhanced cosine similarity with n-grams matching
function cosineSimilarityWithNGrams(text1, text2) {
    const bigrams1 = generateNGrams(replaceSynonyms(text1), 2);
    const bigrams2 = generateNGrams(replaceSynonyms(text2), 2);
    const trigrams1 = generateNGrams(replaceSynonyms(text1), 3);
    const trigrams2 = generateNGrams(replaceSynonyms(text2), 3);

    // Combine unigrams, bigrams, and trigrams for matching
    const combined1 = [...text1.toLowerCase().split(/\s+/), ...bigrams1, ...trigrams1];
    const combined2 = [...text2.toLowerCase().split(/\s+/), ...bigrams2, ...trigrams2];

    const wordSet = new Set([...combined1, ...combined2]);
    const vector1 = Array.from(wordSet).map(word => combined1.filter(w => w === word).length);
    const vector2 = Array.from(wordSet).map(word => combined2.filter(w => w === word).length);

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const mag1 = Math.sqrt(vector1.reduce((sum, val) => sum + val ** 2, 0));
    const mag2 = Math.sqrt(vector2.reduce((sum, val) => sum + val ** 2, 0));

    return mag1 && mag2 ? dotProduct / (mag1 * mag2) : 0;
}

// Function to extract keywords from the context (for general text searches)
export function extractKeywords(context) {
    return context.match(/(?:\w+\s+){0,2}\w+/g) || []; // Extract groups of 1-3 words
}

// Function to extract complex designations like "BS EN ISO 10993-18:2020+A1:2023"
export function extractNumbers(context) {
    return context.match(/\b(?:[A-Z]{2,}\s+)?(?:ISO|IEC|EN|MDCG|IAF|ICH|NEMA|GB\/T|ASTM|DS|AAMI|NITA|NIST|BS|CSA|CEN|TC|TR|TIR|CLC|JTC)?\s?\d{4}(?:[-\/:+]\d{1,4})*(?:\s+\+\s+[A-Z]\d*:\d+)?\b/gi) || [];
}

// Main function to match rows based on semantic similarity and highlight
export function searchRows(context) {
    const numbers = extractNumbers(context);
    const keywords = extractKeywords(context);

    // Highlight rows based on exact number and keyword matches
    matchAndDisplay(numbers);
    matchAndDisplay(keywords);

    // Perform semantic matching and highlight relevant phrases in orange
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const titleText = row.find('td:nth-child(1)').text(); // Assume title is in the first column
        const abstractText = row.find('td:nth-child(4)').text(); // Assume abstract is in the fourth column

        // Calculate cosine similarity between the context and the title/abstract with n-grams
        const titleScore = cosineSimilarityWithNGrams(titleText, context);
        const abstractScore = cosineSimilarityWithNGrams(abstractText, context);

        if (titleScore > 0.5 || abstractScore > 0.5) { // Adjust threshold as needed
            row.addClass('new-row'); // Highlight row in green if it's semantically similar

            // Highlight matching n-grams in the title and abstract
            highlightSemanticMatches(row.find('td:nth-child(1)'), context); // Title
            highlightSemanticMatches(row.find('td:nth-child(4)'), context); // Abstract
        } else {
            row.removeClass('new-row');
        }
    });

    // Additional keyword search for orange highlights on exact matches
    performSearch(context);
}

// Function to highlight semantic matches (phrases) in orange in a given cell
function highlightSemanticMatches(cell, context) {
    const words = context.split(/\s+/);
    const ngrams = [...generateNGrams(context, 2), ...generateNGrams(context, 3)]; // Use bigrams and trigrams

    // Highlight unigrams, bigrams, and trigrams
    [...words, ...ngrams].forEach(word => {
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
