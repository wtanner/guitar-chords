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
 * @param {Chord[]} [dataset] - Optional dataset to use instead of global chordDataset
 * @returns {Chord|null} Random chord or null if dataset is empty
 */
function selectRandomChord(dataset = null) {
    const datasetToUse = dataset || chordDataset;

    if (datasetToUse.length === 0) {
        console.error('No chords available in dataset');
        return null;
    }

    const randomIndex = Math.floor(Math.random() * datasetToUse.length);
    const selectedChord = datasetToUse[randomIndex];

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

    // Calculate optimal SVG dimensions with more compact layout
    const aspectRatio = 3 / 3.5; // Slightly more compact width to height ratio  
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
 * Calculate the absolute fret position for each string of a guitar chord
 * @param {Chord} chord - Chord object as defined in main.js
 * @returns {Array} Array of fret positions for strings 6-1, where 'x' means muted, numbers are fret positions
 */
function calculateAbsoluteFretPositions(chord) {
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
            // Single flats
            'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
            // Single sharps that wrap around
            'C##': 'D', 'D##': 'E', 'E#': 'F', 'F##': 'G', 'G##': 'A', 'A##': 'B', 'B#': 'C',
            // Single flats that wrap around
            'Fb': 'E', 'Cb': 'B',
            // Double flats
            'Cbb': 'A#', 'Dbb': 'C', 'Ebb': 'D', 'Fbb': 'D#', 'Gbb': 'F', 'Abb': 'G', 'Bbb': 'A'
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

    // Initialize result array for 6 strings
    const fretPositions = new Array(6);
    let noteIndex = 0; // Index for NOTE_NAMES array (only counts non-x positions)

    // Step 1: Calculate initial fret positions for each string
    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
        const fingerPosition = chord.fingerPositions[stringIndex];
        const stringNumber = 6 - stringIndex; // Convert index to string number (6, 5, 4, 3, 2, 1)

        if (fingerPosition === 'x') {
            // Muted string
            fretPositions[stringIndex] = 'x';
        } else if (fingerPosition === '0') {
            // Open string
            fretPositions[stringIndex] = 0;
            noteIndex++; // Increment for non-muted strings
        } else {
            // Fingered position (1-4)
            const targetNote = chord.noteNames[noteIndex];
            const openNote = openStringNotes[stringNumber];

            // Calculate what fret this note would be on this string
            const fretDistance = getFretDistance(openNote, targetNote);
            fretPositions[stringIndex] = fretDistance;

            noteIndex++; // Increment for non-muted strings
        }
    }

    // Step 2: Find the maximum fret number across all strings (ignoring 'x')
    const numericFrets = fretPositions.filter(fret => fret !== 'x');
    const maxFret = Math.max(...numericFrets);

    // Step 3: Apply the octave adjustment rule
    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
        const fingerPosition = chord.fingerPositions[stringIndex];

        // Only apply rule to fingered positions (1-4)
        if (fingerPosition !== 'x' && fingerPosition !== '0' && parseInt(fingerPosition) >= 1 && parseInt(fingerPosition) <= 4) {
            const currentFret = fretPositions[stringIndex];

            // If computed fret < (max - 6), add 12
            if (currentFret < (maxFret - 6)) {
                fretPositions[stringIndex] = currentFret + 12;
            }
        }
    }

    return fretPositions;
}

/**
 * Normalize fret positions for chord diagrams, allowing open strings to remain open
 * while calculating base fret from fingered positions only
 * @param {Array} fretPositions - Array of fret positions (from calculateAbsoluteFretPositions)
 * @returns {Object} Object with normalized positions and base fret offset
 */
function normalizeFretPositions(fretPositions) {
    // Find all numeric frets (ignoring 'x' for muted strings)
    const numericFrets = fretPositions.filter(fret => fret !== 'x' && typeof fret === 'number');

    // If no numeric frets, return original array with offset 0
    if (numericFrets.length === 0) {
        return {
            positions: [...fretPositions],
            baseFret: 0
        };
    }

    // Find fingered frets (excluding open strings - fret 0)
    const fingeredFrets = numericFrets.filter(fret => fret > 0);

    // If no fingered frets (all open strings), no normalization needed
    if (fingeredFrets.length === 0) {
        return {
            positions: [...fretPositions],
            baseFret: 0
        };
    }

    const minFingeredFret = Math.min(...fingeredFrets);
    const maxFingeredFret = Math.max(...fingeredFrets);
    const fingeredSpan = maxFingeredFret - minFingeredFret;

    // Calculate base fret and normalization amount
    let subtractAmount = 0;
    let baseFret = 0;

    if (minFingeredFret >= 2) {
        // For chords where the lowest fingered fret is 2 or higher, 
        // normalize to start at fret 1
        subtractAmount = minFingeredFret - 1;
        baseFret = subtractAmount;
    } else if (fingeredSpan > 5) {
        // For chords with fingered span > 5 frets, we may need to shift
        // to fit within the 5-fret display window
        subtractAmount = Math.max(0, minFingeredFret - 1);
        baseFret = subtractAmount;
    }

    // Apply normalization: subtract from fingered frets only, leave open strings (0) unchanged
    const normalizedPositions = fretPositions.map(fret => {
        if (fret === 'x') {
            return 'x';  // Muted strings stay muted
        } else if (fret === 0) {
            return 0;    // Open strings stay open
        } else {
            return fret - subtractAmount;  // Subtract from fingered positions only
        }
    });

    // Verify the result fits in a 5-fret window (check fingered frets only)
    const normalizedFingered = normalizedPositions.filter(fret => typeof fret === 'number' && fret > 0);
    if (normalizedFingered.length > 0) {
        const normalizedMax = Math.max(...normalizedFingered);
        if (normalizedMax > 5) {
            console.warn(`Chord extends beyond 5-fret display: max fingered fret ${normalizedMax}`);
        }
    }

    return {
        positions: normalizedPositions,
        baseFret: baseFret
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
    // Make fretboard with square individual boxes
    const maxSize = Math.min(width * 0.5, height * 0.4);
    // To make square boxes, we need stringSpacing = fretSpacing
    // Since we have 5 string spaces and 5 fret spaces, both use same size
    const boxSize = maxSize / 5; // Use 5 as reference
    const fretboardWidth = boxSize * 5;   // 5 string spaces
    const fretboardHeight = boxSize * 5;  // 5 fret spaces
    const fretboardX = (width - fretboardWidth) / 2;
    const fretboardY = height * 0.2;      // Move up more to reduce bottom space

    const stringSpacing = boxSize; // Each box is square
    const fretSpacing = boxSize;   // Each box is square

    // Calculate absolute fret positions and normalize them
    const absolutePositions = calculateAbsoluteFretPositions(chord);
    const { positions: normalizedPositions, baseFret } = normalizeFretPositions(absolutePositions);

    let diagramSVG = '';

    // Display base fret number to the left of the fretboard
    if (baseFret > 0) {
        diagramSVG += `<text x="${fretboardX - 30 * scale}" y="${fretboardY + fretSpacing / 2}" text-anchor="middle" font-family="Arial" font-size="${20 * scale}" font-weight="bold">${baseFret + 1}</text>`;
    }

    // Draw fretboard outline
    diagramSVG += `<rect x="${fretboardX}" y="${fretboardY}" width="${fretboardWidth}" height="${fretboardHeight}" fill="none" stroke="black" stroke-width="3"/>`;

    // Draw strings (vertical lines)
    for (let i = 0; i <= 5; i++) {
        const x = fretboardX + (i * stringSpacing);
        diagramSVG += `<line x1="${x}" y1="${fretboardY}" x2="${x}" y2="${fretboardY + fretboardHeight}" stroke="black" stroke-width="2"/>`;
    }

    // Draw frets (horizontal lines)
    for (let i = 0; i <= 5; i++) {
        const y = fretboardY + (i * fretSpacing);
        // Make the top line (nut) thicker for open position chords, regular frets thicker than strings
        const strokeWidth = (i === 0 && baseFret === 0) ? "8" : "3";
        diagramSVG += `<line x1="${fretboardX}" y1="${y}" x2="${fretboardX + fretboardWidth}" y2="${y}" stroke="black" stroke-width="${strokeWidth}"/>`;
    }

    // Draw finger positions and note names
    // CSV data is ordered from Low E (6th) to High E (1st) string, displayed left to right
    const openStringNotes = ['E', 'A', 'D', 'G', 'B', 'E']; // Standard tuning notes
    let noteIndex = 0; // Index for NOTE_NAMES array (only counts non-x positions)

    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
        const originalPosition = chord.fingerPositions[stringIndex];
        const normalizedPosition = normalizedPositions[stringIndex];
        const x = fretboardX + (stringIndex * stringSpacing);

        // Determine what note to display below the string
        let noteToDisplay = '';
        if (originalPosition === 'x') {
            // Muted string - no note displayed
            noteToDisplay = '';
        } else if (originalPosition === '0') {
            // Open string - use standard tuning note
            noteToDisplay = openStringNotes[stringIndex];
        } else {
            // Fingered position - use note from NOTE_NAMES
            noteToDisplay = chord.noteNames[noteIndex];
        }

        // Draw finger position markers
        if (normalizedPosition === 'x') {
            // Muted string - draw X above fretboard
            const y = fretboardY - 20 * scale;
            diagramSVG += `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial" font-size="${24 * scale}" font-weight="bold">X</text>`;
        } else if (normalizedPosition === 0) {
            // Open string - draw open circle above fretboard
            const y = fretboardY - 20 * scale;
            diagramSVG += `<circle cx="${x}" cy="${y - 8 * scale}" r="${12 * scale}" fill="none" stroke="black" stroke-width="4"/>`;
        } else {
            // Fingered position - draw filled circle on fret
            const fretNumber = normalizedPosition;
            if (fretNumber >= 1 && fretNumber <= 5) {
                const y = fretboardY + ((fretNumber - 0.5) * fretSpacing);
                diagramSVG += `<circle cx="${x}" cy="${y}" r="${18 * scale}" fill="black"/>`;
                // Display the original finger number, not the normalized position
                diagramSVG += `<text x="${x}" y="${y + 7 * scale}" text-anchor="middle" font-family="Arial" font-size="${18 * scale}" fill="white" font-weight="bold">${originalPosition}</text>`;
            }
        }

        // Display note name below the string (if not muted)
        if (noteToDisplay) {
            const noteY = fretboardY + fretboardHeight + 30 * scale;
            diagramSVG += `<text x="${x}" y="${noteY}" text-anchor="middle" font-family="Arial" font-size="${14 * scale}" font-weight="bold">${noteToDisplay}</text>`;
        }

        // Increment noteIndex only for non-x positions
        if (originalPosition !== 'x') {
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
    const maxSize = Math.min(width * 0.5, height * 0.4);
    const boxSize = maxSize / 5;
    const fretboardWidth = boxSize * 5;
    const fretboardHeight = boxSize * 5;
    const fretboardX = (width - fretboardWidth) / 2;
    const fretboardY = height * 0.2;

    // Note names are now displayed below each string in the chord diagram

    // Click instruction removed - users can discover interaction on their own

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



// Initialize application when DOM is loaded (browser environment only)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        // Initialize the main application
        initializeApp();
    });
}

// Export functions for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Chord,
        parseCsvLine,
        calculateAbsoluteFretPositions,
        normalizeFretPositions,
        selectRandomChord
    };
} 