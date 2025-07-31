function hideAllBanners() {
    $('#bsiBanner').hide();
}

$('#BSI').click(function () {
    hideAllBanners();                                 // Hide all banners
    $('#asdAcronymSearch').val('BSI');                // Set acronym filter input to 'BSI'
    $('#bsiBanner').show();                           // Show the BSI banner
    debouncedFilter();     
});

$('#displaySelected').click(function() {
    hideAllBanners();
    const selectedRows = [];
    const nonSelectedRows = [];
    allRows.forEach(row => {
        const globalIndex = allRows.indexOf(row);
        if (selectedRowIds.has(globalIndex)) {
            selectedRows.push(row);
        } else {
            nonSelectedRows.push(row);
        }
    });
    const sortedData = selectedRows.concat(nonSelectedRows);
    renderTable(sortedData);
    highlightSearchTerms($('#asdAcronymSearch').val(), $('#titleSearch').val(), $('#abstractSearch').val());
});

$('#hideAbstract').click(function() {
    hideAllBanners();
    abstractVisible = !abstractVisible;
    $('td:nth-child(3), th:nth-child(3)').toggle(abstractVisible);
    $(this).text(abstractVisible ? 'Hide Abstract' : 'Show Abstract');
});

$('#reset').click(function() {
    hideAllBanners();
    selectedRowIds.clear();
    $('#asdAcronymSearch, #titleSearch, #abstractSearch').val('');
    loadCSV();
});

$('#clearSelections').click(function() {
    hideAllBanners();
    selectedRowIds.clear();
    $('#dataTable tbody tr').removeClass('selected-row');
});

// Populate the designation search field with "MDCG" when the button is clicked
$('#MDCG').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('MDCG'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "FDA" when the button is clicked
$('#FDA').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('FDA'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ICH" when the button is clicked
$('#ICH').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('ICH'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "IMDRF" when the button is clicked
$('#IMDRF').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('IMDRF'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "IPEC" when the button is clicked
$('#IPEC').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('IPEC'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "EDQM" when the button is clicked
$('#EDQM').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('EDQM'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});


// Populate the designation search field with "CIOMS" when the button is clicked
$('#CIOMS').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('CIOMS'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ISPE" when the button is clicked
$('#ISPE').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('ISPE'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ISO" when the button is clicked
$('#ISO').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('ISO'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});


// Populate the designation search field with "IEC" when the button is clicked
$('#IEC').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('IEC'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ASTM" when the button is clicked
$('#ASTM').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('ASTM'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "CEN" when the button is clicked
$('#CEN').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('CEN'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "AAMI" when the button is clicked
$('#AAMI').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('AAMI'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "ANSI" when the button is clicked
$('#ANSI').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('ANSI'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "CSA" when the button is clicked
$('#CSA').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('CSA'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});
// Populate the designation search field with "ECHA" when the button is clicked
$('#ECHA').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('ECHA'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});
// Populate the designation search field with "IAF" when the button is clicked
$('#IAF').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('IAF'); // Set the value of the designation search input
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "FDA Consensus Standards" when the button is clicked
$('#FDACS').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('FDACS'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});


// Populate the designation search field with "Globally Harmonized System GHS" when the button is clicked
$('#GHS').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('GHS'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "NIST" when the button is clicked
$('#NIST').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('NIST'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "PIC/S" when the button is clicked
$('#PICS').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('PIC/S'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});

// Populate the designation search field with "GHWP" when the button is clicked
$('#GHWP').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('GHWP'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});
// Populate the designation search field with "MEDDEV" when the button is clicked
$('#MEDDEV').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('MEDDEV'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});
// Populate the designation search field with "MDSAP" when the button is clicked
$('#MDSAP').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('MDSAP'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});
// Populate the designation search field with "Team-NB" when the button is clicked
$('#Team-NB').click(function () {
    hideAllBanners();
    $('#asdAcronymSearch').val('Team-NB'); // Match exact CSV value
    debouncedFilter(); // Trigger the filtering function
});
// Handle dropdown menu selection
$('#guidanceDropdown').change(function () {
    hideAllBanners(); // Always hide any banners first
    const selectedValue = $(this).val(); // Get the selected value from the dropdown
    if (selectedValue) {
        $('#asdAcronymSearch').val(selectedValue); // Set the value of the designation search input
        debouncedFilter(); // Trigger the filtering function
    }
    if (selectedValue === 'BSI') {
    $('#bsiBanner').show(); // Show the banner if BSI is selected
}
    document.addEventListener("DOMContentLoaded", function () {
    const params = getQueryParams();

    // Existing query param logic...
    if (params.designation) {
        document.getElementById("designationSearch").value = params.designation;
    }
    if (params.title) {
        document.getElementById("titleSearch").value = params.title;
    }
    if (params.abstract) {
        document.getElementById("abstractSearch").value = params.abstract;
    }

    // Automatically select "BSI" on first load if no other dropdown value is given
    const dropdown = document.getElementById("guidanceDropdown");
    const hasDropdownParam = params.dropdownwindow;

    if (!hasDropdownParam) {
        for (let i = 0; i < dropdown.options.length; i++) {
            if (dropdown.options[i].value === "BSI") {
                dropdown.selectedIndex = i;
                dropdown.dispatchEvent(new Event("change")); // triggers your logic
                break;
            }
        }
    } else {
        // Apply dropdown param if present
        for (let i = 0; i < dropdown.options.length; i++) {
            if (dropdown.options[i].value === params.dropdownwindow) {
                dropdown.selectedIndex = i;
                dropdown.dispatchEvent(new Event("change"));
                break;
            }
        }
    }

    debouncedFilter(); // Optional, if not already called in change
});
});
