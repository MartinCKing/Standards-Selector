// This function loads CSV data and populates the table
function loadCSV() {
    console.log("Attempting to load CSV data..."); // Debug log

    Papa.parse('https://martincking.github.io/Standards-Selector/Standards.csv', {
        download: true,
        header: true,
        complete: function(results) {
            if (results && results.data) {
                allRows = results.data;
                console.log("CSV data loaded successfully:", allRows); // Debug log
                renderTable(allRows); // Render the table after data is loaded

                // Update the number of entries loaded using allRows.length
                $('#entriesLoaded').text(`(${allRows.length} entries loaded)`);
            } else {
                console.error("Error: CSV data could not be loaded or is empty."); // Error log
            }
        },
        error: function(error) {
            console.error("Error loading CSV:", error); // Error log for CSV loading issues
        }
    });
}

// This function renders the table rows with appropriate data-id attributes
function renderTable(data) {
    const rowsHTML = data.map(row => {
        const globalIndex = allRows.indexOf(row);  // Unique identifier for each row
        const isSelected = selectedRowIds.has(globalIndex);  // Check if row is selected
        const designationLink = row.Link ? `<a href="${row.Link}" target="_blank">${row.Designation}</a>` : row.Designation;
        const rowClass = isSelected ? 'selected-row' : '';  // Apply selected-row class if selected

        return `<tr data-id="${globalIndex}" class="${rowClass}">
            <td>${designationLink || ''}</td>
            <td>${row['Title of Standard'] || ''}</td>
            <td>${row.Abstract || ''}</td>
        </tr>`;
    }).join('');

    $('#dataTable tbody').html(rowsHTML);

    // Maintain abstract visibility setting
    if (!abstractVisible) {
        $('td:nth-child(3), th:nth-child(3)').hide();
    }
}

// Initial load of CSV data
$(document).ready(() => loadCSV());
