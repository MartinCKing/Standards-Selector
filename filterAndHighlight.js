/* filterAndHighlight.js
 *
 * - debouncedFilter(): debounce wrapper for filterTable()
 * - filterTable():
 *      • If user typed text (Designation/Title/Abstract), show only matching rows
 *      • If user only picked ASD (source), show ALL rows but BOOST that source to the top
 *      • Within matches, ASD rows are prioritized (not exclusive)
 * - highlightSearchTerms(): highlights the active search terms in the rendered table
 *
 * Dependencies expected:
 *   - jQuery
 *   - globals.js defines: allRows, selectedRowIds, debounceTimeout (optional)
 *   - dataLoader.js defines: renderTable(data)
 */

(function () {
  'use strict';

  // ---- Debounce for typing in search inputs ---------------------------------
  window.debouncedFilter = function debouncedFilter() {
    if (window.debounceTimeout) clearTimeout(window.debounceTimeout);
    window.debounceTimeout = setTimeout(filterTable, 300); // adjust if needed
  };

  // ---- Main filter function --------------------------------------------------
  window.filterTable = function filterTable() {
    const asdAcronymSearch = ($('#asdAcronymSearch').val() || '').toLowerCase().trim();
    const designationSearch = ($('#designationSearch').val() || '').toLowerCase().trim();
    const titleSearch       = ($('#titleSearch').val()       || '').toLowerCase().trim();
    const abstractSearch    = ($('#abstractSearch').val()    || '').toLowerCase().trim();

    const hasTextQuery = !!(designationSearch || titleSearch || abstractSearch);
    const ASD_BOOST = 100; // tune as you like

    let rowsWithMatchCounts = [];

    // Safety: guard if allRows not ready yet
    if (!Array.isArray(window.allRows) || window.allRows.length === 0) {
      // nothing loaded yet; nothing to render
      renderTable([]);
      return;
    }

    window.allRows.forEach((row, idx) => {
      let matchCount = 0;

      // Text matching across columns
      const d = (row.Designation || '').toLowerCase();
      const t = (row['Title of Standard'] || '').toLowerCase();
      const a = (row.Abstract || '').toLowerCase();

      if (designationSearch && d.includes(designationSearch)) matchCount++;
      if (titleSearch       && t.includes(titleSearch))       matchCount++;
      if (abstractSearch    && a.includes(abstractSearch))    matchCount++;

      // If user typed something, keep only rows that have at least one text match
      if (hasTextQuery && matchCount === 0) return;

      // ASD boost (prioritization, not filtering)
      let sourceBoost = 0;
      if (asdAcronymSearch) {
        const acronym = (row['ASD Acronym'] || '').toLowerCase();

        if (asdAcronymSearch === 'fda') {
          // Prioritize FDA Guidance but *not* FDA Consensus Standards
          const isFDA = acronym === 'fda';
          const isConsensus = d.includes('consensus');
          if (isFDA && !isConsensus) sourceBoost = ASD_BOOST;
        } else if (acronym.includes(asdAcronymSearch)) {
          sourceBoost = ASD_BOOST;
        }
      }

      const score = matchCount + sourceBoost;

      rowsWithMatchCounts.push({
        row,
        matchCount,
        score,
        idx,
        acronym: (row['ASD Acronym'] || '').toLowerCase()
      });
    });

    // Sorting:
    // 1) boosted score (via ASD) desc
    // 2) textual matchCount desc
    // 3) acronym asc (stable grouping by source)
    // 4) original index asc (stability)
    rowsWithMatchCounts.sort((a, b) =>
      (b.score - a.score) ||
      (b.matchCount - a.matchCount) ||
      a.acronym.localeCompare(b.acronym) ||
      (a.idx - b.idx)
    );

    const sortedData = rowsWithMatchCounts.map(item => item.row);

    // Render and then highlight
    renderTable(sortedData);
    highlightSearchTerms(designationSearch, titleSearch, abstractSearch);
  };

  // ---- Highlighter -----------------------------------------------------------
  // Highlights the current search strings in their respective columns.
  // It only wraps visible text nodes and avoids double-highlighting.
  window.highlightSearchTerms = function highlightSearchTerms(desigTerm, titleTerm, absTerm) {
    // Clear previous highlights
    $('#dataTable .highlight').each(function () {
      const $span = $(this);
      $span.replaceWith($span.text());
    });

    // Helper to safely escape regex characters
    function escapeRegex(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Recursively wrap matching text nodes within an element
    function highlightInElement($el, term) {
      if (!term) return;

      const needle = escapeRegex(term);
      const regex = new RegExp(needle, 'gi');

      // Depth-first traversal of child nodes
      $el.contents().each(function () {
        // element node
        if (this.nodeType === 1) {
          const $child = $(this);
          // Skip already highlighted segments
          if ($child.is('.highlight')) return;
          highlightInElement($child, term);
          return;
        }

        // text node
        if (this.nodeType === 3) {
          const text = this.nodeValue;
          if (!text) return;
          if (!regex.test(text)) return;

          // Reset regex lastIndex for subsequent operations
          regex.lastIndex = 0;

          // Replace matched portions with <span class="highlight">
          const replaced = text.replace(regex, (m) => `<span class="highlight">${m}</span>`);
          const $frag = $(replaced);
          $(this).replaceWith($frag);
        }
      });
    }

    // Column map: 1-based nth-child:
    // 1 = Designation, 2 = Title, 3 = Abstract
    if (desigTerm) {
      $('#dataTable tbody tr td:nth-child(1)').each(function () {
        highlightInElement($(this), desigTerm);
      });
    }
    if (titleTerm) {
      $('#dataTable tbody tr td:nth-child(2)').each(function () {
        highlightInElement($(this), titleTerm);
      });
    }
    if (absTerm) {
      $('#dataTable tbody tr td:nth-child(3)').each(function () {
        highlightInElement($(this), absTerm);
      });
    }
  };

})();
