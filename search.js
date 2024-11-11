// search.js

// Export designationsList and functions so other scripts can import them
export let designationsList = [];

// Function to load CSV data
export async function loadCSV() {
  const response = await fetch('https://martincking.github.io/Standards-Selector/Standards.csv');
  const csvText = await response.text();
  parseCSVData(csvText);
}

// Parse CSV into the list of designations
export function parseCSVData(csvText) {
  designationsList = csvText.split('\n').slice(1).map(line => {
    const columns = line.split(',');
    return {
      designation: columns[1]?.trim(),
      url: columns.find(col => col.trim().startsWith('http'))?.trim() || null,
      title: columns[2]?.trim()
    };
  }).filter(entry => entry.designation && entry.url);
}

// Normalize designations for consistent comparison
export function normalizeDesignation(text) {
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
export function isPartialMatch(extractedText, csvText) {
  const normalizedExtracted = normalizeDesignation(extractedText);
  const normalizedCSV = normalizeDesignation(csvText);
  return normalizedExtracted.includes(normalizedCSV) || normalizedCSV.includes(normalizedExtracted);
}

// Function to verify if a matched standard starts with a valid prefix
export function startsWithValidPrefix(text) {
  const validPrefixes = ["ISO", "IEC", "IEEE", "ANSI", "BS", "DIN", "ASTM", "JIS", "AAMI", "ISTA"];
  return validPrefixes.some(prefix => text.startsWith(prefix));
}
