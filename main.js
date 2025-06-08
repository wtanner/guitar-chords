/**
 * Guitar Chords Application - Main JavaScript File
 * Phase 1: Core Infrastructure
 */

// Global variables
let chordDataset = [];
let currentChord = null;

/**
 * Represents a single guitar chord with all its properties
 */
class Chord {
    constructor(root, type, structure, fingerPositions, noteNames) {
        this.root = root;
        this.type = type;
        this.structure = structure.split(';'); // Convert semicolon-separated string to array
        this.fingerPositions = fingerPositions.split(','); // Convert comma-separated string to array
        this.noteNames = noteNames.split(','); // Convert comma-separated string to array
        this.displayName = `${root}${type}`;
    }

    /**
     * Get a human-readable description of the chord
     */
    getDescription() {
        return `${this.displayName} chord with finger positions: ${this.fingerPositions.join(', ')}`;
    }

    /**
     * Validate chord data integrity
     */
    isValid() {
        return this.fingerPositions.length === 6 &&
            this.noteNames.length === 6 &&
            this.structure.length > 0;
    }
}

/**
 * Parse CSV chord data into JavaScript objects
 * @param {string} csvData - Raw CSV content
 * @returns {Chord[]} Array of Chord objects
 */
function parseChordData(csvData) {
    const lines = csvData.trim().split('\n');
    const chords = [];

    // Skip header line (index 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue; // Skip empty lines

        try {
            // Split by semicolon, being careful with quoted strings
            const parts = parseCsvLine(line);

            if (parts.length >= 5) {
                const chord = new Chord(
                    parts[0], // CHORD_ROOT
                    parts[1], // CHORD_TYPE
                    parts[2].replace(/"/g, ''), // CHORD_STRUCTURE (remove quotes)
                    parts[3], // FINGER_POSITIONS
                    parts[4]  // NOTE_NAMES
                );

                if (chord.isValid()) {
                    chords.push(chord);
                } else {
                    console.warn(`Invalid chord data at line ${i + 1}:`, line);
                }
            }
        } catch (error) {
            console.warn(`Error parsing line ${i + 1}:`, line, error);
        }
    }

    console.log(`Successfully parsed ${chords.length} chords from dataset`);
    return chords;
}

/**
 * Parse a single CSV line with semicolon delimiters, handling quoted strings
 * @param {string} line - CSV line to parse
 * @returns {string[]} Array of field values
 */
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ';' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add the last field
    result.push(current.trim());
    return result;
}

/**
 * Select a random chord from the dataset
 * @returns {Chord|null} Random chord or null if dataset is empty
 */
function selectRandomChord() {
    if (chordDataset.length === 0) {
        console.error('No chords available in dataset');
        return null;
    }

    const randomIndex = Math.floor(Math.random() * chordDataset.length);
    const selectedChord = chordDataset[randomIndex];

    console.log(`Selected chord: ${selectedChord.displayName}`, selectedChord);
    return selectedChord;
}

/**
 * Load chord dataset from CSV file
 * @returns {Promise<boolean>} Success status
 */
async function loadChordDataset() {
    try {
        console.log('Loading chord dataset...');
        const response = await fetch('chord-fingers.csv');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvData = await response.text();
        chordDataset = parseChordData(csvData);

        if (chordDataset.length === 0) {
            throw new Error('No valid chords found in dataset');
        }

        console.log(`Dataset loaded successfully: ${chordDataset.length} chords`);
        return true;

    } catch (error) {
        console.error('Error loading chord dataset:', error);
        displayError('Failed to load chord dataset. Please check your connection and try again.');
        return false;
    }
}

/**
 * Calculate responsive dimensions based on viewport
 * @returns {Object} Dimensions object with width, height, and scaling factors
 */
function calculateDimensions() {
    // Always use viewport dimensions to prevent shrinking
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate optimal SVG dimensions maintaining aspect ratio
    const aspectRatio = 3 / 4; // Width to height ratio
    let svgWidth = Math.min(viewportWidth * 0.9, 600);
    let svgHeight = svgWidth / aspectRatio;

    if (svgHeight > viewportHeight * 0.9) {
        svgHeight = viewportHeight * 0.9;
        svgWidth = svgHeight * aspectRatio;
    }

    return {
        width: svgWidth,
        height: svgHeight,
        scale: svgWidth / 600 // Base scale factor
    };
}

/**
 * Generate SVG chord diagram with fretboard representation
 * @param {Chord} chord - Chord object to render
 * @param {Object} dimensions - Dimensions and scaling info
 * @returns {string} SVG markup for chord diagram
 */
function generateChordDiagram(chord, dimensions) {
    const { width, height, scale } = dimensions;
    const fretboardWidth = width * 0.6;
    const fretboardHeight = height * 0.4;
    const fretboardX = (width - fretboardWidth) / 2;
    const fretboardY = height * 0.3;

    const stringSpacing = fretboardWidth / 5; // 6 strings = 5 spaces
    const fretSpacing = fretboardHeight / 4; // 5 frets = 4 spaces

    let diagramSVG = '';

    // Draw fretboard outline
    diagramSVG += `<rect x="${fretboardX}" y="${fretboardY}" width="${fretboardWidth}" height="${fretboardHeight}" fill="none" stroke="black" stroke-width="2"/>`;

    // Draw strings (vertical lines)
    for (let i = 0; i <= 5; i++) {
        const x = fretboardX + (i * stringSpacing);
        diagramSVG += `<line x1="${x}" y1="${fretboardY}" x2="${x}" y2="${fretboardY + fretboardHeight}" stroke="black" stroke-width="1"/>`;
    }

    // Draw frets (horizontal lines)
    for (let i = 0; i <= 4; i++) {
        const y = fretboardY + (i * fretSpacing);
        diagramSVG += `<line x1="${fretboardX}" y1="${y}" x2="${fretboardX + fretboardWidth}" y2="${y}" stroke="black" stroke-width="1"/>`;
    }

    // Draw finger positions
    const fingerPositions = chord.fingerPositions;
    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
        const position = fingerPositions[stringIndex];
        const x = fretboardX + (stringIndex * stringSpacing);

        if (position === 'x') {
            // Muted string - draw X above fretboard
            const y = fretboardY - 20 * scale;
            diagramSVG += `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial" font-size="${16 * scale}" font-weight="bold">X</text>`;
        } else if (position === '0') {
            // Open string - draw O above fretboard
            const y = fretboardY - 20 * scale;
            diagramSVG += `<circle cx="${x}" cy="${y - 8 * scale}" r="${8 * scale}" fill="none" stroke="black" stroke-width="2"/>`;
        } else {
            // Fingered position - draw filled circle on fret
            const fretNumber = parseInt(position);
            if (fretNumber >= 1 && fretNumber <= 4) {
                const y = fretboardY + ((fretNumber - 0.5) * fretSpacing);
                diagramSVG += `<circle cx="${x}" cy="${y}" r="${10 * scale}" fill="black"/>`;
                diagramSVG += `<text x="${x}" y="${y + 5 * scale}" text-anchor="middle" font-family="Arial" font-size="${12 * scale}" fill="white" font-weight="bold">${position}</text>`;
            }
        }
    }

    return diagramSVG;
}

/**
 * Generate chord labels and text information
 * @param {Chord} chord - Chord object to render
 * @param {Object} dimensions - Dimensions and scaling info
 * @returns {string} SVG markup for text labels
 */
function createChordLabels(chord, dimensions) {
    const { width, height, scale } = dimensions;
    let labelsSVG = '';

    // Chord name (title)
    labelsSVG += `<text x="${width / 2}" y="${40 * scale}" text-anchor="middle" font-family="Arial" font-size="${32 * scale}" font-weight="bold">${chord.displayName}</text>`;

    // Chord structure
    labelsSVG += `<text x="${width / 2}" y="${80 * scale}" text-anchor="middle" font-family="Arial" font-size="${16 * scale}">Structure: ${chord.structure.join(', ')}</text>`;

    // String labels (Low E, A, D, G, B, High E)
    const stringNames = ['E', 'A', 'D', 'G', 'B', 'E'];
    const fretboardX = (width - width * 0.6) / 2;
    const stringSpacing = (width * 0.6) / 5;

    for (let i = 0; i < 6; i++) {
        const x = fretboardX + (i * stringSpacing);
        const y = height * 0.25;
        labelsSVG += `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial" font-size="${14 * scale}" font-weight="bold">${stringNames[i]}</text>`;
    }

    // Note names at bottom
    labelsSVG += `<text x="${width / 2}" y="${height * 0.8}" text-anchor="middle" font-family="Arial" font-size="${16 * scale}">Notes: ${chord.noteNames.join(', ')}</text>`;

    // Click instruction
    labelsSVG += `<text x="${width / 2}" y="${height * 0.9}" text-anchor="middle" font-family="Arial" font-size="${14 * scale}" fill="#666">Click anywhere to load another chord</text>`;

    return labelsSVG;
}

/**
 * Generate complete SVG for chord display
 * @param {Chord} chord - Chord object to render
 * @returns {string} Complete SVG markup
 */
function generateSVG(chord) {
    const dimensions = calculateDimensions();
    const { width, height } = dimensions;

    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="cursor: pointer;">`;

    // Add background
    svgContent += `<rect width="100%" height="100%" fill="white"/>`;

    // Add chord labels
    svgContent += createChordLabels(chord, dimensions);

    // Add chord diagram
    svgContent += generateChordDiagram(chord, dimensions);

    svgContent += `</svg>`;

    return svgContent;
}

/**
 * Display error message as SVG
 * @param {string} message - Error message to display
 */
function displayError(message) {
    const dimensions = calculateDimensions();
    const { width, height, scale } = dimensions;

    const errorSVG = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white"/>
            <text x="${width / 2}" y="${height / 2 - 20 * scale}" text-anchor="middle" font-family="Arial" font-size="${24 * scale}" font-weight="bold" fill="#666">Error</text>
            <text x="${width / 2}" y="${height / 2 + 20 * scale}" text-anchor="middle" font-family="Arial" font-size="${16 * scale}" fill="#666">${message}</text>
            <text x="${width / 2}" y="${height / 2 + 60 * scale}" text-anchor="middle" font-family="Arial" font-size="${14 * scale}" fill="#666">Click to reload</text>
        </svg>
    `;

    const display = document.getElementById('chord-display');
    display.innerHTML = errorSVG;
    display.onclick = () => location.reload();
}

/**
 * Display chord information as SVG
 * @param {Chord} chord - Chord to display
 */
function displayChordInfo(chord) {
    const svgMarkup = generateSVG(chord);
    const display = document.getElementById('chord-display');
    display.innerHTML = svgMarkup;

    // Add click handler to load new chord
    display.onclick = loadRandomChord;
}

/**
 * Display loading state as SVG
 */
function displayLoading() {
    const dimensions = calculateDimensions();
    const { width, height, scale } = dimensions;

    const loadingSVG = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white"/>
            <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="Arial" font-size="${24 * scale}" fill="#666">Generating chord...</text>
        </svg>
    `;

    const display = document.getElementById('chord-display');
    display.innerHTML = loadingSVG;
    display.onclick = null; // Remove click handler during loading
}

/**
 * Load and display a random chord
 */
async function loadRandomChord() {
    // Show loading state
    displayLoading();

    // Ensure dataset is loaded
    if (chordDataset.length === 0) {
        const success = await loadChordDataset();
        if (!success) return;
    }

    // Select and display random chord
    currentChord = selectRandomChord();
    if (currentChord) {
        displayChordInfo(currentChord);
    } else {
        displayError('Failed to select a random chord.');
    }
}

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('Initializing Guitar Chords Application...');

    try {
        // Load dataset and display first random chord
        await loadRandomChord();

        console.log('Application initialized successfully');

    } catch (error) {
        console.error('Failed to initialize application:', error);
        displayError('Failed to initialize application. Please refresh the page.');
    }
}

/**
 * Unit Tests (embedded alongside functions)
 */
function runTests() {
    console.log('Running embedded unit tests...');

    // Test CSV line parsing
    const testLine = 'A#;maj;"1;3;5";x,1,3,3,3,x;A#,E#,A#,C##';
    const parsed = parseCsvLine(testLine);
    console.assert(parsed.length === 5, 'CSV parsing should return 5 fields');
    console.assert(parsed[0] === 'A#', 'First field should be A#');
    console.assert(parsed[2] === '"1;3;5"', 'Third field should preserve quotes');

    // Test Chord creation
    const testChord = new Chord('C', 'maj', '1;3;5', 'x,3,2,0,1,0', 'C,E,G,C,E');
    console.assert(testChord.displayName === 'Cmaj', 'Display name should be Cmaj');
    console.assert(testChord.fingerPositions.length === 6, 'Should have 6 finger positions');
    console.assert(testChord.isValid(), 'Test chord should be valid');

    // Test random selection with empty dataset
    const originalDataset = chordDataset;
    chordDataset = [];
    console.assert(selectRandomChord() === null, 'Should return null for empty dataset');
    chordDataset = originalDataset;

    console.log('Unit tests completed');
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Run embedded tests in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        runTests();
    }

    // Initialize the main application
    initializeApp();
}); 