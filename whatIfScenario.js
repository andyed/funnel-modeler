function applyWhatIfScenario() {
    const selectedValue = document.getElementById('whatIfStep').value;
    if (selectedValue === '') {
        whatIfSteps = null;
        whatIfStepIndex = null;
        whatIfImprovementPercentage = null;
        updateConversion();
        renderFunnel();
        return;
    }
    whatIfStepIndex = parseInt(selectedValue, 10);
    whatIfImprovementPercentage = parseFloat(document.getElementById('whatIfPercentage').value);
    updateWhatIfScenario();
}

function updateWhatIfScenario() {
    if (whatIfStepIndex === null || isNaN(whatIfStepIndex)) return;
    if (whatIfImprovementPercentage === null || isNaN(whatIfImprovementPercentage)) return;

    whatIfSteps = applyWhatIf(steps, whatIfStepIndex, whatIfImprovementPercentage);
    if (!whatIfSteps) return;

    updateConversion();
    renderFunnel();
}

document.getElementById('applyWhatIfBtn').addEventListener('click', applyWhatIfScenario);
