// Debounce function for typing priority
function debouncedFilter() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(filterTable, 300); // Adjust debounce time as needed
}

// Filter table based on search input in each column, expanding to other columns if no matches
function filterTable() {
  const asdAcronymSearch = $('#asdAcronymSearch').val().toLowerCase();
  const designationSearch = $('#designationSearch').val().toLowerCase();
  const titleSearch = $('#titleSearch').val().toLowerCase();
  const abstractSearch = $('#abstractSearch').val().toLowerCase();

  let rowsWithMatchCounts = [];

  allRows.forEach(row => {
    let matchCount = 0;

    if (designationSearch && (row.Designation || '').toLowerCase().includes(designationSearch)) matchCount++;
    if (titleSearch && (row['Title of Standard'] || '').toLowerCase().includes(titleSearch)) matchCount++;
    if (abstractSearch && (row.Abstract || '').toLowerCase().includes(abstractSearch)) matchCount++;

    // ASD boost: rows from the selected source jump to the top, others still show
let sourceBoost = 0;
if (asdAcronymSearch) {
  const acronym = (row['ASD Acronym'] || '').toLowerCase();
  if (asdAcronymSearch === 'fda') {
    // Prioritize FDA Guidance but not FDA Consensus
    if (acronym === 'fda' && !(row.Designation || '').toLowerCase().includes('consensus')) {
      sourceBoost = 100; // tune as you like
    }
  } else if (acronym.includes(asdAcronymSearch)) {
    sourceBoost = 100; // tune as you like
  }
}

const score = matchCount + sourceBoost;
rowsWithMatchCounts.push({ row, matchCount, score });

// Prioritize by score (we’ll add a boost below)
rowsWithMatchCounts.sort((a, b) => b.score - a.score || b.matchCount - a.matchCount);

// Only hide rows when the user typed something.
// If they only picked an ASD, we keep *all* rows and just reorder.
const hasTextQuery = designationSearch || titleSearch || abstractSearch;
let sortedData = rowsWithMatchCounts;
if (hasTextQuery) {
  sortedData = rowsWithMatchCounts.filter(item => item.matchCount > 0);
}

renderTable(sortedData.map(item => item.row));
highlightSearchTerms(designationSearch, titleSearch, abstractSearch);
}

function clearHighlights() {
  $('#dataTable tbody .highlight').contents().unwrap();
  $('#dataTable tbody tr').removeClass('match-row');
}

// ---- Helpers for safe text-only highlighting ----
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Recursively highlight only text nodes inside $container
function highlightTextNodes($container, searchText) {
  if (!searchText) return;
  const re = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');

  $container.contents().each(function () {
    // Text node
    if (this.nodeType === 3) {
      const original = this.nodeValue;
      const replaced = original.replace(re, '<span class="highlight">$1</span>');
      if (replaced !== original) {
        $(this).replaceWith(replaced);
      }
      return;
    }
    // Element node — skip existing highlights; recurse into children
    if (this.nodeType === 1) {
      if ($(this).is('.highlight')) return;
      highlightTextNodes($(this), searchText);
    }
  });
}

// Only highlight visible text of the designation; never touch attributes
function highlightDesignationTextOnly(cell, searchString) {
  const $a = cell.find('a').first();
  const re = new RegExp(`(${escapeRegExp(searchString)})`, 'gi');

  if ($a.length) {
    const text = $a.text();
    $a.html(text.replace(re, '<span class="highlight">$1</span>'));
  } else {
    const text = cell.text();
    cell.html(text.replace(re, '<span class="highlight">$1</span>'));
  }
}

// Highlight search terms in the rendered table (safe version)
function highlightSearchTerms(designationSearch, titleSearch, abstractSearch) {
  $('#dataTable tbody tr').each(function () {
    const rowId = $(this).data('id');
    const isRowSelected = selectedRowIds.has(rowId);

    $(this).removeClass('match-row');
    $(this).find('.highlight').contents().unwrap(); // clear previous highlights safely

    $(this).find('td').each(function (index) {
      const cell = $(this);
      const cellTextLower = cell.text().toLowerCase();

      if (index === 0) {
        // Designation column
        if (designationSearch && cellTextLower.includes(designationSearch)) {
          highlightDesignationTextOnly(cell, designationSearch);
          if (!isRowSelected) cell.closest('tr').addClass('match-row');
        }
        return;
      }

      // Title (1) and Abstract (2): safely highlight only text nodes
      let searchText = null;
      if (index === 1) searchText = titleSearch;
      if (index === 2) searchText = abstractSearch;

      if (searchText && cellTextLower.includes(searchText)) {
        highlightTextNodes(cell, searchText);
        if (!isRowSelected) cell.closest('tr').addClass('match-row');
      }
    });

    if (isRowSelected) {
      $(this).addClass('selected-row');
    }
  });
}



