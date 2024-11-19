document.addEventListener('DOMContentLoaded', function () {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

  const standardPattern = /\b(?:ASTM\s[A-Za-z0-9\-]+(?:\s*\d{1,4}-\d{2,4}(?:[a-zA-Z]\d+)?(?:\(\d{4}\))?)|(?:CISPR|CISPR TR|ISO\/IEC|ISO|IEC TS|IEC|IEC TR|IEC SRD|TIR|TR|IEEE|AAMI|ASTM|DIN|BS|EN|CEN|ISO\/IEEE|ISO\/TIR|ISO\/TR|ISO\/TS|ISO TR|ISO\/IEEE)\s?[A-Za-z0-9\/\-]*\d{1,4}[-–]?\d{1,4}(?::\d{4})(?:\s*(?:Amd|DAmd|AMD|PRV|RLV|Rev|CSV|CMV|Cor|Amendment)\s*\d+(?::\d{4})?\s*;?)?(?:\s*\/\s*(AWI Amd|RLV|CSV|Cor|Amd|DAmd|AMD|Rev|Amendment)\s*\d+(?::\d{4})?)?)\b/g;

  let fileName = '';  // Variable to store the filename
  let csvDesignations = [];
  let csvUrls = [];
  let extractedStandards = {};  // Store standards per document

  // Normalize designation for comparison
  function normalizeDesignation(designation) {
    return designation
      .replace(/\s*-\s*/g, '-')  
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*\//g, '/')    
      .replace(/\s*(Amd|Rev|Amendment)\s*(\d+)/, '$1 $2') 
      .trim();
  }

  // Load CSV file
  async function loadCSV() {
    const response = await fetch('https://martincking.github.io/Standards-Selector/Standards.csv');
    const csvText = await response.text();

    // Use Papa Parse to handle CSV parsing
    const parsedCSV = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    // Extract designations and URLs from CSV
    parsedCSV.data.forEach(row => {
      const designation = row[1] ? normalizeDesignation(row[1].trim()) : null;
      const url = row[4] && row[4].startsWith("http") ? row[4].trim() : null;

      if (designation && url) {
        csvDesignations.push(designation);
        csvUrls.push(url);
      }
    });

    console.log("Loaded designations from CSV:", csvDesignations);
    console.log("Loaded URLs from CSV:", csvUrls);
  }

  loadCSV();

  // Function to extract and display text from PDF
  async function extractAndDisplayTextFromPDF(file) {
    fileName = file.name;
    extractedStandards[fileName] = new Set();  // Initialize new Set for the file

    const pdfData = new Uint8Array(await file.arrayBuffer());
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let fullText = '';

    // Loop through pages of the PDF
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + ' ';

      console.log(`Page ${pageNum} text:`, pageText);

      // Match standards on this page
      let pageMatches = pageText.match(standardPattern);
      if (pageMatches) {
        console.log(`Page ${pageNum} matches:`, pageMatches);

        // Add matches to extractedStandards for this file
        pageMatches.forEach((match) => {
          let cleanedMatch = normalizeDesignation(match);

          const amendmentMatch = match.match(/(Amd|DAmd|PRV|RLV|Rev|Amendment)\s*(\d+)(?::\d{4})?\s*;?/);
          if (amendmentMatch) {
            const amendment = amendmentMatch[0];
            cleanedMatch = cleanedMatch.replace(amendment, '').trim();
            cleanedMatch = `${cleanedMatch}${amendment}`;
          }

          extractedStandards[fileName].add(cleanedMatch);
        });
      }
    }

    fullText = fullText.replace(/\s*-\s*/g, '-').replace(/\s*:\s*/g, ':').replace(/\s*\//g, '/');
    fullText = fullText.replace(/\s+/g, ' ').trim();

    let moreMatches = fullText.match(standardPattern);
    console.log("Additional matches found:", moreMatches);

    if (moreMatches) {
      moreMatches.forEach((match) => {
        let cleanedMatch = normalizeDesignation(match);

        const amendmentMatch = match.match(/(Amd|DAmd|PRV|RLV|Rev|Amendment)\s*(\d+)(?::\d{4})?\s*;?/);
        if (amendmentMatch) {
          const amendment = amendmentMatch[0];
          cleanedMatch = cleanedMatch.replace(amendment, '').trim();
          cleanedMatch = `${cleanedMatch}${amendment}`;
        }

        extractedStandards[fileName].add(cleanedMatch);
      });
    }

    displayExtractedStandards(fileName, Array.from(extractedStandards[fileName]));
    renderPDF(pdfDoc);
  }

  // Function to display extracted standards in the sidebar
  function displayExtractedStandards(fileName, standards) {
    const sidebar = document.getElementById('sidebar');

    // Create a header if it doesn't exist for the file
    if (!document.getElementById(`file-header-${fileName}`)) {
      const fileHeader = document.createElement('h3');
      fileHeader.id = `file-header-${fileName}`;
      fileHeader.textContent = `Extracted Standards for ${fileName}`;
      sidebar.appendChild(fileHeader);
    }

    standards.forEach((standard) => {
      const matchIndex = csvDesignations.findIndex(designation => designation === standard);
      const entryDiv = document.createElement('div');
      entryDiv.className = 'standard-entry';

      if (matchIndex !== -1) {
        // Matched: hyperlink the standard
        const matchedLabel = document.createElement('strong');
        matchedLabel.textContent = 'Matched: ';
        const link = document.createElement('a');
        const matchedURL = csvUrls[matchIndex];

        link.href = matchedURL;
        link.target = '_blank';
        link.textContent = standard;

        entryDiv.appendChild(matchedLabel);
        entryDiv.appendChild(link);
      } else {
        // Unmatched: display as unmatched
        const unmatchedLabel = document.createElement('strong');
        unmatchedLabel.textContent = 'Unmatched: ';
        const unmatchedText = document.createTextNode(standard);
        entryDiv.appendChild(unmatchedLabel);
        entryDiv.appendChild(unmatchedText);
      }

      sidebar.appendChild(entryDiv);  // Append the new standard entry to the sidebar
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

  // Event listener for file upload
  document.getElementById('pdfUpload').addEventListener('change', async (event) => {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        await extractAndDisplayTextFromPDF(file);
      }
    }
  });
});
