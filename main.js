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
        // FINGER_POSITIONS should always have 6 elements (one per string)
        // NOTE_NAMES should have entries for all non-x positions in FINGER_POSITIONS
        const nonXCount = this.fingerPositions.filter(pos => pos !== 'x').length;
        return this.fingerPositions.length === 6 &&
            this.noteNames.length === nonXCount &&
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
            current += char; // Preserve the quote character
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
 * Calculate the base fret position for a chord
 * @param {Chord} chord - Chord object
 * @returns {number} Base fret number (0-11)
 */
function calculateBaseFret(chord) {
    // Standard guitar tuning (string number -> open note)
    const openStringNotes = {
        6: 'E',  // Low E
        5: 'A',  // A
        4: 'D',  // D
        3: 'G',  // G
        2: 'B',  // B
        1: 'E'   // High E
    };

    // Chromatic scale for calculating fret distances
    const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Helper function to normalize note names (handle enharmonic equivalents)
    function normalizeNote(note) {
        const noteMap = {
            'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
            'C##': 'D', 'D##': 'E', 'E#': 'F', 'F##': 'G', 'G##': 'A', 'A##': 'B', 'B#': 'C',
            'Fb': 'E', 'Cb': 'B'
        };
        return noteMap[note] || note;
    }

    // Helper function to calculate fret distance between two notes
    function getFretDistance(fromNote, toNote) {
        const normalizedFrom = normalizeNote(fromNote);
        const normalizedTo = normalizeNote(toNote);

        const fromIndex = chromaticScale.indexOf(normalizedFrom);
        const toIndex = chromaticScale.indexOf(normalizedTo);

        if (fromIndex === -1 || toIndex === -1) {
            console.warn(`Unknown note: ${fromNote} -> ${normalizedFrom} or ${toNote} -> ${normalizedTo}`);
            return 0;
        }

        // Calculate distance, handling wrap-around
        let distance = toIndex - fromIndex;
        if (distance < 0) {
            distance += 12; // Add octave
        }
        return distance;
    }

    // Find first non-x finger position and map to correct note
    // NOTE_NAMES contains notes for all non-x positions in FINGER_POSITIONS order
    let noteIndex = 0; // Tracks which non-x position we're at

    for (let i = 0; i < chord.fingerPositions.length; i++) {
        const position = chord.fingerPositions[i];
        if (position !== 'x') {
            // This is the first non-x position - use it for base fret calculation
            const stringNumber = 6 - i; // Convert index to string number
            const targetNote = chord.noteNames[noteIndex]; // First note corresponds to first non-x position
            const openNote = openStringNotes[stringNumber];

            // Calculate what fret this note would be on this string
            const fretDistance = getFretDistance(openNote, targetNote);

            return fretDistance;
        }
        // If position is 'x', we continue to the next position without incrementing noteIndex
        // because NOTE_NAMES doesn't include entries for muted strings
    }

    return 0; // Default to open position if no fingered notes found
}

/**
 * Generate SVG chord diagram with fretboard representation
 * @param {Chord} chord - Chord object to render
 * @param {Object} dimensions - Dimensions and scaling info
 * @returns {string} SVG markup for chord diagram
 */
function generateChordDiagram(chord, dimensions) {
    const { width, height, scale } = dimensions;
    const fretboardWidth = width * 0.5;  // Make narrower
    const fretboardHeight = height * 0.5; // Make taller 
    const fretboardX = (width - fretboardWidth) / 2;
    const fretboardY = height * 0.25;     // Move up slightly

    const stringSpacing = fretboardWidth / 5; // 6 strings = 5 spaces
    const fretSpacing = fretboardHeight / 4; // 5 frets = 4 spaces

    // Calculate base fret position
    const baseFret = calculateBaseFret(chord);

    let diagramSVG = '';

    // Display base fret number to the left of the fretboard
    if (baseFret > 0) {
        diagramSVG += `<text x="${fretboardX - 30 * scale}" y="${fretboardY + fretSpacing / 2}" text-anchor="middle" font-family="Arial" font-size="${20 * scale}" font-weight="bold">${baseFret}</text>`;
    }

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
        // Make the top line (nut) thicker for open position chords
        const strokeWidth = (i === 0 && baseFret === 0) ? "6" : "1";
        diagramSVG += `<line x1="${fretboardX}" y1="${y}" x2="${fretboardX + fretboardWidth}" y2="${y}" stroke="black" stroke-width="${strokeWidth}"/>`;
    }

    // Draw finger positions and note names
    // CSV data is ordered from Low E (6th) to High E (1st) string, displayed left to right
    const fingerPositions = chord.fingerPositions;
    const openStringNotes = ['E', 'A', 'D', 'G', 'B', 'E']; // Standard tuning notes
    let noteIndex = 0; // Index for NOTE_NAMES array (only counts non-x positions)

    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
        const position = fingerPositions[stringIndex];
        const x = fretboardX + (stringIndex * stringSpacing);

        // Determine what note to display below the string
        let noteToDisplay = '';
        if (position === 'x') {
            // Muted string - no note displayed
            noteToDisplay = '';
        } else if (position === '0') {
            // Open string - use standard tuning note
            noteToDisplay = openStringNotes[stringIndex];
        } else {
            // Fingered position - use note from NOTE_NAMES
            noteToDisplay = chord.noteNames[noteIndex];
        }

        // Draw finger position markers
        if (position === 'x') {
            // Muted string - draw X above fretboard
            const y = fretboardY - 20 * scale;
            diagramSVG += `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial" font-size="${24 * scale}" font-weight="bold">X</text>`;
        } else if (position === '0') {
            // Open string - draw open circle above fretboard
            const y = fretboardY - 20 * scale;
            diagramSVG += `<circle cx="${x}" cy="${y - 8 * scale}" r="${10 * scale}" fill="none" stroke="black" stroke-width="3"/>`;
        } else {
            // Fingered position - draw filled circle on fret
            const fretNumber = parseInt(position);
            if (fretNumber >= 1 && fretNumber <= 4) {
                const y = fretboardY + ((fretNumber - 0.5) * fretSpacing);
                diagramSVG += `<circle cx="${x}" cy="${y}" r="${14 * scale}" fill="black"/>`;
                diagramSVG += `<text x="${x}" y="${y + 6 * scale}" text-anchor="middle" font-family="Arial" font-size="${16 * scale}" fill="white" font-weight="bold">${position}</text>`;
            }
        }

        // Display note name below the string (if not muted)
        if (noteToDisplay) {
            const noteY = fretboardY + fretboardHeight + 30 * scale;
            diagramSVG += `<text x="${x}" y="${noteY}" text-anchor="middle" font-family="Arial" font-size="${14 * scale}" font-weight="bold">${noteToDisplay}</text>`;
        }

        // Increment noteIndex only for non-x positions
        if (position !== 'x') {
            noteIndex++;
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

    // String note names are now displayed below each string in the chord diagram
    // Note: fretboard dimensions must match those in generateChordDiagram
    const fretboardWidth = width * 0.5;
    const fretboardHeight = height * 0.5;
    const fretboardX = (width - fretboardWidth) / 2;
    const fretboardY = height * 0.25;

    // Note names are now displayed below each string in the chord diagram

    // Click instruction
    labelsSVG += `<text x="${width / 2}" y="${height * 0.95}" text-anchor="middle" font-family="Arial" font-size="${14 * scale}" fill="#666">Click anywhere to load another chord</text>`;

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
    console.log('Parsed fields:', parsed);
    console.assert(parsed.length === 5, 'CSV parsing should return 5 fields');
    console.assert(parsed[0] === 'A#', 'First field should be A#');
    console.assert(parsed[2] === '"1;3;5"', 'Third field should preserve quotes');
    console.log('CSV parsing test passed');

    // Test Chord creation
    const testChord = new Chord('C', 'maj', '1;3;5', 'x,3,2,0,1,0', 'C,E,G,C,E');
    console.assert(testChord.displayName === 'Cmaj', 'Display name should be Cmaj');
    console.assert(testChord.fingerPositions.length === 6, 'Should have 6 finger positions');
    console.assert(testChord.isValid(), 'Test chord should be valid');

    // Test base fret calculation
    console.log('Testing base fret calculation...');

    // Test case 1: D;9b5;"1;3;b5;b7;9";1,2,1,3,4,1;Ab,D,F#,C,E,Ab (expected: 4)
    const testChord1 = new Chord('D', '9b5', '1;3;b5;b7;9', '1,2,1,3,4,1', 'Ab,D,F#,C,E,Ab');
    const baseFret1 = calculateBaseFret(testChord1);
    console.log(`Test 1 - Expected: 4, Got: ${baseFret1}`);
    console.assert(baseFret1 === 4, `Base fret should be 4, got ${baseFret1}`);

    // Test case 2: Bb;7;"1;3;5;b7";1,3,1,2,4,1;Bb,F,Ab,D,Ab,Bb (expected: 6)
    const testChord2 = new Chord('Bb', '7', '1;3;5;b7', '1,3,1,2,4,1', 'Bb,F,Ab,D,Ab,Bb');
    const baseFret2 = calculateBaseFret(testChord2);
    console.log(`Test 2 - Expected: 6, Got: ${baseFret2}`);
    console.assert(baseFret2 === 6, `Base fret should be 6, got ${baseFret2}`);

    // Test case 3: Bb;7;"1;3;5;b7";x,x,1,3,2,4;Bb,F,Ab,D (expected: 8)
    const testChord3 = new Chord('Bb', '7', '1;3;5;b7', 'x,x,1,3,2,4', 'Bb,F,Ab,D');
    const baseFret3 = calculateBaseFret(testChord3);
    console.log(`Test 3 - Expected: 8, Got: ${baseFret3}`);
    console.assert(baseFret3 === 8, `Base fret should be 8, got ${baseFret3}`);

    // Test random selection with empty dataset (only if dataset is loaded)
    if (chordDataset.length > 0) {
        const originalDataset = chordDataset;
        chordDataset = [];
        console.assert(selectRandomChord() === null, 'Should return null for empty dataset');
        chordDataset = originalDataset;
        console.log('Empty dataset test passed');
    } else {
        console.log('Skipping empty dataset test - dataset not loaded yet');
    }

    console.log('Unit tests completed');
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Run embedded tests
    runTests();

    // Initialize the main application
    initializeApp();
}); 