document.addEventListener('DOMContentLoaded', function () {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
  const standardPattern = /\b(?:ISO|IEC|IEEE|AAMI|ASTM|DIN|BS|CEN|ISO\/TS|ISO\/IEEE)\s?[A-Za-z0-9\/\-]*\d{1,4}[-–]?\d{1,4}(?::\d{4})(?:\/[A-Za-z0-9]+\d+)?(?:\s*(?:Amd|DAmd|PRV|RLV|Rev|Amendment)\s*(\d+)(?::\d{4})?)?\b/g;

  let extractedStandards = new Set();  // Use a Set to avoid duplicates
  let fileName = '';  
  let csvDesignations = [];
  let csvUrls = [];

  // Function to normalize designation for comparison (avoid trimming suffixes)
  function normalizeDesignation(designation) {
    return designation
    .replace(/\s*-\s*/g, '-')  // Remove spaces around hyphens
    .replace(/\s*:\s*/g, ':')  // Remove spaces around colons
    .replace(/\s*\//g, '/')    // Remove spaces before slashes
    .replace(/\s*(Amd|Rev|Amendment)\s*(\d+)/, '$1 $2')  // Preserve space between Amd and number
    .trim();                  // Trim leading and trailing spaces
  }

  // Function to parse the CSV file using Papa Parse
  async function loadCSV() {
    const response = await fetch('https://martincking.github.io/Standards-Selector/Standards.csv');
    const csvText = await response.text();

    // Use Papa Parse to handle CSV parsing with quoted fields
    const parsedCSV = Papa.parse(csvText, {
      header: false,  // No header in the CSV file
      skipEmptyLines: true,  // Skip empty lines
    });

    // Iterate through parsed rows and extract designations and URLs
    parsedCSV.data.forEach(row => {
      const designation = row[1] ? normalizeDesignation(row[1].trim()) : null;  // Extract and normalize the second column (designation)
      const url = row[4] && row[4].startsWith("http") ? row[4].trim() : null;  // Extract URL from the fifth column (index 4)

      // Only add valid designations and URLs
      if (designation && url) {
        csvDesignations.push(designation);
        csvUrls.push(url);
      }
    });

    console.log("Loaded and normalized designations from CSV:", csvDesignations);
    console.log("Loaded URLs from CSV:", csvUrls);
  }

  loadCSV(); // Call loadCSV when the page loads

  async function extractAndDisplayTextFromPDF(file) {
    fileName = file.name;

    const pdfData = new Uint8Array(await file.arrayBuffer()); // Convert the file to array buffer
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise; // Load the PDF document

    let fullText = '';

    // Loop through all pages of the PDF
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Accumulate the extracted text
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + ' ';

      console.log(`Page ${pageNum} text:`, pageText);

      // Find all matches on this page
      let pageMatches = pageText.match(standardPattern);
      if (pageMatches) {
        console.log(`Page ${pageNum} matches:`, pageMatches);

        // Store the standards without associating with a page number
        pageMatches.forEach((match) => {
          // Clean the match up and normalize it
          let cleanedMatch = normalizeDesignation(match);
          extractedStandards.add(cleanedMatch);  // Use Set to avoid duplicates
        });
      }
    }

    fullText = fullText.replace(/\s*-\s*/g, '-').replace(/\s*:\s*/g, ':').replace(/\s*\//g, '/');
    fullText = fullText.replace(/\s+/g, ' ').trim();

    console.log("Cleaned extracted text:", fullText);

    // Extract again after the main extraction to capture suffixes
    let moreMatches = fullText.match(standardPattern);
    console.log("Additional matches found:", moreMatches);

    if (moreMatches) {
      moreMatches.forEach((match) => {
        let cleanedMatch = normalizeDesignation(match);
        extractedStandards.add(cleanedMatch);  // Use Set to avoid duplicates
      });
    }

    displayExtractedStandards(Array.from(extractedStandards));  // Convert Set to Array for display
    renderPDF(pdfDoc);
  }

  // Function to display the extracted standards in the sidebar
  function displayExtractedStandards(standards) {
    const sidebar = document.getElementById('sidebar');
    
    // Create the header with the filename
    const fileHeader = document.createElement('h3');
    fileHeader.textContent = `Extracted Standards for ${fileName}`;
    sidebar.appendChild(fileHeader);

    // Append extracted standards below the file name header
    standards.forEach((standard) => {
      const matchIndex = csvDesignations.findIndex(designation => designation === standard);
      const entryDiv = document.createElement('div');
      entryDiv.className = 'standard-entry';

      if (matchIndex !== -1) {
        // Matched: hyperlink the standard using the URL from the CSV
        const matchedLabel = document.createElement('strong');
        matchedLabel.textContent = 'Matched: ';
        const link = document.createElement('a');

        // Get the URL from the corresponding matched index
        const matchedURL = csvUrls[matchIndex];

        // Create the hyperlink for the matched standard
        link.href = matchedURL;
        link.target = '_blank';  // Open in a new tab
        link.textContent = standard;

        entryDiv.appendChild(matchedLabel);
        entryDiv.appendChild(link);
      } else {
        // Unmatched: Bold the label and display the standard unbolded
        const unmatchedLabel = document.createElement('strong');
        unmatchedLabel.textContent = 'Unmatched: ';
        const unmatchedText = document.createTextNode(standard);
        entryDiv.appendChild(unmatchedLabel);
        entryDiv.appendChild(unmatchedText);
      }
      
      sidebar.appendChild(entryDiv); // Add to the bottom of the sidebar
    });
  }

  // Function to render the PDF in the viewer
  async function renderPDF(pdfDoc) {
    const viewer = document.getElementById('pdfViewer');
    viewer.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        viewer.appendChild(canvas);
      } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
      }
    }
  }

  // Event listener for file upload (multiple files allowed)
  document.getElementById('pdfUpload').addEventListener('change', async (event) => {
    const files = event.target.files;  // Get the list of selected files
    if (files) {
      // Process each file sequentially using a for loop
      for (let file of files) {
        await extractAndDisplayTextFromPDF(file);  // Call your function to process each file
      }
    }
  });
});
