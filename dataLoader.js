// Initialize global namespace to avoid redeclaration issues
window.AppState = window.AppState || {};
AppState.abstractVisible = AppState.abstractVisible ?? false; // Default visibility state for abstracts

// Array of CSV file URLs
const csvFiles = [
    'https://martincking.github.io/Standards-Selector/Standards_ISO.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_IMDRF.csv',
    'https://martincking.github.io/Standards-Selector/Standards_IEC.csv',
    'https://martincking.github.io/Standards-Selector/Standards_AAMI.csv',
    'https://martincking.github.io/Standards-Selector/Standards_ASTM.csv',
    'https://martincking.github.io/Standards-Selector/Standards_IEEE.csv',
    'https://martincking.github.io/Standards-Selector/Standards_CEN.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_FDA.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_MDCG.csv',
    'https://martincking.github.io/Standards-Selector/Standards_NIST.csv',
    'https://martincking.github.io/Standards-Selector/Standards_CSA.csv',
    'https://martincking.github.io/Standards-Selector/Standards_BSI.csv',
    'https://martincking.github.io/Standards-Selector/Standards_ANSI.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_EDQM.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_ICH.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_CIOMS.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_ISPE.csv',
    'https://martincking.github.io/Standards-Selector/Standards_IAF.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_IPEC.csv',
    'https://martincking.github.io/Standards-Selector/FDA_Consensus_Standards.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_PICS.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_GHWP.csv',
];


async function loadMultipleCSVs(files) {
    console.log("Loading multiple CSVs...");
    const promises = files.map(file =>
        new Promise((resolve, reject) => {
            Papa.parse(file, {
                download: true,
                header: true,
                complete: function(results) {
                    if (results && results.data) {
                        resolve(results.data);
                    } else {
                        reject(`Error loading ${file}`);
                    }
                },
                error: function(error) {
                    reject(error);
                },
            });
        })
    );

    try {
        const allData = await Promise.all(promises);
        allRows = allData.flatMap(data => data.slice(0, data.length - 1)); // Remove 1 row per CSV
        const totalEntries = allData.reduce((sum, data) => sum + data.length - 1, 0); // Adjust entry count
        renderTable(allRows);
        $('#entriesLoaded').text(`(${totalEntries} entries loaded)`); // Update entry count
        console.log("All CSVs loaded successfully.");
    } catch (error) {
        console.error("Error loading CSVs:", error);
    }
}

function renderTable(data) {
    const rowsHTML = data.map((row, index) => {
        const designationLink = row.Link
            ? `<a href="${row.Link}" target="_blank">${row.Designation}</a>`
            : row.Designation;

        const isSelected = selectedRowIds.has(allRows.indexOf(row)); // Check if the row is selected
        const rowClass = isSelected ? 'selected-row' : ''; // Apply selected-row class if selected

        return `<tr data-id="${allRows.indexOf(row)}" class="${rowClass}">
            <td>${designationLink || ''}</td>
            <td>${row['Title of Standard'] || ''}</td>
            <td>${row.Abstract || ''}</td>
        </tr>`;
    }).join('');

    $('#dataTable tbody').html(rowsHTML);

    // Abstract column visibility
    const isVisible = AppState.abstractVisible;
    $('td:nth-child(3), th:nth-child(3)').toggle(isVisible);

    console.log("Table rendered successfully with data.");
}

// Event listener for toggling abstract visibility
$('#hideAbstract').click(function () {
    AppState.abstractVisible = !AppState.abstractVisible; // Toggle visibility state
    $('td:nth-child(3), th:nth-child(3)').toggle(AppState.abstractVisible); // Show/Hide abstract column
    $(this).text(AppState.abstractVisible ? 'Hide Abstract' : 'Show Abstract'); // Update button text
});

// Initial call to load multiple CSV files
$(document).ready(() => {
    loadMultipleCSVs(csvFiles); // Load CSV files and populate the table
});
