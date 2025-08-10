
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
        if (asdAcronymSearch) {
           const acronym = (row['ASD Acronym'] || '').toLowerCase();
            if (asdAcronymSearch === 'fda') {
            // Only match FDA Guidance, not FDA Consensus Standards
            if (acronym === 'fda' && !(row.Designation || '').toLowerCase().includes('consensus')) {
            matchCount++;
            }
          } else if (acronym.includes(asdAcronymSearch)) {
        matchCount++;
    }
}
        rowsWithMatchCounts.push({ row, matchCount });
    });

    rowsWithMatchCounts.sort((a, b) => b.matchCount - a.matchCount);
    const sortedData = rowsWithMatchCounts.map(item => item.row);
    renderTable(sortedData);
    highlightSearchTerms(designationSearch, titleSearch, abstractSearch);
}

function clearHighlights() {
    $('#dataTable tbody .highlight').contents().unwrap();
    $('#dataTable tbody tr').removeClass('match-row');
}

// Highlight search terms in the rendered table
function highlightSearchTerms(designationSearch, titleSearch, abstractSearch) {
    $('#dataTable tbody tr').each(function() {
        const rowId = $(this).data('id');
        const isRowSelected = selectedRowIds.has(rowId);
        $(this).removeClass('match-row');
        $(this).find('.highlight').contents().unwrap();
        
        $(this).find('td').each(function(index) {
            const cell = $(this);
            let searchText;
            let cellText = cell.text();

            switch (index) {
                case 0:
                    searchText = designationSearch;
                    if (searchText && cellText.toLowerCase().includes(searchText)) {
                        highlightDesignationTextOnly(cell, searchText);
                        if (!isRowSelected) $(this).closest('tr').addClass('match-row');
                    }
                    break;
                case 1:
                    searchText = titleSearch;
                    break;
                case 2:
                    searchText = abstractSearch;
                    break;
            }

            if (searchText && index !== 0 && cellText.toLowerCase().includes(searchText)) {
                const regex = new RegExp(`(${searchText})`, 'gi');
                cell.html((_, html) => html.replace(regex, '<span class="highlight">$1</span>'));
                if (!isRowSelected) $(this).closest('tr').addClass('match-row');
            }
        });

        if (isRowSelected) {
            $(this).addClass('selected-row');
        }
    });
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightDesignationTextOnly(cell, searchString) {
  const a = cell.find('a').first();
  const safe = escapeRegExp(searchString);
  const re = new RegExp(`(${safe})`, 'gi');

  if (a.length) {
    // Highlight only the anchor's *text*, not attributes
    const text = a.text();
    a.html(text.replace(re, '<span class="highlight">$1</span>'));
  } else {
    // No link: highlight the cell's plain text only
    const text = cell.text();
    cell.html(text.replace(re, '<span class="highlight">$1</span>'));
  }
}

