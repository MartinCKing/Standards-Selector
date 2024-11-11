// display.js
import { designationsList, isPartialMatch, startsWithValidPrefix } from './search.js';

console.log(designationsList);  // Check if designationsList is available

// Example function to display standards, just for demonstration
export function displayExtractedStandards(fileName, standardsForFile) {
  const sidebar = document.getElementById('sidebar');
  const fileHeader = document.createElement('h3');
  fileHeader.textContent = `Extracted Standards for ${fileName}`;
  fileHeader.style.cursor = 'pointer';
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
    sidebar.appendChild(entryDiv);
  });
}

// Example function for navigating to a specific page in the PDF viewer
export function goToPage(pageNumber, fileName) {
  const pdfDoc = pdfDocs[fileName];
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
