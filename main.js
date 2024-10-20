import { performSearch, highlightDesignationTextOnly, highlightWordsInRow, unhighlightRow } from './search.js';

$(document).ready(function() {
    const csvUrl = 'https://martincking.github.io/Standards-Selector/Standards_iso.csv';
    let allRows = [];
    let originalRows = [];
    let rowData = [];
    let selectedRowIds = new Set(); // Track selected rows
    let header = [];
    let abstractVisible = false;
    let useModel; // Store the Universal Sentence Encoder model for semantic search

    // Load the Universal Sentence Encoder model
    async function loadUSEModel() {
        useModel = await use.load();
        console.log('USE Model Loaded');
    }
    loadUSEModel();

    // Load and parse CSV data with PapaParse
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

            // Enable row selection
            $('#dataTable tbody').on('click', 'tr', function() {
                const rowId = $(this).data('id');
                $(this).toggleClass('selected-row'); // Toggle yellow highlight for selected rows
                $(this).removeClass('new-row'); // Remove green highlight for searched rows

                // Toggle selection in the selectedRowIds set
                if (selectedRowIds.has(rowId)) {
                    selectedRowIds.delete(rowId);
                } else {
                    selectedRowIds.add(rowId);
                }
            });
        }
    });

    // Function to run semantic search using Universal Sentence Encoder
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

        // Sort rows by similarity and highlight top matching rows
        similarities.sort((a, b) => b.similarity - a.similarity);
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

        // Restore selected rows (yellow highlighting)
        $('#dataTable tbody tr').each(function() {
            const rowId = $(this).data('id');
            if (selectedRowIds.has(rowId)) {
                $(this).addClass('selected-row'); // Restore yellow highlight for selected rows
            }
        });

        performSearch(context, rowData, header, selectedRowIds); // Perform keyword-based search
        runSemanticSearch(context); // Run the natural language search

        $('#loadingIndicator').hide();
        $('#progressMessage').text('Search complete.');
    });

    // Display only selected rows but keep unselected rows below
    $('#displaySelected').click(function() {
        const selectedHtml = $('#dataTable tbody tr.selected-row').clone();
        const unselectedHtml = $('#dataTable tbody tr').not('.selected-row').clone();

        if (selectedHtml.length === 0) {
            $('#dataTable tbody').html(originalRows.join(''));
            selectedRowIds.clear();
        } else {
            $('#dataTable tbody').empty().append(selectedHtml).append(unselectedHtml);
            $('#tableContainer').scrollTop(0); // Scroll to the top of the table
        }
    });

    // Clear context functionality (without affecting selected rows)
    $('#clearContext').click(function() {
        $('#keywordInput').val(''); // Clear the keyword input
        $('#dataTable tbody tr').removeClass('new-row'); // Only clear new-row (green)

        // Unhighlight all orange spans
        $('td span.highlight').each(function() {
            const unwrapped = $(this).text(); // Get the text inside the span
            $(this).replaceWith(unwrapped); // Replace the span with plain text
        });

        $('#progressMessage').text('Context cleared.');
    });

    // Reset functionality
    $('#reset').click(function() {
        $('#dataTable tbody').html(originalRows.join(''));
        $('#dataTable tbody tr').removeClass('selected-row new-row');
        selectedRowIds.clear();
        $('#progressMessage').text('Reset complete.');
    });

    // Export functionality
    $('#export').click(function() {
        let csvContent = header.map(col => `"${col}"`).join(',') + '\n';

        $('#dataTable tbody tr.selected-row').each(function() {
            const row = $(this).find('td').map(function() {
                let cellText = $(this).text().trim();
                return `"${cellText.replace(/"/g, '""')}"`; // Escape double quotes
            }).get();

            if (row.some(cell => cell.length > 0)) {
                csvContent += row.join(',') + '\n';
            }
        });

        // Create and trigger the CSV file download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'selected_rows.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Cosine similarity function
    function cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
});
