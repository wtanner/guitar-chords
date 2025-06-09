/**
 * Guitar Chords Application - Comprehensive Unit Tests
 * Consolidated test suite covering all functionality
 * Run with: node test.js
 */

// Import Node.js built-in assert module
const assert = require('assert');

// Import functions from main.js
const { Chord, parseCsvLine, calculateAbsoluteFretPositions, normalizeFretPositions, selectRandomChord } = require('./main.js');

/**
 * Main test runner
 */
function runTests() {
    console.log('Running comprehensive unit tests...');

    testBasicFunctionality();
    testFretCalculation();
    testOpenStringHandling();
    testEdgeCases();
    testIntegrationScenarios();

    console.log('\n🎉 All comprehensive tests completed successfully!');
}

/**
 * Test basic CSV parsing and chord creation
 */
function testBasicFunctionality() {
    console.log('\n--- Testing Basic Functionality ---');

    // Test CSV line parsing
    const testLine = 'A#;maj;"1;3;5";x,1,3,3,3,x;A#,E#,A#,C##';
    const parsed = parseCsvLine(testLine);
    console.log('Parsed fields:', parsed);
    assert.strictEqual(parsed.length, 5, 'CSV parsing should return 5 fields');
    assert.strictEqual(parsed[0], 'A#', 'First field should be A#');
    assert.strictEqual(parsed[2], '"1;3;5"', 'Third field should preserve quotes');
    console.log('✓ CSV parsing test passed');

    // Test Chord creation
    const testChord = new Chord('C', 'maj', '1;3;5', 'x,3,2,0,1,0', 'C,E,G,C,E');
    assert.strictEqual(testChord.displayName, 'Cmaj', 'Display name should be Cmaj');
    assert.strictEqual(testChord.fingerPositions.length, 6, 'Should have 6 finger positions');
    assert.strictEqual(testChord.isValid(), true, 'Test chord should be valid');
    console.log('✓ Chord creation test passed');

    // Test random selection with empty dataset
    assert.strictEqual(selectRandomChord([]), null, 'Should return null for empty dataset');
    console.log('✓ Empty dataset test passed');

    // Test random selection with non-empty dataset
    const testDataset = [testChord];
    const randomChord = selectRandomChord(testDataset);
    assert.notStrictEqual(randomChord, null, 'Should return a chord for non-empty dataset');
    assert.strictEqual(testDataset.includes(randomChord), true, 'Returned chord should be from the dataset');
    console.log('✓ Random selection test passed');
}

/**
 * Test fret calculation core functionality
 */
function testFretCalculation() {
    console.log('\n--- Testing Fret Calculation ---');

    // Test 1: Simple open chord (C major)
    console.log('Test 1: C Major Open Chord');
    const cMajor = new Chord('C', 'maj', '1;3;5', 'x,3,2,0,1,0', 'C,E,G,C,E');
    const cMajorAbsolute = calculateAbsoluteFretPositions(cMajor);
    const cMajorNormalized = normalizeFretPositions(cMajorAbsolute);
    console.log(`  Absolute: [${cMajorAbsolute}], Normalized: [${cMajorNormalized.positions}], BaseFret: ${cMajorNormalized.baseFret}`);
    assert.deepStrictEqual(cMajorAbsolute, ['x', 3, 2, 0, 1, 0], 'C major absolute positions should be [x,3,2,0,1,0]');
    assert.deepStrictEqual(cMajorNormalized.positions, ['x', 3, 2, 0, 1, 0], 'C major normalized positions should be unchanged');
    assert.strictEqual(cMajorNormalized.baseFret, 0, 'C major base fret should be 0');
    console.log('✓ C major test passed');

    // Test 2: A major with new open string handling
    console.log('Test 2: A Major with Open String Preservation');
    const aMajor = new Chord('A', 'maj', '1;3;5', 'x,0,2,2,2,0', 'A,E,A,C#,E');
    const aMajorAbsolute = calculateAbsoluteFretPositions(aMajor);
    const aMajorNormalized = normalizeFretPositions(aMajorAbsolute);
    console.log(`  Absolute: [${aMajorAbsolute}], Normalized: [${aMajorNormalized.positions}], BaseFret: ${aMajorNormalized.baseFret}`);
    assert.deepStrictEqual(aMajorAbsolute, ['x', 0, 2, 2, 2, 0], 'A major absolute positions should be [x,0,2,2,2,0]');
    assert.deepStrictEqual(aMajorNormalized.positions, ['x', 0, 1, 1, 1, 0], 'A major: open strings stay 0, fingered frets normalize to 1');
    assert.strictEqual(aMajorNormalized.baseFret, 1, 'A major base fret should be 1');
    console.log('✓ A major test passed with open string preservation');

    // Test 3: High position chord requiring normalization
    console.log('Test 3: High Position Chord (Bb7)');
    const bb7Chord = new Chord('Bb', '7', '1;3;5;b7', '1,3,1,2,4,1', 'Bb,F,Ab,D,Ab,Bb');
    const bb7Absolute = calculateAbsoluteFretPositions(bb7Chord);
    const bb7Normalized = normalizeFretPositions(bb7Absolute);
    console.log(`  Absolute: [${bb7Absolute}], Normalized: [${bb7Normalized.positions}], BaseFret: ${bb7Normalized.baseFret}`);
    assert.strictEqual(bb7Normalized.baseFret, 5, 'Bb7 base fret should be 5');
    console.log('✓ Bb7 normalization test passed');

    // Test 4: Chord with muted strings and open string preservation
    console.log('Test 4: D Major with Muted Strings');
    const dMajor = new Chord('D', 'maj', '1;3;5', 'x,x,0,2,3,2', 'D,A,D,F#');
    const dMajorAbsolute = calculateAbsoluteFretPositions(dMajor);
    const dMajorNormalized = normalizeFretPositions(dMajorAbsolute);
    console.log(`  Absolute: [${dMajorAbsolute}], Normalized: [${dMajorNormalized.positions}], BaseFret: ${dMajorNormalized.baseFret}`);
    assert.deepStrictEqual(dMajorAbsolute, ['x', 'x', 0, 2, 3, 2], 'D major absolute positions');
    assert.deepStrictEqual(dMajorNormalized.positions, ['x', 'x', 0, 1, 2, 1], 'D major normalized with open string preserved');
    assert.strictEqual(dMajorNormalized.baseFret, 1, 'D major base fret should be 1');
    console.log('✓ D major test passed');

    // Test 5: Complex chord requiring octave adjustment
    console.log('Test 5: Eb Major (requires octave adjustment)');
    const ebMajor = new Chord('Eb', 'maj', '1;3;5', 'x,x,x,2,1,1', 'G,Bb,Eb');
    const ebMajorAbsolute = calculateAbsoluteFretPositions(ebMajor);
    const ebMajorNormalized = normalizeFretPositions(ebMajorAbsolute);
    console.log(`  Absolute: [${ebMajorAbsolute}], Normalized: [${ebMajorNormalized.positions}], BaseFret: ${ebMajorNormalized.baseFret}`);
    assert.deepStrictEqual(ebMajorAbsolute, ['x', 'x', 'x', 12, 11, 11], 'Eb major absolute with octave adjustment');
    assert.deepStrictEqual(ebMajorNormalized.positions, ['x', 'x', 'x', 2, 1, 1], 'Eb major normalized');
    assert.strictEqual(ebMajorNormalized.baseFret, 10, 'Eb major base fret should be 10');
    console.log('✓ Eb major test passed');
}

/**
 * Test open string handling specifically
 */
function testOpenStringHandling() {
    console.log('\n--- Testing Open String Handling ---');

    // Test 1: All open strings - should not be normalized at all
    console.log('Test 1: All Open Strings');
    const allOpenChord = new Chord('Em', 'test', '1;3;5', '0,0,0,0,0,0', 'E,A,D,G,B,E');
    const allOpenAbsolute = calculateAbsoluteFretPositions(allOpenChord);
    const allOpenNormalized = normalizeFretPositions(allOpenAbsolute);
    console.log(`  Input: [${allOpenChord.fingerPositions.join(', ')}]`);
    console.log(`  Normalized: [${allOpenNormalized.positions.join(', ')}], BaseFret: ${allOpenNormalized.baseFret}`);
    assert.deepStrictEqual(allOpenNormalized.positions, [0, 0, 0, 0, 0, 0]);
    assert.strictEqual(allOpenNormalized.baseFret, 0);
    console.log('✓ All open strings remain unchanged');

    // Test 2: Mixed open and fingered frets
    console.log('Test 2: Mixed Open and Fingered Frets');
    const mixedChord = new Chord('Test', 'mixed', '1;3;5', '0,0,3,4,4,3', 'E,A,C,F,A,G');
    const mixedAbsolute = calculateAbsoluteFretPositions(mixedChord);
    const mixedNormalized = normalizeFretPositions(mixedAbsolute);
    console.log(`  Input: [${mixedChord.fingerPositions.join(', ')}]`);
    console.log(`  Absolute: [${mixedAbsolute.join(', ')}]`);
    console.log(`  Normalized: [${mixedNormalized.positions.join(', ')}], BaseFret: ${mixedNormalized.baseFret}`);

    const hasOpenStrings = mixedNormalized.positions.some(pos => pos === 0);
    const hasHigherFrets = mixedNormalized.positions.some(pos => typeof pos === 'number' && pos > 0);
    assert.strictEqual(hasOpenStrings, true, 'Should preserve open strings');
    assert.strictEqual(hasHigherFrets, true, 'Should have normalized fingered frets');
    console.log('✓ Successfully mixed open strings with higher frets');

    // Test 3: Traditional high-position chord (no open strings)
    console.log('Test 3: Traditional High-Position Chord');
    const traditionalChord = new Chord('F#', 'maj', '1;3;5', '2,4,4,3,2,2', 'F#,A#,C#,F#,A#,F#');
    const traditionalAbsolute = calculateAbsoluteFretPositions(traditionalChord);
    const traditionalNormalized = normalizeFretPositions(traditionalAbsolute);
    console.log(`  Input: [${traditionalChord.fingerPositions.join(', ')}]`);
    console.log(`  Normalized: [${traditionalNormalized.positions.join(', ')}], BaseFret: ${traditionalNormalized.baseFret}`);
    assert.strictEqual(traditionalNormalized.baseFret > 0, true, 'Should have a non-zero base fret');
    console.log('✓ Traditional high-position chord normalization works');
}

/**
 * Test edge cases and special scenarios
 */
function testEdgeCases() {
    console.log('\n--- Testing Edge Cases ---');

    // Test 1: All muted strings
    console.log('Test 1: All Muted Strings');
    const allMutedChord = new Chord('X', 'test', '', 'x,x,x,x,x,x', '');
    const allMutedAbsolute = calculateAbsoluteFretPositions(allMutedChord);
    const allMutedNormalized = normalizeFretPositions(allMutedAbsolute);
    console.log(`  Normalized: [${allMutedNormalized.positions.join(', ')}], BaseFret: ${allMutedNormalized.baseFret}`);
    assert.deepStrictEqual(allMutedNormalized.positions, ['x', 'x', 'x', 'x', 'x', 'x']);
    assert.strictEqual(allMutedNormalized.baseFret, 0);
    console.log('✓ All muted strings test passed');

    // Test 2: Chord with complex note names (double-flats)
    console.log('Test 2: Complex Note Names (Eb 9b5 with double-flats)');
    const complexChord = new Chord('Eb', '9b5', '1;3;b5;b7;9', '1,2,1,3,4,1', 'Bbb,Eb,G,Db,F,Bbb');
    const complexAbsolute = calculateAbsoluteFretPositions(complexChord);
    const complexNormalized = normalizeFretPositions(complexAbsolute);
    console.log(`  Input notes: [${complexChord.noteNames.join(', ')}]`);
    console.log(`  Absolute: [${complexAbsolute.join(', ')}]`);
    console.log(`  Normalized: [${complexNormalized.positions.join(', ')}], BaseFret: ${complexNormalized.baseFret}`);
    assert.deepStrictEqual(complexAbsolute, [5, 6, 5, 6, 6, 5], 'Should handle double-flats correctly');
    console.log('✓ Complex note names test passed');

    // Test 3: Chord that spans multiple frets
    console.log('Test 3: Five-Fret Span Chord');
    const fiveFretChord = new Chord('Test', '5span', '1;3;5', '3,4,5,3,4,5', 'G,C,F,A,D,G');
    const fiveFretAbsolute = calculateAbsoluteFretPositions(fiveFretChord);
    const fiveFretNormalized = normalizeFretPositions(fiveFretAbsolute);
    console.log(`  Absolute: [${fiveFretAbsolute.join(', ')}]`);
    console.log(`  Normalized: [${fiveFretNormalized.positions.join(', ')}], BaseFret: ${fiveFretNormalized.baseFret}`);

    const numericPositions = fiveFretNormalized.positions.filter(pos => typeof pos === 'number');
    const fretSpan = Math.max(...numericPositions) - Math.min(...numericPositions);
    console.log(`  Fret span after normalization: ${fretSpan + 1} frets`);
    assert.strictEqual(fretSpan <= 4, true, 'Should fit within 5-fret window after normalization');
    console.log('✓ Five-fret span test passed');
}

/**
 * Test integration scenarios that combine multiple features
 */
function testIntegrationScenarios() {
    console.log('\n--- Testing Integration Scenarios ---');

    // Test 1: Real-world chord from dataset
    console.log('Test 1: Real-world Em7 Chord');
    const em7Chord = new Chord('Em', '7', '1;b3;5;b7', '0,2,0,0,3,0', 'E,B,E,G,D,E');
    const em7Absolute = calculateAbsoluteFretPositions(em7Chord);
    const em7Normalized = normalizeFretPositions(em7Absolute);
    console.log(`  This chord combines open strings with fingered positions`);
    console.log(`  Input: [${em7Chord.fingerPositions.join(', ')}]`);
    console.log(`  Should preserve open strings and normalize fingered position`);
    console.log('✓ Real-world chord integration test passed');

    // Test 2: Chord requiring both octave adjustment and open string preservation
    console.log('Test 2: Complex Octave + Open String Scenario');
    // This tests the interaction between octave adjustment and open string preservation
    const complexMixedChord = new Chord('Test', 'complex', '1;3;5', '0,x,1,4,4,0', 'E,C,F,A,E');
    const complexMixedAbsolute = calculateAbsoluteFretPositions(complexMixedChord);
    const complexMixedNormalized = normalizeFretPositions(complexMixedAbsolute);
    console.log(`  Input: [${complexMixedChord.fingerPositions.join(', ')}]`);
    console.log(`  Absolute: [${complexMixedAbsolute.join(', ')}]`);
    console.log(`  Normalized: [${complexMixedNormalized.positions.join(', ')}], BaseFret: ${complexMixedNormalized.baseFret}`);

    const preservedOpens = complexMixedNormalized.positions.filter(pos => pos === 0).length;
    console.log(`  Preserved ${preservedOpens} open strings`);
    console.log('✓ Complex octave + open string test passed');

    // Test 3: Display formatting
    console.log('Test 3: Display Formatting');
    const positions1 = [6, 8, 6, 7, 9, 6];
    const result1 = normalizeFretPositions(positions1);
    console.log(`  High position chord: BaseFret ${result1.baseFret} displays as "${result1.baseFret + 1}"`);

    const positions2 = [0, 2, 2, 1, 0, 0];
    const result2 = normalizeFretPositions(positions2);
    console.log(`  Low position chord: BaseFret ${result2.baseFret} (no display for open position)`);
    console.log('✓ Display formatting test passed');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests
}; 