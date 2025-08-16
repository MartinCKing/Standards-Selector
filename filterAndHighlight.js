// Debounce function for typing priority
function debouncedFilter() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(filterTable, 300); // Adjust debounce time as needed
}

// Filter table based on search input in each column, with ASD only affecting NON-matches
function filterTable() {
  const asdAcronymSearch = ($('#asdAcronymSearch').val() || '').toLowerCase();
  const designationSearch = ($('#designationSearch').val() || '').toLowerCase();
  const titleSearch       = ($('#titleSearch').val()       || '').toLowerCase();
  const abstractSearch    = ($('#abstractSearch').val()    || '').toLowerCase();

  let rowsWithMatchCounts = [];

  allRows.forEach(row => {
    // 1) TEXT MATCH COUNT (unchanged)
    let matchCount = 0;
    if (designationSearch && (row.Designation || '').toLowerCase().includes(designationSearch)) matchCount++;
    if (titleSearch       && (row['Title of Standard'] || '').toLowerCase().includes(titleSearch)) matchCount++;
    if (abstractSearch    && (row.Abstract || '').toLowerCase().includes(abstractSearch)) matchCount++;

    // 2) ASD BOOST — apply ONLY to NON-matches (so ASD never dominates matches)
    let sourceBoost = 0;
    if (asdAcronymSearch) {
      const acronym = (row['ASD Acronym'] || '').toLowerCase();
      const d = (row.Designation || '').toLowerCase();

      if (asdAcronymSearch === 'fda') {
        // Prioritize FDA Guidance, exclude FDA Consensus
        const isFDAGuidance = (acronym === 'fda') && !d.includes('consensus');
        if (matchCount === 0 && isFDAGuidance) sourceBoost = 1;
      } else {
        const isChosenASD = acronym.includes(asdAcronymSearch);
        if (matchCount === 0 && isChosenASD) sourceBoost = 1;
      }
    }

    rowsWithMatchCounts.push({ row, matchCount, sourceBoost });
  });

  // 3) SORT: matches first by text score, then NON-matches by ASD
  rowsWithMatchCounts.sort((a, b) =>
    (b.matchCount - a.matchCount) ||       // text matches first
    (b.sourceBoost - a.sourceBoost)        // then ASD within non-matches
  );

  const sortedData = rowsWithMatchCounts.map(item => item.row);
  renderTable(sortedData);
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

