function debouncedFilter() {
  clearTimeout(window.debounceTimeout);
  window.debounceTimeout = setTimeout(filterTable, 300);
}

function getSelectedGroupValue() {
  const dropdown = document.getElementById('guidanceDropdown');
  return dropdown ? String(dropdown.value || '').trim().toLowerCase() : '';
}

function normalizeSpaces(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function designationStartsWith(designation, prefixes) {
  return prefixes.some(prefix => designation.startsWith(prefix));
}

function getDropdownSourceScore(row, selectedGroup) {
  if (!selectedGroup) return 0;

  const acronym = normalizeSpaces(row['ASD Acronym']);
  const designation = normalizeSpaces(row.Designation);
  const title = normalizeSpaces(row['Title of Standard']);

  switch (selectedGroup) {
    case 'bsi':
      // Prefer genuine BSI / BS first
      if (acronym === 'bsi') return 5;
      if (designationStartsWith(designation, ['bsi '])) return 4;
      if (designationStartsWith(designation, ['bs '])) return 3;
      return 0;

    case 'iso':
      // Prefer pure ISO first, adopted BS/EN/DIN ISO later
      if (acronym === 'iso') return 5;
      if (designationStartsWith(designation, ['iso '])) return 4;
      if (designationStartsWith(designation, ['en iso '])) return 3;
      if (designationStartsWith(designation, ['bs en iso ', 'din en iso '])) return 2;
      return 0;

    case 'iec':
      // Prefer pure IEC first, adopted BS/EN/DIN IEC later
      if (acronym === 'iec') return 5;
      if (designationStartsWith(designation, ['iec '])) return 4;
      if (designationStartsWith(designation, ['en iec '])) return 3;
      if (designationStartsWith(designation, ['bs en iec ', 'din en iec '])) return 2;
      return 0;

    case 'cen':
      if (acronym === 'cen') return 5;
      if (designationStartsWith(designation, ['cen ', 'cen/'])) return 4;
      if (designationStartsWith(designation, ['cen/tr ', 'cen ts '])) return 3;
      return 0;

    case 'ansi':
      if (acronym === 'ansi') return 5;
      if (designationStartsWith(designation, ['ansi ', 'ansi/'])) return 4;
      return 0;

    case 'iaf':
      if (acronym === 'iaf') return 5;
      if (designationStartsWith(designation, ['iaf '])) return 4;
      return 0;

    case 'echa':
      if (acronym === 'echa') return 5;
      if (designationStartsWith(designation, ['echa '])) return 4;
      return 0;

    case 'ich':
      if (acronym === 'ich') return 5;
      if (designationStartsWith(designation, ['ich '])) return 4;
      return 0;

    case 'ispe':
      if (acronym === 'ispe') return 5;
      if (designationStartsWith(designation, ['ispe '])) return 4;
      return 0;

    case 'nist':
      if (acronym === 'nist') return 5;
      if (designationStartsWith(designation, ['nist '])) return 4;
      return 0;

    case 'pics':
      if (acronym === 'pics' || acronym === 'pic/s') return 5;
      if (designationStartsWith(designation, ['pic/s ', 'pics '])) return 4;
      if (title.includes('pic/s')) return 2;
      return 0;

    case 'fda':
      if (designation.includes('consensus')) return 0;
      if (acronym === 'fda') return 5;
      if (designationStartsWith(designation, ['fda '])) return 4;
      if (title.includes('food and drug administration')) return 2;
      return 0;

    case 'fdacs':
      if (acronym === 'fdacs') return 5;
      if (acronym === 'fda consensus' || acronym === 'fda consensus standards') return 4;
      if (designation.includes('consensus')) return 3;
      return 0;

    default:
      if (acronym === selectedGroup) return 5;
      if (designationStartsWith(designation, [selectedGroup + ' ', selectedGroup + '/'])) return 4;
      return 0;
  }
}

function filterTable() {
  if (!window.allRows || window.allRows.length === 0) return;

  const selectedGroup = getSelectedGroupValue();
  const designationSearch = ($('#designationSearch').val() || '').toLowerCase().trim();
  const titleSearch = ($('#titleSearch').val() || '').toLowerCase().trim();
  const abstractSearch = ($('#abstractSearch').val() || '').toLowerCase().trim();

  let rowsWithScores = [];

  window.allRows.forEach(row => {
    const designation = normalizeSpaces(row.Designation);
    const title = normalizeSpaces(row['Title of Standard']);
    const abstract = normalizeSpaces(row.Abstract);

    let matchCount = 0;
    if (designationSearch && designation.includes(designationSearch)) matchCount++;
    if (titleSearch && title.includes(titleSearch)) matchCount++;
    if (abstractSearch && abstract.includes(abstractSearch)) matchCount++;

    const sourceScore = getDropdownSourceScore(row, selectedGroup);

    rowsWithScores.push({ row, matchCount, sourceScore });
  });

  rowsWithScores.sort((a, b) => {
    // Selected source should come first, with pure matches before adopted ones
    if (selectedGroup && b.sourceScore !== a.sourceScore) {
      return b.sourceScore - a.sourceScore;
    }

    // Then text relevance
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }

    // Stable fallback
    const aDesignation = normalizeSpaces(a.row.Designation);
    const bDesignation = normalizeSpaces(b.row.Designation);
    return aDesignation.localeCompare(bDesignation);
  });

  renderTable(rowsWithScores.map(item => item.row));
  highlightSearchTerms(designationSearch, titleSearch, abstractSearch);
}

function clearHighlights() {
  $('#dataTable tbody .highlight').contents().unwrap();
  $('#dataTable tbody tr').removeClass('match-row');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightTextNodes($container, searchText) {
  if (!searchText) return;
  const re = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');

  $container.contents().each(function () {
    if (this.nodeType === 3) {
      const original = this.nodeValue;
      const replaced = original.replace(re, '<span class="highlight">$1</span>');
      if (replaced !== original) {
        $(this).replaceWith(replaced);
      }
      return;
    }

    if (this.nodeType === 1) {
      if ($(this).is('.highlight')) return;
      highlightTextNodes($(this), searchText);
    }
  });
}

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

function highlightSearchTerms(designationSearch, titleSearch, abstractSearch) {
  $('#dataTable tbody tr').each(function () {
    const rowIndex = $(this).data('index');
    const isRowSelected = window.selectedRowIds.has(rowIndex);

    $(this).removeClass('match-row');
    $(this).find('.highlight').contents().unwrap();

    $(this).find('td').each(function (index) {
      const cell = $(this);
      const cellTextLower = cell.text().toLowerCase();

      // 0 Copilot, 1 Designation, 2 Title, 3 Abstract
      if (index === 1) {
        if (designationSearch && cellTextLower.includes(designationSearch)) {
          highlightDesignationTextOnly(cell, designationSearch);
          if (!isRowSelected) cell.closest('tr').addClass('match-row');
        }
        return;
      }

      let searchText = null;
      if (index === 2) searchText = titleSearch;
      if (index === 3) searchText = abstractSearch;

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