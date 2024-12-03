document.addEventListener('DOMContentLoaded', function () {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

  const standardPattern = /\b(?:ASTM\s[A-Za-z0-9\-]+(?:\s*\d{1,4}-\d{2,4}(?:[a-zA-Z]\d+)?(?:\(\d{4}\))?)|(?:CISPR|CISPR TR|ISO\/IEC|ISO|IEC TS|IEC|IEC TR|IEC SRD|TIR|TR|IEEE|AAMI|ASTM|DIN|BS|EN|CEN|ISO\/IEEE|ISO\/TIR|ISO\/TR|ISO\/TS|ISO TR|ISO\/IEEE)\s?[A-Za-z0-9\/\-]*\d{1,4}[-–]?\d{1,4}(?::\d{4})(?:\s*(?:Amd|DAmd|AMD|PRV|RLV|Rev|CSV|CMV|Cor|Amendment)\s*\d+(?::\d{4})?\s*;?)?(?:\s*\/\s*(AWI Amd|RLV|CSV|Cor|Amd|DAmd|AMD|Rev|Amendment)\s*\d+(?::\d{4})?)?)\b/g;

  let fileName = '';
  let csvDesignations = [];
  let csvUrls = [];
  let extractedStandards = {};

  // Normalize designation for comparison
  function normalizeDesignation(designation) {
    return designation
      .replace(/\s*-\s*/g, '-')  
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*\//g, '/')    
      .replace(/\s*(Amd|Rev|Amendment)\s*(\d+)/, '$1 $2') 
      .trim();
  }

  // Load multiple CSVs
// Array of CSV file URLs
const csvFiles = [
    'https://martincking.github.io/Standards-Selector/Standards_ISO.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_IMDRF.csv',
    'https://martincking.github.io/Standards-Selector/Standards_IEC.csv',
    'https://martincking.github.io/Standards-Selector/Standards_AAMI.csv',
    'https://martincking.github.io/Standards-Selector/Standards_ASTM.csv',
    'https://martincking.github.io/Standards-Selector/Standards_IEEE.csv',
    'https://martincking.github.io/Standards-Selector/Standards_CEN.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_FDA.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_MDCG.csv',
    'https://martincking.github.io/Standards-Selector/Standards_NIST.csv',
    'https://martincking.github.io/Standards-Selector/Standards_CSA.csv',
    'https://martincking.github.io/Standards-Selector/Standards_BSI.csv',
    'https://martincking.github.io/Standards-Selector/Standards_ANSI.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_EDQM.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_ICH.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_CIOMS.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_ISPE.csv',
    'https://martincking.github.io/Standards-Selector/Standards_IAF.csv',
    'https://martincking.github.io/Standards-Selector/Guidance_IPEC.csv',
    'https://martincking.github.io/Standards-Selector/FDA_Consensus_Standards.csv',
];

  async function loadCSVFiles() {
    console.log("Loading multiple CSV files...");
    for (let file of csvFiles) {
      const response = await fetch(file);
      const csvText = await response.text();

      // Parse the CSV file
      const parsedCSV = Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
      });

      // Extract designations and URLs
      parsedCSV.data.forEach(row => {
        const designation = row[1] ? normalizeDesignation(row[1].trim()) : null;
        const url = row[4] && row[4].startsWith("http") ? row[4].trim() : null;

        if (designation && url) {
          csvDesignations.push(designation);
          csvUrls.push(url);
        }
      });
    }

    console.log("Loaded designations from all CSVs:", csvDesignations);
    console.log("Loaded URLs from all CSVs:", csvUrls);
  }

  loadCSVFiles();

  // Function to extract and display text from PDF
  async function extractAndDisplayTextFromPDF(file) {
    fileName = file.name;
    extractedStandards[fileName] = new Set();

    const pdfData = new Uint8Array(await file.arrayBuffer());
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + ' ';

      console.log(`Page ${pageNum} text:`, pageText);

      let pageMatches = pageText.match(standardPattern);
      if (pageMatches) {
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
        const unmatchedLabel = document.createElement('strong');
        unmatchedLabel.textContent = 'Unmatched: ';
        const unmatchedText = document.createTextNode(standard);
        entryDiv.appendChild(unmatchedLabel);
        entryDiv.appendChild(unmatchedText);
      }

      sidebar.appendChild(entryDiv);
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

  document.getElementById('pdfUpload').addEventListener('change', async (event) => {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        await extractAndDisplayTextFromPDF(file);
      }
    }
  });
});
