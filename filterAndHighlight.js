/* filterAndHighlight.js (patched)
 *
 * Behavior:
 * - If user typed in Designation/Title/Abstract, show ONLY matching rows.
 * - If user ONLY picked ASD (source), show ALL rows but BOOST that source to the top.
 * - While typing, ASD still prioritizes rows from that source within the results.
 *
 * Expects:
 *   - globals.js defines: allRows, selectedRowIds
 *   - dataLoader.js defines: renderTable(data)
 *   - jQuery loaded
 */

(function () {
  'use strict';

  // Debounce for typing in search inputs
  window.debouncedFilter = function debouncedFilter() {
    if (window.debounceTimeout) clearTimeout(window.debounceTimeout);
    window.debounceTimeout = setTimeout(filterTable, 300);
  };

  window.filterTable = function filterTable() {
    const asdAcronymSearch = ($('#asdAcronymSearch').val() || '').toLowerCase().trim();
    const designationSearch = ($('#designationSearch').val() || '').toLowerCase().trim();
    const titleSearch       = ($('#titleSearch').val()       || '').toLowerCase().trim();
    const abstractSearch    = ($('#abstractSearch').val()    || '').toLowerCase().trim();

    const hasTextQuery = !!(designationSearch || titleSearch || abstractSearch);
    const ASD_BOOST = 100; // tune

    if (!Array.isArray(window.allRows) || window.allRows.length === 0) {
      renderTable([]);
      return;
    }

    let rowsWithMatchCounts = [];

    window.allRows.forEach((row, idx) => {
      const d = (row.Designation || '').toLowerCase();
      const t = (row['Title of Standard'] || '').toLowerCase();
      const a = (row.Abstract || '').toLowerCase();
      const acronym = (row['ASD Acronym'] || '').toLowerCase();

      // Text match count
      let matchCount = 0;
      if (designationSearch && d.includes(designationSearch)) matchCount++;
      if (titleSearch       && t.includes(titleSearch))       matchCount++;
      if (abstractSearch    && a.includes(abstractSearch))    matchCount++;

      // If user typed something, keep only rows with at least one text match
      if (hasTextQuery && matchCount === 0) return;

      // ASD prioritization (boost but do not filter others)
      let sourceBoost = 0;
      if (asdAcronymSearch) {
        if (asdAcronymSearch === 'fda') {
          // Prioritize FDA Guidance, exclude FDA Consensus
          const isConsensus = d.includes('consensus');
          if (acronym === 'fda' && !isConsensus) sourceBoost = ASD_BOOST;
        } else if (acronym.includes(asdAcronymSearch)) {
          sourceBoost = ASD_BOOST;
        }
      }

      const score = matchCount + sourceBoost;

      rowsWithMatchCounts.push({
        row, matchCount, score, idx, acronym
      });
    });

    // Sort boosted rows first, then by text match, then acronym, then original order
    rowsWithMatchCounts.sort((a, b) =>
      (b.score - a.score) ||
      (b.matchCount - a.matchCount) ||
      a.acronym.localeCompare(b.acronym) ||
      (a.idx - b.idx)
    );

    const sortedData = rowsWithMatchCounts.map(item => item.row);

    renderTable(sortedData);
    highlightSearchTerms(designationSearch, titleSearch, abstractSearch);
  };

  // Clear all previous highlights
  window.clearHighlights = function clearHighlights() {
    $('#dataTable tbody .highlight').contents().unwrap();
    $('#dataTable tbody tr').removeClass('match-row');
  };

  // Helpers for safe text-only highlighting
  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Recursively highlight only text nodes inside $container
  function highlightTextNodes($container, searchText) {
    if (!searchText) return;
    const re = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');

    $container.contents().each(function () {
      // Text node
      if (this.nodeType === 3) {
        const original = this.nodeValue || '';
        if (!original) return;
        const replaced = original.replace(re, '<span class="highlight">$1</span>');
        if (replaced !== original) $(this).replaceWith(replaced);
        return;
      }
      // Element node — skip existing highlights; recurse into children
      if (this.nodeType === 1) {
        const $el = $(this);
        if ($el.is('.highlight')) return;
        highlightTextNodes($el, searchText);
      }
    });
  }

  // Only highlight visible text of the designation; never touch attributes
  function highlightDesignationTextOnly($cell, searchString) {
    if (!searchString) return;
    const $a = $cell.find('a').first();
    const re = new RegExp(`(${escapeRegExp(searchString)})`, 'gi');

    if ($a.length) {
      const text = $a.text();
      $a.html(text.replace(re, '<span class="highlight">$1</span>'));
    } else {
      const text = $cell.text();
      $cell.html(text.replace(re, '<span class="highlight">$1</span>'));
    }
  }

  // Highlight search terms in the rendered table (safe version)
  window.highlightSearchTerms = function highlightSearchTerms(designationSearch, titleSearch, abstractSearch) {
    $('#dataTable tbody tr').each(function () {
      const rowId = $(this).data('id');
      const isRowSelected = window.selectedRowIds && window.selectedRowIds.has
        ? window.selectedRowIds.has(rowId) : false;

      $(this).removeClass('match-row');
      $(this).find('.highlight').contents().unwrap(); // clear previous highlights safely

      $(this).find('td').each(function (index) {
        const $cell = $(this);
        const cellTextLower = $cell.text().toLowerCase();

        if (index === 0) {
          if (designationSearch && cellTextLower.includes(designationSearch)) {
            highlightDesignationTextOnly($cell, designationSearch);
            if (!isRowSelected) $cell.closest('tr').addClass('match-row');
          }
          return; // done with designation col
        }

        let searchText = null;
        if (index === 1) searchText = titleSearch;
        if (index === 2) searchText = abstractSearch;

        if (searchText && cellTextLower.includes(searchText)) {
          highlightTextNodes($cell, searchText);
          if (!isRowSelected) $cell.closest('tr').addClass('match-row');
        }
      });

      if (isRowSelected) $(this).addClass('selected-row');
    });
  };

})();