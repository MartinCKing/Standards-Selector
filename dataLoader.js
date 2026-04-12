window.AppState = window.AppState || {};
AppState.abstractVisible = AppState.abstractVisible ?? false;

window.allRows = window.allRows || [];
window.selectedRowIds = window.selectedRowIds || new Set();

const tableElement = document.getElementById('dataTable');
const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
const entriesLoaded = document.getElementById('entriesLoaded');
const hideAbstractButton = document.getElementById('hideAbstract');

const csvFiles = [
    'https://martincking.github.io/Standards-Selector/Standards_BSI.csv',
    'https://martincking.github.io/Standards-Selector/Standards_ISO_2026.csv',
    'https://martincking.github.io/Standards-Selector/Standards_ISO.csv',
    'https://martincking.github.io/Standards-Selector/Standards_IEC.csv',
    'https://martincking.github.io/Standards-Selector/Standards_AAMI.csv',
    'https://martincking.github.io/Standards-Selector/Standards_ASTM.csv',
    'https://martincking.github.io/Standards-Selector/Standards_IEEE.csv',
    'https://martincking.github.io/Standards-Selector/Standards_CEN.csv',
    'https://martincking.github.io/Standards-Selector/Standards_NIST.csv',
    'https://martincking.github.io/Standards-Selector/Standards_CSA.csv',
    'https://martincking.github.io/Standards-Selector/Standards_ANSI.csv',
    'https://martincking.github.io/Standards-Selector/Standards_IAF.csv',
    'https://martincking.github.io/Standards-Selector/FDA_Consensus_Standards.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_IMDRF.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_FDA.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_MDCG.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_EDQM.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_ICH.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_CIOMS.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_ISPE.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_IPEC.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_PICS.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_GHWP.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_MEDDEV.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_MDSAP.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_ECHA.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_GHS.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_Team-NB.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_edpb.csv',
];

function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function getStableRowIndex(row) {
    return window.allRows.indexOf(row);
}

function setAbstractVisibility() {
    const isVisible = AppState.abstractVisible;

    document.querySelectorAll('#dataTable th:nth-child(4), #dataTable td:nth-child(4)').forEach(cell => {
        cell.style.display = isVisible ? '' : 'none';
    });

    if (hideAbstractButton) {
        hideAbstractButton.textContent = isVisible ? 'Hide Abstract' : 'Show Abstract';
    }
}

function renderTable(data) {
    if (!tableBody) return;

    const rowsHTML = data.map((row) => {
        const designation = normalizeText(row.Designation);
        const title = normalizeText(row['Title of Standard']);
        const abstract = normalizeText(row.Abstract);
        const link = normalizeText(row.Link);

        const designationLink = link
            ? `<a href="${link}" target="_blank" rel="noopener">${designation}</a>`
            : designation;

        const titleLink = link
            ? `<a href="${link}" target="_blank" rel="noopener">${title}</a>`
            : title;

        const query = encodeURIComponent(`${designation} ${title}`.trim());
        const copilot = `<a href="https://www.bing.com/copilotsearch?q=${query}&showconv=1" target="_blank" rel="noopener"><b>Copilot</b></a>`;

        const stableRowIndex = getStableRowIndex(row);
        const isSelected = window.selectedRowIds.has(stableRowIndex);
        const rowClass = isSelected ? 'selected-row' : '';

        return `
            <tr class="${rowClass}" data-index="${stableRowIndex}">
                <td>${copilot}</td>
                <td>${designationLink}</td>
                <td>${titleLink}</td>
                <td>${abstract}</td>
            </tr>
        `;
    }).join("");

    tableBody.innerHTML = rowsHTML;
    setAbstractVisibility();
}

function loadCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete(results) {
                if (results && results.data) {
                    resolve(results.data);
                } else {
                    reject(new Error(`No data from ${file}`));
                }
            },
            error(error) {
                reject(error);
            }
        });
    });
}

async function loadMultipleCSVs(files) {
    try {
        const allData = await Promise.all(files.map(loadCSV));
        window.allRows = allData.flat();

        renderTable(window.allRows);

        if (entriesLoaded) {
            entriesLoaded.textContent = `(${window.allRows.length} entries loaded)`;
        }

        if (typeof debouncedFilter === 'function') {
            debouncedFilter();
        }

        console.log("All CSVs loaded successfully.");
    } catch (error) {
        console.error("Error loading CSVs:", error);
        if (entriesLoaded) {
            entriesLoaded.textContent = "(Error loading entries)";
        }
    }
}

if (hideAbstractButton) {
    hideAbstractButton.addEventListener('click', function () {
        AppState.abstractVisible = !AppState.abstractVisible;
        setAbstractVisibility();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    setAbstractVisibility();
    loadMultipleCSVs(csvFiles);
});