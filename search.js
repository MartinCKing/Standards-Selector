import nlp from 'compromise';
import Fuse from 'fuse.js'; // Fuzzy matching library

// Extract refined keywords using NLP
export function extractKeywordsWithNLP(context) {
    const doc = nlp(context);
    const refinedKeywords = doc.nouns().out('array'); // Extract nouns as refined keywords
    return refinedKeywords.filter(keyword => keyword.length > 2);
}

// Extract sentences using NLP
export function extractSentences(context) {
    const doc = nlp(context);
    return doc.sentences().out('array'); // Extract sentences
}

// Perform fuzzy matching
export function fuzzyMatch(query, text) {
    const fuse = new Fuse([text], {
        includeScore: true,
        threshold: 0.3, // Adjust threshold for fuzziness
    });
    return fuse.search(query).length > 0; // Return true if there's a match
}

// Perform search with fuzzy and NLP-based matching for title and abstract
export function performSearch(context, rowData, header, selectedRowIds) {
    const numbers = extractNumbers(context); // Extract numbers
    const refinedKeywords = extractKeywordsWithNLP(context); // Use NLP for keyword extraction
    const sentences = extractSentences(context); // Extract sentences

    $('#dataTable tbody tr').each(function () {
        const rowId = $(this).data('id');
        const rowContent = rowData.find(data => data.id === rowId).content;

        // Extract title and abstract columns (assuming column indexes 1 and 3 are title and abstract)
        const title = rowContent[header[1]] || ''; // Title column
        const abstract = rowContent[header[3]] || ''; // Abstract column

        // Perform number matching across all columns
        const matchedNumbers = numbers.some(number => 
            Object.values(rowContent).some(value => value.includes(number))
        );

        // Perform fuzzy matching on title and abstract for sentences
        const matchedSentences = sentences.some(sentence => 
            fuzzyMatch(sentence, title) || fuzzyMatch(sentence, abstract)
        );

        // Perform fuzzy matching on title and abstract for refined keywords
        const matchedKeywords = refinedKeywords.some(keyword => 
            fuzzyMatch(keyword, title) || fuzzyMatch(keyword, abstract)
        );

        // Highlight the row if any match criteria is satisfied
        if (matchedNumbers || matchedKeywords || matchedSentences) {
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
