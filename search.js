// Function to highlight search terms and designations in rows
export function performSearch(searchString) {
    const lowerCaseSearchString = searchString.trim().toLowerCase();
    $('#dataTable tbody tr').each(function() {
        const row = $(this);
        const designationCell = row.find('td:nth-child(2)'); // Explicitly target second column for designation
        const rowText = row.text().toLowerCase();
        const designationText = designationCell.text().toLowerCase();

        if (rowText.includes(lowerCaseSearchString)) {
            highlightWordsInRow(row, lowerCaseSearchString); // Highlight matches in the row
        } else {
            unhighlightRow(row); // Remove highlight if no match
        }

        // Check designation specifically and apply orange highlight if found
        if (designationText.includes(lowerCaseSearchString)) {
            highlightDesignationTextOnly(designationCell, lowerCaseSearchString); // Highlight in orange for the designation column
        }
    });
}

// Function to highlight matched designation in orange (excluding links)
function highlightDesignationTextOnly(cell, searchString) {
    const link = cell.find('a');
    const textOnly = link.length ? link.text() : cell.text();

    // Remove existing highlights and apply new one
    const originalText = textOnly.replace(/<span class="orange-highlight">(.*?)<\/span>/g, '$1');
    const highlightedHtml = originalText.replace(new RegExp(`(${searchString})`, 'gi'), '<span class="orange-highlight">$1</span>');

    if (link.length) {
        link.html(highlightedHtml); // Update inner HTML if there's a link
    } else {
        cell.html(highlightedHtml); // Directly update cell HTML otherwise
    }
}

// CSS for orange highlight
/* Ensure this CSS class is defined */
.orange-highlight {
    background-color: orange;
    color: black;
}
