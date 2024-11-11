// interact.js
import { loadCSV } from './search.js';
import { pdfDocs, loadAndDisplayAllPages, updateProgress } from './display.js';

const extractedStandardsPerFile = {};
const unmatchedStandardsPerFile = {};

async function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  extractedStandardsPerFile = {};
  unmatchedStandardsPerFile = {};

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
}

function exportToCSV() {
  const header = "Document,Page Number,Identified Standard,Matched Standard,Title of Standard,Link\n";
  const matchedContent = Object.keys(extractedStandardsPerFile).map(fileName =>
    extractedStandardsPerFile[fileName].map(entry =>
      `${entry.fileName},${entry.page},${entry.text},"${entry.matchedStandard}","${entry.title}","${entry.link}"`
    ).join("\n")
  ).join("\n");

  const unmatchedHeader = "\n\nUnmatched Standards\nDocument,Page Number,Text\n";
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
  link.click();
}

document.getElementById('pdfUpload').addEventListener('change', handleFileUpload);
document.getElementById('exportButton').addEventListener('click', exportToCSV);

loadCSV();
