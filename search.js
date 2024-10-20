export function performSearch(searchString, rowData, header, selectedRowIds) {
    const lowerCaseSearchString = searchString.trim().toLowerCase();
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const designationCell = row.find('td:nth-child(2)'); // Second column for standard designation
        const rowText = row.text().toLowerCase();
        const designationText = designationCell.text().toLowerCase();

        // Unhighlight the row first
        unhighlightRow(row);

        // Check if the entire row contains the search string
        if (rowText.includes(lowerCaseSearchString)) {
            highlightWordsInRow(row, lowerCaseSearchString); // Highlight matches in all columns
        }

        // Additionally, check if the designation (second column) matches the search string
        if (designationText.includes(lowerCaseSearchString)) {
            highlightDesignationTextOnly(designationCell, lowerCaseSearchString); // Highlight the designation in orange (text only)
        }

        // Restore the yellow highlight for previously selected rows
        if (selectedRowIds.has(row.data('id'))) {
            row.addClass('selected-row');
        }
    });
}

export function highlightDesignationTextOnly(cell, searchString) {
    const link = cell.find('a'); // Check if there's a link in the cell
    const textOnly = link.length ? link.text() : cell.text(); // Get only the text, excluding the link
    const highlightedHtml = textOnly.replace(new RegExp(`(${searchString})`, 'gi'), '<span class="highlight">$1</span>');

    if (link.length) {
        // If there's a link, update its inner HTML with highlighted text
        link.html(highlightedHtml);
    } else {
        // If no link, directly update the cell's HTML
        cell.html(highlightedHtml);
    }
}

export function highlightWordsInRow(row, searchString) {
    const regex = new RegExp(`(${searchString})`, 'gi');
    row.find('td').each(function(index) {
        if (index === 1 || $(this).find('a').length > 0) {
            return; // Skip the second column (designation) or cells with links
        }
        const cellHtml = $(this).html();
        const highlightedHtml = cellHtml.replace(regex, '<span class="highlight">$1</span>');
        $(this).html(highlightedHtml);
    });
}

export function unhighlightRow(row) {
    row.find('td').each(function() {
        const cellHtml = $(this).html();
        const unhighlightedHtml = cellHtml.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');
        $(this).html(unhighlightedHtml); // Restore the original content
    });
    
    // Keep the selected rows (yellow) persistent
    if (!row.hasClass('selected-row')) {
        row.removeClass('new-row'); // Remove the green highlight from non-matching rows
    }
}
