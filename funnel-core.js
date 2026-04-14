// Pure helpers — usable in both browser (via <script>) and Node (via require).
// No DOM, no globals, no side effects. Safe to test.

function hydrateSteps(compact) {
    if (!Array.isArray(compact) || compact.length < 2) return null;
    const out = [];
    for (const row of compact) {
        if (!Array.isArray(row) || row.length < 2) return null;
        const count = Number(row[1]);
        if (!isFinite(count) || count < 0) return null;
        out.push({
            name: String(row[0] ?? ''),
            count: Math.round(count),
            stepConversion: 100,
            survivalRate: 100
        });
    }
    const total = out[0].count;
    for (let i = 0; i < out.length; i++) {
        if (i > 0 && out[i - 1].count > 0) {
            out[i].stepConversion = out[i].count / out[i - 1].count * 100;
        }
        out[i].survivalRate = total > 0 ? out[i].count / total * 100 : 0;
    }
    return out;
}

function parseImportText(text) {
    const lines = String(text || '').trim().split(/\r?\n/).filter(l => l.trim());
    const parsed = [];
    for (const line of lines) {
        const parts = line.split(/[\t,]/).map(s => s.trim());
        if (parts.length < 2) continue;
        const count = parseInt(parts[1], 10);
        if (!isFinite(count)) continue; // skips header rows automatically
        parsed.push([parts[0], count]);
    }
    if (parsed.length < 2) return null;
    return hydrateSteps(parsed);
}

function encodeStepsToHash(stepsData) {
    try {
        return btoa(unescape(encodeURIComponent(JSON.stringify(stepsData))));
    } catch (e) {
        return null;
    }
}

function decodeStepsFromHash(encoded) {
    try {
        return JSON.parse(decodeURIComponent(escape(atob(encoded))));
    } catch (e) {
        return null;
    }
}

// Returns a new steps array with step[idx]'s rate improved by improvementPct;
// downstream counts are rescaled to preserve each step's original conversion rate.
function applyWhatIf(baselineSteps, stepIndex, improvementPct) {
    if (!Array.isArray(baselineSteps) || stepIndex < 1 || stepIndex >= baselineSteps.length) return null;
    const out = JSON.parse(JSON.stringify(baselineSteps));
    const currentRate = out[stepIndex].stepConversion;
    const newRate = Math.min(currentRate * (1 + improvementPct / 100), 100);

    // rate[i] = count[i] / count[i-1], so improving rate[i] lifts count[i] — not count[i+1].
    out[stepIndex].stepConversion = newRate;
    out[stepIndex].count = Math.round(out[stepIndex - 1].count * newRate / 100);

    // Preserve downstream rates, rescale counts against the new upstream count.
    for (let j = stepIndex + 1; j < out.length; j++) {
        out[j].count = Math.round(out[j - 1].count * out[j].stepConversion / 100);
    }

    const total = out[0].count;
    for (let j = 0; j < out.length; j++) {
        out[j].survivalRate = total > 0 ? out[j].count / total * 100 : 0;
    }
    return out;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        hydrateSteps,
        parseImportText,
        encodeStepsToHash,
        decodeStepsFromHash,
        applyWhatIf
    };
}
