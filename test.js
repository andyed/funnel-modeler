// Run with: node --test test.js
// No dependencies — uses Node's built-in node:test runner.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    hydrateSteps,
    parseImportText,
    encodeStepsToHash,
    decodeStepsFromHash,
    applyWhatIf
} = require('./funnel-core.js');

// ---------- hydrateSteps ----------

test('hydrateSteps computes stepConversion from counts', () => {
    const out = hydrateSteps([['Top', 1000], ['Mid', 500], ['Bot', 100]]);
    assert.equal(out.length, 3);
    assert.equal(out[0].count, 1000);
    assert.equal(out[0].stepConversion, 100);   // top defaults to 100
    assert.equal(out[1].stepConversion, 50);    // 500/1000
    assert.equal(out[2].stepConversion, 20);    // 100/500
});

test('hydrateSteps computes survival rates against total', () => {
    const out = hydrateSteps([['A', 1000], ['B', 250], ['C', 50]]);
    assert.equal(out[0].survivalRate, 100);
    assert.equal(out[1].survivalRate, 25);
    assert.equal(out[2].survivalRate, 5);
});

test('hydrateSteps rejects malformed input', () => {
    assert.equal(hydrateSteps(null), null);
    assert.equal(hydrateSteps([]), null);
    assert.equal(hydrateSteps([['only one row', 10]]), null);
    assert.equal(hydrateSteps([['bad', 'not-a-number'], ['ok', 10]]), null);
    assert.equal(hydrateSteps([['neg', -5], ['ok', 10]]), null);
});

// ---------- hash encoding ----------

test('encodeStepsToHash / decodeStepsFromHash round-trip', () => {
    const data = [
        { name: 'Landing', count: 1000, stepConversion: 100, survivalRate: 100 },
        { name: 'Signup', count: 420, stepConversion: 42, survivalRate: 42 },
        { name: 'Purchase', count: 85, stepConversion: 20.24, survivalRate: 8.5 }
    ];
    assert.deepEqual(decodeStepsFromHash(encodeStepsToHash(data)), data);
});

test('encodeStepsToHash handles unicode step names', () => {
    const data = [
        { name: 'Início', count: 1000, stepConversion: 100, survivalRate: 100 },
        { name: 'Próximo →', count: 500, stepConversion: 50, survivalRate: 50 }
    ];
    assert.deepEqual(decodeStepsFromHash(encodeStepsToHash(data)), data);
});

test('decodeStepsFromHash returns null on garbage', () => {
    assert.equal(decodeStepsFromHash('not-valid-base64!!'), null);
    assert.equal(decodeStepsFromHash(''), null);
});

// ---------- CSV/TSV import ----------

test('parseImportText accepts comma-separated rows', () => {
    const out = parseImportText('Landing, 1000\nSignup, 420\nPurchase, 85');
    assert.equal(out.length, 3);
    assert.equal(out[0].name, 'Landing');
    assert.equal(out[2].count, 85);
});

test('parseImportText accepts tab-separated rows', () => {
    const out = parseImportText('Landing\t1000\nSignup\t420\nPurchase\t85');
    assert.equal(out.length, 3);
    assert.equal(out[1].count, 420);
});

test('parseImportText skips header row automatically', () => {
    const out = parseImportText('Step, Users\nLanding, 1000\nSignup, 420');
    assert.equal(out.length, 2);
    assert.equal(out[0].name, 'Landing');
});

test('parseImportText returns null on insufficient data', () => {
    assert.equal(parseImportText(''), null);
    assert.equal(parseImportText('only, 100'), null);
    assert.equal(parseImportText('header, label\nbroken'), null);
});

// ---------- what-if cascade ----------

test('applyWhatIf lifts count at the improved step', () => {
    const baseline = hydrateSteps([['A', 1000], ['B', 500], ['C', 100]]);
    // improve B's rate (50%) by 20% → 60%
    const w = applyWhatIf(baseline, 1, 20);
    assert.equal(Math.round(w[1].stepConversion), 60);
    assert.equal(w[1].count, 600);
});

test('applyWhatIf preserves downstream rates and rescales counts', () => {
    const baseline = hydrateSteps([['A', 1000], ['B', 500], ['C', 100]]);
    // baseline: C's rate is 100/500 = 20%. After lifting B to 600, C should be 600*0.20 = 120.
    const w = applyWhatIf(baseline, 1, 20);
    assert.equal(w[2].count, 120);
    assert.equal(Math.round(w[2].stepConversion), 20);
});

test('applyWhatIf works on the final step (previously blocked by dropdown)', () => {
    const baseline = hydrateSteps([['A', 1000], ['B', 500], ['C', 100]]);
    // baseline C rate = 20%, improve by 50% → 30%, so C = 500 * 0.30 = 150
    const w = applyWhatIf(baseline, 2, 50);
    assert.equal(w[2].count, 150);
    assert.equal(Math.round(w[2].stepConversion), 30);
});

test('applyWhatIf caps the improved rate at 100%', () => {
    const baseline = hydrateSteps([['A', 1000], ['B', 900]]);
    // baseline B = 90%, improve by 50% → would be 135%, clamped to 100%
    const w = applyWhatIf(baseline, 1, 50);
    assert.equal(w[1].stepConversion, 100);
    assert.equal(w[1].count, 1000);
});

test('applyWhatIf does not mutate the baseline', () => {
    const baseline = hydrateSteps([['A', 1000], ['B', 500], ['C', 100]]);
    const snapshot = JSON.parse(JSON.stringify(baseline));
    applyWhatIf(baseline, 1, 20);
    assert.deepEqual(baseline, snapshot);
});

test('applyWhatIf recomputes survival rates from new counts', () => {
    const baseline = hydrateSteps([['A', 1000], ['B', 500], ['C', 100]]);
    const w = applyWhatIf(baseline, 1, 20);
    // total stays 1000; new survival should be [100, 60, 12]
    assert.equal(Math.round(w[0].survivalRate), 100);
    assert.equal(Math.round(w[1].survivalRate), 60);
    assert.equal(Math.round(w[2].survivalRate), 12);
});

test('applyWhatIf rejects out-of-range step indices', () => {
    const baseline = hydrateSteps([['A', 1000], ['B', 500]]);
    assert.equal(applyWhatIf(baseline, 0, 10), null);  // step 0 has no "rate"
    assert.equal(applyWhatIf(baseline, 5, 10), null);  // past end
});
