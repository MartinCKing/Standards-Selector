import nlp from 'compromise'; // Example NLP library

export function extractNumbers(context) {
    const numberPattern = /\d+/g;
    return context.match(numberPattern) || [];
}

export function extractKeywordsWithNLP(context) {
    const doc = nlp(context);
    const refinedKeywords = doc.nouns().out('array'); // Extract refined keywords like nouns
    return refinedKeywords.filter(keyword => keyword.length > 2);
}

export function extractSentences(context) {
    const doc = nlp(context);
    return doc.sentences().out('array'); // Extracts all sentences from the context
}

export function performSearch(context, rowData, header, selectedRowIds) {
    const numbers = extractNumbers(context); // Keep number extraction as is
    const refinedKeywords = extractKeywordsWithNLP(context); // Use NLP for keywords
    const sentences = extractSentences(context); // Use NLP for sentences

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

        // Perform refined NLP-based keyword matching only on title and abstract
        const matchedKeywords = refinedKeywords.some(keyword => 
            title.includes(keyword) || abstract.includes(keyword)
        );

        // Perform NLP-based sentence matching only on title and abstract
        const matchedSentences = sentences.some(sentence => 
            title.includes(sentence) || abstract.includes(sentence)
        );

        // Highlight the row if any of the matching criteria are satisfied
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
