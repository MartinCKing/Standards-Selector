// Use the global nlp object (which is available after including the CDN link)
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

// Perform fuzzy matching using Fuse.js
export function fuzzyMatch(query, text) {
    const fuse = new Fuse([text], {
        includeScore: true,
        threshold: 0.3, // Adjust threshold for fuzziness
    });
    return fuse.search(query).length > 0; // Return true if there's a match
}

// Define extractNumbers function if needed
export function extractNumbers(context) {
    const numberPattern = /\d+/g;
    return context.match(numberPattern) || [];
}

// Function to highlight matching words in the title/abstract
function highlightWords(text, words) {
    let highlightedText = text;
    words.forEach(word => {
        const wordRegex = new RegExp(`(${word})`, 'gi'); // Case-insensitive match
        highlightedText = highlightedText.replace(wordRegex, '<span class="highlight">$1</span>'); // Add a class to highlight
    });
    return highlightedText;
}

// Perform search with fuzzy and NLP-based matching for title and abstract
export function performSearch(context, rowData, header, selectedRowIds, abstractVisibilityMap) {
    const numbers = extractNumbers(context); // Extract numbers
    const refinedKeywords = extractKeywordsWithNLP(context); // Use NLP for keyword extraction
    const sentences = extractSentences(context); // Extract sentences

    let matchingRows = [];
    let nonMatchingRows = [];

    $('#dataTable tbody tr').each(function () {
        const rowId = $(this).data('id');
        const rowContent = rowData.find(data => data.id === rowId).content;

        // Extract title and abstract columns (assuming column indexes 1 and 3 are title and abstract)
        let title = rowContent[header[1]] || ''; // Title column
        let abstract = rowContent[header[3]] || ''; // Abstract column

        // Perform number matching across all columns
        const matchedNumbers = numbers.some(number => 
            Object.values(rowContent).some(value => 
                String(value).includes(number) // Convert value to a string
            )
        );

        // Perform fuzzy matching on title and abstract for sentences
        const matchedSentences = sentences.some(sentence => 
            fuzzyMatch(sentence, String(title)) || fuzzyMatch(sentence, String(abstract))
        );

        // Perform fuzzy matching on title and abstract for refined keywords
        const matchedKeywords = refinedKeywords.some(keyword => 
            fuzzyMatch(keyword, String(title)) || fuzzyMatch(keyword, String(abstract))
        );

        // Highlight matching words in the title and abstract
        if (matchedKeywords || matchedSentences) {
            title = highlightWords(title, refinedKeywords);
            abstract = highlightWords(abstract, refinedKeywords);
            $(this).find('td').eq(1).html(title); // Update title column with highlighted text
            $(this).find('td').eq(3).html(abstract); // Update abstract column with highlighted text
        }

        // Highlight the row if any match criteria is satisfied
        if (matchedNumbers || matchedKeywords || matchedSentences) {
            $(this).addClass('new-row'); // Highlight matching rows in green
            matchingRows.push(this); // Collect matching rows
        } else {
            $(this).removeClass('new-row');
            nonMatchingRows.push(this); // Collect non-matching rows
        }

        // Restore previously selected rows
        if (selectedRowIds.has(rowId)) {
            $(this).addClass('selected-row');
        }

        // Ensure abstracts are only visible based on the abstractVisibilityMap
        if (abstractVisibilityMap[rowId]) {
            $(this).find('.abstract').show(); // Show abstract if previously marked as visible
        } else {
            $(this).find('.abstract').hide(); // Hide abstract if not marked visible
        }
    });

    // Move matching rows to the top of the table
    $('#dataTable tbody').empty(); // Clear the current table body
    $('#dataTable tbody').append(matchingRows); // Append matching rows at the top
    $('#dataTable tbody').append(nonMatchingRows); // Append non-matching rows at the bottom
}
