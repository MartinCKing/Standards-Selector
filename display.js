// display.js
import { isPartialMatch, startsWithValidPrefix, designationsList } from './search.js';

const pdfDocs = {};
let pageTextData = [];

function updateProgress(current, total) {
  document.getElementById('progress-indicator').textContent = `${current} files of ${total} files read`;
}

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

export { pdfDocs, loadAndDisplayAllPages, updateProgress };
