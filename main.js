import { performSearch, highlightDesignationTextOnly, highlightWordsInRow, unhighlightRow } from './search.js';

// Function to compute cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

$(document).ready(function() {
    const csvUrl = 'https://martincking.github.io/Standards-Selector/Standards_iso.csv';
    let allRows = [];
    let originalRows = [];
    let rowData = [];
    let selectedRowIds = new Set();
    let header = [];
    let abstractVisible = false;

    // Load and parse CSV data
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            header = Object.keys(results.data[0]).slice(0, 5);
            const rows = results.data.map((row, index) => {
                row['id'] = index;
                return row;
            });

            const headerHtml = header.map(col => `<th>${col}</th>`).join('');
            $('#dataTable thead').html(`<tr>${headerHtml}</tr>`);

            allRows = rows.map((row, index) => {
                const link = row[header[4]]; // Get the link from column 5
                if (link && link.trim().startsWith('https://')) {
                    row[header[1]] = `<a href="${link}" target="_blank">${row[header[1]]}</a>`;
                } else {
                    row[header[4]] = ''; // Remove invalid links
                }
                rowData.push({ id: row['id'], content: row });
                return `<tr data-id="${row['id']}">${header.map(col => `<td>${row[col]}</td>`).join('')}</tr>`;
            });

            originalRows = allRows.slice();
            $('#dataTable tbody').html(originalRows.join(''));
        }
    });

    // Load the Universal Sentence Encoder model
    let useModel;
    async function loadUSEModel() {
        useModel = await use.load();
        console.log('USE Model Loaded');
    }
    loadUSEModel();

    // Function to run semantic search
    async function runSemanticSearch(query) {
        if (!useModel) {
            console.error('Universal Sentence Encoder model is not loaded yet');
            return;
        }

        const queryEmbedding = await useModel.embed(query);

        // Generate embeddings for each row's text (abstract and title)
        let rowEmbeddings = await Promise.all(rowData.map(async row => {
            const textToSearch = row.content[header[1]] + ' ' + row.content[header[4]];
            const embedding = await useModel.embed(textToSearch);
            return { id: row.id, embedding };
        }));

        // Compute cosine similarity between query and each row's embedding
        const similarities = rowEmbeddings.map(row => {
            const similarity = cosineSimilarity(queryEmbedding.arraySync()[0], row.embedding.arraySync()[0]);
            return { id: row.id, similarity };
        });

        // Sort rows by similarity
        similarities.sort((a, b) => b.similarity - a.similarity);

        // Highlight top matching rows based on similarity
        highlightTopRows(similarities);
    }

    // Highlight top rows based on semantic meaning
    function highlightTopRows(similarities) {
        $('#dataTable tbody tr').each(function() {
            const rowId = $(this).data('id');
            const similarityData = similarities.find(sim => sim.id === rowId);

            if (similarityData && similarityData.similarity > 0.5) { // Threshold for similarity
                $(this).addClass('new-row'); // Highlight in green
            } else {
                $(this).removeClass('new-row');
            }
        });

        // Scroll to top
        $('#tableContainer').scrollTop(0);
    }

    // Submit context search with semantic meaning
    $('#submitContext').click(function() {
        const context = $('#keywordInput').val();
        $('#loadingIndicator').show();
        $('#progressMessage').text('Searching...');

        const resetHtml = rowData.map(data => {
            return `<tr data-id="${data.id}">${header.map(col => `<td>${data.content[col]}</td>`).join('')}</tr>`;
        });

        $('#dataTable tbody').html(resetHtml.join(''));

        performSearch(context, rowData, header, selectedRowIds);
        runSemanticSearch(context); // Run the natural language search

        $('#loadingIndicator').hide();
        $('#progressMessage').text('Search complete.');
    });

    // Other functionality remains unchanged...
});
