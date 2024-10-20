export function performSearch(searchString, rowData, header, selectedRowIds) {
    const lowerCaseSearchString = searchString.trim().toLowerCase();
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const designationCell = row.find('td:nth-child(2)');
        const rowText = row.text().toLowerCase();
        const designationText = designationCell.text().toLowerCase();

        unhighlightRow(row);

        if (rowText.includes(lowerCaseSearchString)) {
            highlightWordsInRow(row, lowerCaseSearchString);
        }

        if (designationText.includes(lowerCaseSearchString)) {
            highlightDesignationTextOnly(designationCell, lowerCaseSearchString);
        }

        if (selectedRowIds.has(row.data('id'))) {
            row.addClass('selected-row');
        }
    });
}

export function highlightDesignationTextOnly(cell, searchString) {
    const link = cell.find('a');
    const textOnly = link.length ? link.text() : cell.text();
    const highlightedHtml = textOnly.replace(new RegExp(`(${searchString})`, 'gi'), '<span class="highlight">$1</span>');

    if (link.length) {
        link.html(highlightedHtml);
    } else {
        cell.html(highlightedHtml);
    }
}

export function highlightWordsInRow(row, searchString) {
    const regex = new RegExp(`(${searchString})`, 'gi');
    row.find('td').each(function(index) {
        if (index === 1 || $(this).find('a').length > 0) {
            return;
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
        $(this).html(unhighlightedHtml);
    });
}
