pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

let pdfDocs = {};  // Store references to each loaded PDF by filename
let extractedStandardsPerFile = {}; // Object to store standards for each file by filename
let unmatchedStandardsPerFile = {}; // Object to store unmatched standards for each file
let pageTextData = [];
let designationsList = [];

// Define valid prefixes for standards
const validPrefixes = ["ISO", "IEC", "IEEE", "ANSI", "AAMI", "BS", "DIN", "ASTM", "JIS", "ISTA", "IAF", "ICH", "CEN"];

// Function to verify if a matched standard starts with a valid prefix
function startsWithValidPrefix(text) {
    return validPrefixes.some(prefix => text.startsWith(prefix));
}

// Load and parse Standards.csv
async function loadCSV() {
  try {
    const response = await fetch('https://martincking.github.io/Standards-Selector/Standards.csv');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const csvText = await response.text();
    parseCSVData(csvText);
    console.log("Standards CSV loaded successfully.");
  } catch (error) {
    console.error("Error loading Standards.csv:", error);
  }
}

// Parse CSV data into an array of objects with designation, URL, and title
function parseCSVData(csvText) {
  const lines = csvText.split('\n');
  designationsList = lines.slice(1).map(line => {
    const columns = line.split(',');
    const designation = columns[1]?.trim();
    const urlColumn = columns.find(column => column.trim().startsWith('http'));
    const url = urlColumn ? urlColumn.trim() : null;
    const title = columns[2]?.trim();

    if (designation && url) {
      return { designation, url, title };
    } else {
      console.warn("Skipping line due to missing designation or URL:", line);
      return null;
    }
  }).filter(entry => entry);
}

// Normalize designations for consistent comparison
function normalizeDesignation(text) {
    return text
        .replace(/\s*[-–]\s*/g, '-')  // Convert spaces around hyphens to a single hyphen
        .replace(/\s+/g, ' ')         // Collapse multiple spaces to a single space
        .replace(/\s*:\s*/, ':')      // Remove spaces around colons for years
        .replace(/\(R\)/g, '')        // Remove (R) as it may vary in inclusion
        .replace(/\bAmd\b/gi, 'AMD')  // Standardize Amd to AMD for consistency
        .replace(/\bAMD\b/g, '+AMD')  // Standardize to "+AMD" to match ISO formatting
        .replace(/\b\+?\s*AMD\d+:\d{4}\b/g, '') // Remove AMD annotations if not needed
        .toUpperCase();               // Convert to uppercase for consistent comparison
}

// Check if two designations are partial matches
function isPartialMatch(extractedText, csvText) {
    const normalizedExtracted = normalizeDesignation(extractedText);
    const normalizedCSV = normalizeDesignation(csvText);
    return normalizedExtracted.includes(normalizedCSV) || normalizedCSV.includes(normalizedExtracted);
}

// Handle file upload and initiate extraction
document.getElementById('pdfUpload').addEventListener('change', async (event) => {
  const files = Array.from(event.target.files);
  extractedStandardsPerFile = {}; // Clear previous data
  unmatchedStandardsPerFile = {}; // Clear previous unmatched standards
  const progressIndicator = document.createElement('div');
  progressIndicator.id = 'progress-indicator';
  document.getElementById('top-bar').appendChild(progressIndicator);
  updateProgress(0, files.length);

  for (const [index, file] of files.entries()) {
    const fileName = file.name.split('.').slice(0, -1).join('.');
    const pdfData = new Uint8Array(await file.arrayBuffer());

    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
    pdfDocs[fileName] = pdfDoc; // Store PDF reference by filename

    pageTextData = [];
    await loadAndDisplayAllPages(pdfDoc);
    await extractStandardsFromPDF(fileName);

    updateProgress(index + 1, files.length);
  }

  console.log("Final unmatched standards:", unmatchedStandardsPerFile); // Log unmatched standards
});

function updateProgress(current, total) {
  const progressIndicator = document.getElementById('progress-indicator');
  progressIndicator.textContent = `${current} files of ${total} files read`;
}

// Load and display all pages of the PDF
async function loadAndDisplayAllPages(pdfDoc) {
  const pdfViewer = document.getElementById('pdf-viewer');
  pdfViewer.innerHTML = '';
  pageTextData = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const pageContainer = document.createElement('div');
    pageContainer.classList.add('page-container');
    pageContainer.dataset.pageNumber = pageNum;
    pdfViewer.appendChild(pageContainer);

    const { textContent, viewport } = await renderPage(pageNum, pageContainer, pdfDoc);
    pageTextData.push({ pageNum, textContent, viewport });
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

// Extract standards from the PDF and add valid entries to extractedStandardsPerFile
async function extractStandardsFromPDF(fileName) {
  const standardPattern = /\b(?:ISO|IEC|IEEE|ANSI|AAMI|BS|DIN|ASTM|JIS|ISTA|IAF|ICH|CEN)(?:\/(?:TS|TR))?\s*[-/\\]*\s*[DFE]?\d+(?:[-–]\d+)*(?::\d{4})?(?:\+\s?AMD\d+:\d{4})?(?:[-–\w]*\d*[a-z]*)?\b/gi;

  let standardsForCurrentFile = []; // Temporarily store standards for the current file
  let unmatchedForCurrentFile = []; // Temporarily store unmatched standards for the current file

  for (let { pageNum, textContent } of pageTextData) {
    const pageText = textContent.items.map(item => item.str).join(' ');
    let match;

    while ((match = standardPattern.exec(pageText)) !== null) {
      const matchedText = match[0];

      const foundDesignation = designationsList.find(d => 
        isPartialMatch(matchedText, d.designation) && startsWithValidPrefix(d.designation)
      );

      if (foundDesignation) {
        const standardEntry = {
          fileName,
          page: pageNum,
          text: matchedText,
          matchedStandard: foundDesignation.designation,
          title: foundDesignation.title,
          link: foundDesignation.url
        };

        standardsForCurrentFile.push(standardEntry);
      } else if (startsWithValidPrefix(matchedText)) {
        unmatchedForCurrentFile.push({ fileName, page: pageNum, text: matchedText });
      }
    }
  }

  extractedStandardsPerFile[fileName] = standardsForCurrentFile;
  unmatchedStandardsPerFile[fileName] = unmatchedForCurrentFile;
  displayExtractedStandards(fileName, standardsForCurrentFile);
  displayUnmatchedStandards(fileName);
}

// Display extracted standards in the sidebar
function displayExtractedStandards(fileName, standardsForFile) {
  const sidebar = document.getElementById('sidebar');
  const fileHeader = document.createElement('h3');
  fileHeader.textContent = `Extracted Standards for ${fileName}`;
  sidebar.appendChild(fileHeader);

  standardsForFile.forEach(standard => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'standard-entry';

    // Create a link for the page number
    const pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.textContent = `Page ${standard.page}`;
    pageLink.addEventListener('click', () => goToPage(standard.page, fileName));

    // Append the page link and the identified standard text
    entryDiv.appendChild(pageLink);
    entryDiv.appendChild(document.createTextNode(`: ${standard.text}`));

    // Add the "Current" link below the identified standard (on a new line)
    if (standard.matchedStandard !== "No match found") {
      const currentLabel = document.createElement("span");
      currentLabel.textContent = "Matched:";
      currentLabel.style.fontWeight = "bold";  // Make "Current:" bold
      
      const link = document.createElement('a');
      link.className = 'current-standard';
      link.href = standard.link;
      link.target = '_blank';
      link.textContent = standard.matchedStandard;

      // Create a div to ensure "Current" is on a new line
      const currentDiv = document.createElement("div");
      currentDiv.appendChild(currentLabel);
      currentDiv.appendChild(link);
      
      // Append the div with the "Current" info to the entryDiv
      entryDiv.appendChild(currentDiv);
    } else {
      // If no match is found, display "No current standard found"
      const noCurrent = document.createElement('div');
      noCurrent.className = 'no-current-standard';
      noCurrent.textContent = "No current standard found";

      entryDiv.appendChild(document.createElement("br"));
      entryDiv.appendChild(noCurrent);
    }

    // Append the entry to the sidebar
    sidebar.appendChild(entryDiv);
  });
}

// Display unmatched standards in the sidebar
function displayUnmatchedStandards(fileName) {
  const sidebar = document.getElementById('sidebar');
  const unmatchedHeader = document.createElement('h3');
  unmatchedHeader.textContent = `Unmatched Standards for ${fileName} (Valid Prefixes)`;
  unmatchedHeader.style.cursor = 'pointer';
  sidebar.appendChild(unmatchedHeader);

  unmatchedStandardsPerFile[fileName].forEach(standard => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'unmatched-standard-entry';

    const pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.textContent = `Page ${standard.page}`;
    pageLink.addEventListener('click', () => goToPage(standard.page, fileName));

    entryDiv.appendChild(pageLink);
    entryDiv.appendChild(document.createTextNode(`: ${standard.text}`));

    sidebar.appendChild(entryDiv);
  });
}

// Function to navigate to a specific page in the PDF viewer based on file context
function goToPage(pageNumber, fileName) {
  const pdfDoc = pdfDocs[fileName]; // Retrieve the correct pdfDoc for the specified file

  pdfDoc.getPage(pageNumber).then((page) => {
    const viewport = page.getViewport({ scale: 1.5 });
    const pdfViewer = document.getElementById('pdf-viewer');
    
    pdfViewer.innerHTML = ''; // Clear the viewer and render the selected page only
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    pdfViewer.appendChild(canvas);

    const context = canvas.getContext('2d');
    page.render({ canvasContext: context, viewport: viewport }).promise;
  }).catch(error => {
    console.error(`Error navigating to page ${pageNumber} in ${fileName}:`, error);
  });
}

// CSV Export Function
document.getElementById('exportButton').addEventListener('click', exportToCSV);

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

