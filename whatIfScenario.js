function applyWhatIfScenario() {
    whatIfSteps = null; // Reset whatIfSteps
    whatIfStepIndex = parseInt(document.getElementById('whatIfStep').value);
    whatIfImprovementPercentage = parseFloat(document.getElementById('whatIfPercentage').value);
    
    updateWhatIfScenario();
}

function updateWhatIfScenario() {
    if (whatIfStepIndex !== null && whatIfImprovementPercentage !== null) {
        whatIfSteps = JSON.parse(JSON.stringify(steps));

        // Apply improvement to the selected step's conversion rate
        const currentRate = whatIfSteps[whatIfStepIndex].stepConversion;
        const newRate = Math.min(currentRate * (1 + whatIfImprovementPercentage / 100), 100);
        whatIfSteps[whatIfStepIndex].stepConversion = newRate;
        
        // Update the count of the *selected* step based on the new conversion rate
        if (whatIfStepIndex > 0) {
            whatIfSteps[whatIfStepIndex].count = Math.round(whatIfSteps[whatIfStepIndex - 1].count * (newRate / 100));
        }

        // Update subsequent steps based on the change
        updateWhatIfSubsequentSteps(whatIfStepIndex + 1);

        updateConversion();
        renderFunnel(); // Ensure the UI is refreshed
    }
}

function updateWhatIfSubsequentSteps(startIndex) {
    const totalCount = whatIfSteps[0].count;
    for (let i = startIndex; i < whatIfSteps.length; i++) {
        if (i > 0) {
            whatIfSteps[i].count = Math.round(whatIfSteps[i - 1].count * (whatIfSteps[i].stepConversion / 100));
        }
        whatIfSteps[i].survivalRate = (whatIfSteps[i].count / totalCount * 100);
    }
}

document.getElementById('applyWhatIfBtn').addEventListener('click', applyWhatIfScenario);