# Random Guitar Chords

## Overview

A self-contained, statically-served web application for guitar chord learning and experimentation. The application displays randomly selected guitar chords with visual diagrams, finger positions, and musical notation to help users discover and learn new chord structures.


## Functional Requirements

### F1: Single Chord Display
- **Requirement**: Display one chord at a time with comprehensive information
- **Components**:
  - Chord name (e.g., "C Major", "Am7", "F#dim")
  - Guitar chord diagram showing fret positions with accurate base fret calculation
  - Finger placement indicators (1-4 for fingers, x for muted, 0 for open)
  - Base fret indicator for higher position chords

### F2: Random Chord Loading
- **Requirement**: Load a randomly selected chord when the page is accessed
- **Behavior**: Each page load/refresh presents a different chord from the dataset
- **Data Source**: UC Irvine Guitar Chords Finger Positions dataset

### F3: SVG-Only Display
- **Requirement**: All visual elements rendered as a single, dynamically generated SVG
- **Generation**: SVG created client-side via JavaScript on page load
- **Content**: Contains chord diagram, musical notation, and text labels

## Non-Functional Requirements

### NF1: Visual Design
- **Color Scheme**: Monochrome (black and white only)
- **Style**: Clean, minimalist design focused on clarity
- **Constraints**: No colors, gradients, or visual effects

### NF2: Responsive Layout
- **Requirement**: SVG geometry adapts to available window dimensions
- **Constraint**: Aspect ratios must always be preserved
- **Behavior**: Application scales appropriately across different screen sizes

### NF3: Static Hosting
- **Platform**: GitHub Pages
- **Architecture**: Static website without build processes or generators
- **Goal**: Maximum simplicity in deployment and maintenance

### NF4: Self-Contained Implementation
- **JavaScript**: No external libraries or frameworks
- **Dependencies**: All code contained within the repository
- **Data**: Guitar chord dataset included locally

## Technical Implementation

### Architecture

```
├── index.html          # Main application page
├── main.js            # Single JavaScript file containing all functionality
├── chord-fingers.csv   # UC Irvine dataset (2,633 chords)
├── test.js            # Comprehensive test suite
└── README.md          # This design document
```

### Data Structure

#### Chord Data Format (from UC Irvine dataset)
**File Format**: CSV with semicolon (`;`) delimiters, 5 columns per row

- **CHORD_ROOT**: Chord root note (e.g., "A#", "C", "F#")
- **CHORD_TYPE**: Chord quality/type (e.g., "13", "m7", "maj7", "dim")
- **CHORD_STRUCTURE**: Musical intervals that compose the chord (semicolon-separated, quoted string e.g., "1;3;5;b7;9;11;13")
- **FINGER_POSITIONS**: String positions, comma-separated (Low E, A, D, G, B, High E)
  - `x`: String muted
  - `0`: Open string
  - `1-4`: Finger numbers (index, middle, ring, pinkie)
- **NOTE_NAMES**: Actual note names for each string, comma-separated (e.g., "A#,C##,G#,B#,F##")

### Core Functions (within single `main.js`)

#### 1. Chord Loading Functions
- `parseChordData()`: Parse CSV dataset into JavaScript objects
- `selectRandomChord()`: Implement random chord selection algorithm
- `loadChordDataset()`: Initialize dataset on page load

#### 2. SVG Generation Functions
- `calculateDimensions()`: Calculate responsive dimensions based on viewport
- `generateChordDiagram()`: Generate chord diagram with fretboard representation
- `renderFingerPositions()`: Render finger position indicators
- `createChordLabels()`: Create text labels for chord names

#### 3. Musical Notation Functions
- `generateTrebleClef()`: Generate treble clef staff notation
- `convertIntervalsToNotes()`: Convert chord intervals to note positions
- `renderQuarterNotes()`: Render quarter notes for chord tones

#### 4. Application Coordination
- `initializeApp()`: Main initialization function
- `generateSVG()`: Coordinate all SVG generation
- `insertSVGIntoDOM()`: Handle SVG insertion into page

#### 5. Fret Position Calculator

**Core Algorithm**: The application includes sophisticated fret position calculation with two main functions:

- `calculateAbsoluteFretPositions()`: Computes actual fret positions from chord data, handling enharmonic equivalents (Db = C#) and applying octave adjustment when computed positions are too low relative to other strings
- `normalizeFretPositions()`: Optimizes chord diagrams for 5-fret display while preserving open strings, calculating base fret indicators for higher positions

**Key Features**: Handles complex note names, maintains open string integrity during normalization, and accommodates chords spanning up to 5 frets with intelligent positioning algorithms.

### Responsive Design Strategy

#### Viewport Adaptation
- Detect available window dimensions
- Calculate optimal SVG canvas size
- Scale all elements proportionally
- Maintain aspect ratios for chord diagrams and musical notation

#### Layout Composition
```
┌─────────────────────────────────┐
│           Chord Name            │
├─────────────────────────────────┤
│                                 │
│        Chord Diagram            │
│      (Fretboard + Fingers)      │
│                                 │
├─────────────────────────────────┤
│                                 │
│      Musical Notation           │
│      (Treble Clef Staff)        │
│                                 │
└─────────────────────────────────┘
```

## Data Integration

### [UC Irvine Dataset](https://archive.ics.uci.edu/dataset/575/guitar+chords+finger+positions) Integration
- **Source**: Guitar Chords finger positions dataset (2,633 chords) [1]
- **Format**: CSV with 5 features per chord
- **Processing**: Client-side parsing without external CSV libraries
- **Storage**: Static file included in repository

**Reference**: [1] "Guitar Chords finger positions," UCI Machine Learning Repository, 2020. [Online]. Available: https://doi.org/10.24432/C5RG8K.

### Chord Selection Algorithm
- Load dataset into memory on page initialization
- Generate random index within dataset bounds
- Retrieve corresponding chord data
- Pass to rendering pipeline

## Development Phases

### Phase 1: Core Infrastructure ✅
1. Set up basic HTML structure
2. Implement CSV parsing functionality in `main.js`
3. Create random chord selection logic

### Phase 2: Chord Diagram ✅
1. Implement chord diagram rendering

### Phase 3: Musical Notation
1. Add treble clef rendering functions
2. Implement note positioning algorithms
3. Integrate chord tone display

### Phase 4: Integration & Testing
1. Connect all functions within single file
2. Add embedded unit tests alongside functions
3. Optimize responsive behavior

## Technical Constraints

### Browser Compatibility
- Modern browsers supporting ES6+ JavaScript
- SVG rendering capabilities
- Basic HTML5 support

### Performance Considerations
- Client-side dataset loading and parsing
- Efficient SVG generation algorithms
- Minimal DOM manipulations

### Deployment Requirements
- GitHub Pages compatible structure
- No build process dependencies
- Static file serving only

## Quality Assurance

### Testing Strategy
- **Comprehensive test suite** in `test.js` covering:
  - CSV parsing and chord creation
  - Fret calculation algorithms (absolute positions, normalization)
  - Open string preservation behavior
  - Edge cases (all muted, complex note names, 5-fret spans)
  - Integration scenarios combining multiple features
- **Run tests**: `node test.js`
- Basic cross-browser compatibility verification
- Responsive design validation across devices
- Dataset integrity verification

### Code Quality
- Vanilla JavaScript best practices
- Clear function organization within single file
- Comprehensive inline documentation
- Embedded unit tests for key functions

---

*This design document will be maintained to reflect any changes to requirements or implementation details throughout the development process.* 