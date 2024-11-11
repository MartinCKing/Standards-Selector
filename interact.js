// interact.js
import { loadCSV } from './search.js';
import { displayExtractedStandards, goToPage } from './display.js';

const extractedStandardsPerFile = {};
const unmatchedStandardsPerFile = {};

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

    await loadAndDisplayAllPages(pdfDoc);
    await extractStandardsFromPDF(fileName);

    updateProgress(index + 1, files.length);
  }
});

function updateProgress(current, total) {
  const progressIndicator = document.getElementById('progress-indicator');
  progressIndicator.textContent = `${current} files of ${total} files read`;
}

async function extractStandardsFromPDF(fileName) {
  const standardPattern = /\b(?:ISO|IEC|IEEE|ANSI|AAMI|BS|DIN|ASTM|JIS|ISTA)(?:[\/\s]?(?:T[IR]|TS|AAMI|ANSI|EN|IEC))*\s*[-/\\]*\s*[DFE]?\d+(?:\s*[-–]?\s*\d+)*(?::\s*\d{4})?(?:\+AMD\d+:\d{4})?(?:[-–\w]*\d*[a-z]*)?\b/gi;

  let standardsForCurrentFile = [];
  let unmatchedForCurrentFile = [];

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

function displayUnmatchedStandards(fileName) {
  const sidebar = document.getElementById('sidebar');
  const unmatchedHeader = document.createElement('h3');
  unmatchedHeader.textContent = `Unmatched Standards for ${fileName} (Valid Prefixes)`;
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
