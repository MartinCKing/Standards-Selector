pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

let pdfDocs = {};
let extractedStandardsPerFile = {};
let unmatchedStandardsPerFile = {};
let pageTextData = [];
let standardPatterns = [];

// Improved Regex for Matching Full Designations
// This regex captures the standard number with optional suffixes like /Amd, /DAmd, etc.
const standardPattern = /\b(?:ISO|IEC|IEEE|ANSI|AAMI|BS|DIN|ASTM|JIS|ISTA|IAF|ICH|CEN)(?:\/(?:TS|TR))?\s*[-/]?\s*\d+(?:[-–]\d+)*(?::\d{4})?(?:\s*\/\s*(?:Amd|DAmd|PRV|RLV)\s*\d+)?\b/gi;


// Load and parse Standards.csv to build dynamic regex patterns from the designation column only
async function loadCSV() {
  try {
    const response = await fetch('https://martincking.github.io/Standards-Selector/Standards.csv');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const csvText = await response.text();
    parseCSVData(csvText);
    console.log("Standards CSV loaded and patterns generated successfully.");
  } catch (error) {
    console.error("Error loading Standards.csv:", error);
  }
}

// Parse CSV data and build regex patterns only for valid designations
function parseCSVData(csvText) {
  const lines = csvText.split('\n');

  standardPatterns = lines.slice(1).map(line => {
    const columns = line.split(',');
    const designation = columns[1]?.trim();  // Column 2: Designation
    const title = columns[2]?.trim();        // Column 3: Title
    const url = columns[4]?.trim();          // Column 5: Link
    
    if (isValidDesignation(designation)) {
      const sanitizedDesignation = sanitizeDesignation(designation);
      const pattern = buildDesignationPattern(sanitizedDesignation);
      return { pattern: new RegExp(pattern, 'gi'), designation, title, url };
    } else {
      console.warn("Skipping invalid designation:", designation);
      return null;
    }
  }).filter(Boolean);  // Remove null entries
}

// Function to check if a designation is valid (e.g., ISO 12345:2020, IEC 67890)
function isValidDesignation(designation) {
  const validDesignationPattern = /^(ISO|IEC|IEEE|ANSI|AAMI|BS|DIN|ASTM|JIS|ISTA|IAF|ICH|CEN)[\s-]*\d+.*$/;
  return validDesignationPattern.test(designation);
}

// Function to sanitize designations by removing problematic characters
function sanitizeDesignation(designation) {
  return designation.replace(/[^A-Za-z0-9\s-:]/g, ''); // Remove special characters except hyphens and colons
}

// Build a regex pattern for an individual designation, capturing suffixes, amendments, and years
function buildDesignationPattern(designation) {
  // Split the designation into prefix, number, and suffixes
  const parts = designation.split(/[-\s/]+/).filter(part => /\d|^\D+$/g.test(part));
  const prefix = parts[0];  // Prefix (ISO, IEEE, etc.)
  const number = parts[1];  // Main number (e.g., 8536, 80369, etc.)
  const suffixes = parts.slice(2);  // Any suffixes or amendments after the number

  // Handle suffixes like Amd1, Amd 1, /DAmd 1, etc.
  const suffixPattern = suffixes.length > 0 ? `(?:[-/\\s]?${suffixes.join('[-/\\s]?')})?` : '';

  // Adjust regex to properly capture suffixes and amendments after the main number
  const fullPattern = `\\b(?:${prefix}|ISO|IEEE)\\s*${number}(?:[-/\\s]*\\d+)*(?:[-/\\s]*[A-Za-z0-9]+)?(?:${suffixPattern})(?::\\d{4})?(?:[-/\\s]?Amd[-/\\s]?\\d+)?\\b`;

  return fullPattern; // Return the full regex pattern to capture the standard number, including suffixes and amendments
}



// Handle file upload and initiate extraction
document.getElementById('pdfUpload').addEventListener('change', async (event) => {
  const files = Array.from(event.target.files);
  extractedStandardsPerFile = {};
  unmatchedStandardsPerFile = {};
  const progressIndicator = document.createElement('div');
  progressIndicator.id = 'progress-indicator';
  document.getElementById('top-bar').appendChild(progressIndicator);
  updateProgress(0, files.length);

  for (const [index, file] of files.entries()) {
    const fileName = file.name.split('.').slice(0, -1).join('.');
    const pdfData = new Uint8Array(await file.arrayBuffer());

    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
    pdfDocs[fileName] = pdfDoc;

    pageTextData = [];
    await loadAndDisplayAllPages(pdfDoc);
    await extractStandardsFromPDF(fileName);

    updateProgress(index + 1, files.length);
  }

  console.log("Final unmatched standards:", unmatchedStandardsPerFile);
});

function updateProgress(current, total) {
  const progressIndicator = document.getElementById('progress-indicator');
  progressIndicator.textContent = `${current} files of ${total} files read`;
}

// Load and display all pages of the PDF, cleaning up the text
async function loadAndDisplayAllPages(pdfDoc) {
  const pdfViewer = document.getElementById('pdf-viewer');
  pdfViewer.innerHTML = '';
  pageTextData = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const pageContainer = document.createElement('div');
    pageContainer.classList.add('page-container');
    pageContainer.dataset.pageNumber = pageNum;
    pdfViewer.appendChild(pageContainer);

    // Extract and clean up text content for the page
    const { textContent, viewport } = await renderPage(pageNum, pageContainer, pdfDoc);
    let fullText = textContent.items.map(item => item.str).join(' ');

    // Handle line breaks and hyphens at the end of lines
    fullText = fullText.replace(/-\s*\n/g, '').replace(/\s+/g, ' ').trim();

    pageTextData.push({ pageNum, fullText, viewport });
  }
}


// Render each page of the PDF
async function renderPage(pageNum, pageContainer, pdfDoc) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.5 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  pageContainer.appendChild(canvas);

  const context = canvas.getContext('2d');
  await page.render({ canvasContext: context, viewport: viewport }).promise;

  const textContent = await page.getTextContent();
  return { textContent, viewport };
}

// Extract standards from the PDF and handle duplicates effectively
async function extractStandardsFromPDF(fileName) {
  let standardsForCurrentFile = [];
  let unmatchedForCurrentFile = [];
  let uniqueMatches = new Set(); // Set to keep track of unique matches per page

  for (let { pageNum, fullText } of pageTextData) {
    standardPatterns.forEach(({ pattern, designation, title, url }) => {
      const regex = new RegExp(pattern, 'gi');
      let match;

      while ((match = regex.exec(fullText)) !== null) {
        const matchedText = match[0];

        // Avoid duplicate matches using Set
        if (!uniqueMatches.has(matchedText)) {
          uniqueMatches.add(matchedText);

          // Store matched standard with relevant information
          standardsForCurrentFile.push({
            fileName,
            page: pageNum,
            text: matchedText,
            matchedStandard: designation,
            title: title || '',
            link: url || ''
          });
        }
      }
    });
  }

  extractedStandardsPerFile[fileName] = standardsForCurrentFile;
  unmatchedStandardsPerFile[fileName] = unmatchedForCurrentFile;

  displayExtractedStandards(fileName, standardsForCurrentFile);
  displayUnmatchedStandards(fileName);
}

// Display extracted standards in the sidebar
function displayExtractedStandards(fileName, standardsForFile) {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = ''; // Clear the sidebar

  const fileHeader = document.createElement('h3');
  fileHeader.textContent = `Extracted Standards for ${fileName}`;
  sidebar.appendChild(fileHeader);

  standardsForFile.forEach(standard => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'standard-entry';

    const pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.textContent = `Page ${standard.page}`;
    pageLink.addEventListener('click', () => goToPage(standard.page, fileName));

    entryDiv.appendChild(pageLink);
    entryDiv.appendChild(document.createTextNode(`: ${standard.text}`));

    if (standard.link) {
      const link = document.createElement('a');
      link.href = standard.link;
      link.target = '_blank';
      link.textContent = ` - ${standard.matchedStandard}`;
      entryDiv.appendChild(link);
    } else {
      entryDiv.appendChild(document.createTextNode(` - ${standard.matchedStandard}`));
    }

    sidebar.appendChild(entryDiv);
  });
}

// Update CSV Export function to avoid including duplicates and handle links correctly
function exportToCSV() {
  const header = "Document,Page Number,Identified Standard,Matched Standard,Title of Standard,Link\n";

  const matchedContent = Object.keys(extractedStandardsPerFile).map(fileName =>
    extractedStandardsPerFile[fileName].map(entry =>
      `${entry.fileName},${entry.page},${entry.text},"${entry.matchedStandard}","${entry.title}","${entry.link}"`
    ).join("\n")
  ).join("\n");

  const unmatchedHeader = "\n\nUnmatched Standards with Valid Prefixes\nDocument,Page Number,Text\n";
  const unmatchedContent = Object.keys(unmatchedStandardsPerFile).map(fileName =>
    unmatchedStandardsPerFile[fileName].map(entry =>
      `${entry.fileName},${entry.page},"${entry.text}"`
    ).join("\n")
  ).join("\n");

  const fullContent = "data:text/csv;charset=utf-8," + header + matchedContent + unmatchedHeader + unmatchedContent;
  const encodedUri = encodeURI(fullContent);

  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `extracted_standards.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Load the CSV automatically on page load
window.onload = loadCSV;
