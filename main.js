let steps = [
    { name: 'Step 1', count: 100, stepConversion: 100, survivalRate: 100 },
    { name: 'Step 2', count: 50, stepConversion: 50, survivalRate: 50 },
    { name: 'Complete', count: 25, stepConversion: 50, survivalRate: 25 }
];
let whatIfSteps = null;
let whatIfStepIndex = null;
let whatIfImprovementPercentage = null;

// Load data from localStorage
if (localStorage.getItem('funnelData')) {
    steps = JSON.parse(localStorage.getItem('funnelData'));
}

function saveFunnelData() {
    localStorage.setItem('funnelData', JSON.stringify(steps));
}

function renderFunnel() {
    const funnelElement = document.getElementById('funnel');
    funnelElement.innerHTML = '';

    steps.forEach((step, index) => {
        const stepElement = document.createElement('div');
        stepElement.className = 'step';
        stepElement.innerHTML = `
            <input type="text" value="${step.name}" onchange="updateStepName(${index}, this.value)">
            <input type="number" value="${step.count}" onchange="updateStepCount(${index}, this.value)">
            <input type="number" value="${step.stepConversion.toFixed(2)}" readonly>
            <div class="actions">
                <button onclick="deleteStep(${index})">Delete</button>
                ${index > 0 ? `<button onclick="moveStepUp(${index})">↑</button>` : ''}
                ${index < steps.length - 1 ? `<button onclick="moveStepDown(${index})">↓</button>` : ''}
            </div>
        `;
        funnelElement.appendChild(stepElement);
    });

    updateConversion();
    updateWhatIfDropdown();
    saveFunnelData(); // Save data after rendering
}

function updateConversion() {
    const conversionElement = document.getElementById('conversion');
    const totalCount = steps[0].count;
    const convertedCount = steps[steps.length - 1].count;
    const conversionRate = (convertedCount / totalCount * 100).toFixed(2);

    conversionElement.innerHTML = `
        <span>Conversion:</span>
        <span>${convertedCount}</span>
        <span>${conversionRate}%</span>
        <span></span>
    `;

    if (whatIfSteps) {
        const whatIfConversionElement = document.getElementById('whatIfConversion');
        const whatIfTotalCount = whatIfSteps[0].count;
        const whatIfConvertedCount = whatIfSteps[whatIfSteps.length - 1].count;
        const whatIfConversionRate = (whatIfConvertedCount / whatIfTotalCount * 100).toFixed(2);

        whatIfConversionElement.innerHTML = `What-If Conversion: ${whatIfConvertedCount} (${whatIfConversionRate}%)`;
    }
}

function updateStepName(index, name) {
    steps[index].name = name;
    renderFunnel();
}

function updateStepCount(index, count) {
    count = parseInt(count);
    steps[index].count = count;
    updateSubsequentSteps(index);
    renderFunnel();
}

function updateSubsequentSteps(startIndex) {
    const totalCount = steps[0].count;
    for (let i = startIndex; i < steps.length; i++) {
        if (i > 0) {
            steps[i].stepConversion = (steps[i].count / steps[i - 1].count * 100);
        }
        steps[i].survivalRate = (steps[i].count / totalCount * 100);
        if (i < steps.length - 1) {
            steps[i + 1].count = Math.round(steps[i].count * (steps[i + 1].stepConversion / 100));
        }
    }
}

function addStep() {
    const newStepIndex = steps.length - 1;
    const prevStepCount = steps[newStepIndex].count;
    const newStepCount = Math.round(prevStepCount * 0.5);
    const newStep = { 
        name: `Step ${steps.length}`, 
        count: newStepCount, 
        stepConversion: 50,
        survivalRate: (newStepCount / steps[0].count * 100)
    };
    steps.splice(newStepIndex, 0, newStep);
    updateSubsequentSteps(newStepIndex);
    renderFunnel();
    updateWhatIfDropdown(); // Update the "what-if" scenario dropdown
    resetWhatIfScenario(); // Reset the "what-if" scenario values
}

function deleteStep(index) {
    if (steps.length > 2) {
        steps.splice(index, 1);
        updateSubsequentSteps(index);
        renderFunnel();
    } else {
        alert("You must have at least two steps in the funnel.");
    }
}

function moveStepUp(index) {
    if (index > 0) {
        [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
        updateSubsequentSteps(index - 1);
        renderFunnel();
    }
}

function moveStepDown(index) {
    if (index < steps.length - 1) {
        [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
        updateSubsequentSteps(index);
        renderFunnel();
    }
}

function updateWhatIfDropdown() {
    const dropdown = document.getElementById('whatIfStep');
    dropdown.innerHTML = '';
    steps.forEach((step, index) => {
        if (index > 0 && index < steps.length - 1) { // Exclude the last step
            const option = document.createElement('option');
            option.value = index;
            option.textContent = step.name;
            dropdown.appendChild(option);
        }
    });
}

function resetWhatIfScenario() {
    whatIfSteps = null;
    whatIfStepIndex = null;
    whatIfImprovementPercentage = null;
    document.getElementById('whatIfStep').value = '';
    document.getElementById('whatIfPercentage').value = 5;
    document.getElementById('whatIfConversion').innerHTML = '';
}

document.getElementById('addStepBtn').addEventListener('click', addStep);
document.getElementById('resetBtn').addEventListener('click', resetFunnel);

function resetFunnel() {
    steps = [
        { name: 'Step 1', count: 100, stepConversion: 100, survivalRate: 100 },
        { name: 'Step 2', count: 50, stepConversion: 50, survivalRate: 50 },
        { name: 'Complete', count: 25, stepConversion: 50, survivalRate: 25 }
    ];
    whatIfSteps = null;
    whatIfStepIndex = null;
    whatIfImprovementPercentage = null;
    localStorage.removeItem('funnelData');
    renderFunnel();
    updateWhatIfDropdown(); // Update the "what-if" scenario dropdown
    resetWhatIfScenario(); // Reset the "what-if" scenario values
}

renderFunnel();

// P5.js sketch
new p5(function(p) {
    const colors = {
        primary: ['#5F52FF', '#4C22B6', '#0080FF', '#FFD600', '#00DFB5'],
        secondary: ['#FF3399', '#FF6600', '#009966'],
        gray: {
            background: '#F4F4F4',
            text: '#1A1A1A',
            textBox: '#FFFFFF'
        }
    };

    p.setup = function() {
        const canvas = p.createCanvas(800, 500);
        canvas.parent('funnelVisualization');
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(14);
    };

    p.draw = function() {
        p.background(colors.gray.background);
        p.noStroke();

        const funnelWidth = p.width * 0.3;
        const spacing = p.width * 0.1;

        drawFunnel(steps, -60 + p.width / 2 - funnelWidth - spacing / 2, funnelWidth, colors.primary);
        if (whatIfSteps) {
            drawFunnel(whatIfSteps, -60 + p.width / 2 + spacing / 2, funnelWidth, colors.secondary);
        }
    };

    function drawFunnel(data, startX, funnelWidth, colorSet) {
        const maxWidth = funnelWidth * 0.8;
        const maxHeight = p.height - 50;
        const startY = 25;
        const stepHeight = 80; // Fixed step height

        data.forEach((step, index) => {
            const currentWidth = maxWidth * (step.survivalRate / 100);
            const nextWidth = index < data.length - 1 ? maxWidth * (data[index + 1].survivalRate / 100) : currentWidth;
            const x = startX + (funnelWidth - currentWidth) / 2;
            const y = startY + index * stepHeight;

            // Draw funnel step
            p.fill(colorSet[index % colorSet.length]);
            p.beginShape();
            p.vertex(x, y);
            p.vertex(x + currentWidth, y);
            p.vertex(startX + (funnelWidth - nextWidth) / 2 + nextWidth, y + stepHeight);
            p.vertex(startX + (funnelWidth - nextWidth) / 2, y + stepHeight);
            p.endShape(p.CLOSE);

            // Draw text
            const textX = startX + funnelWidth + 10;
            const textY = y + stepHeight / 2;
            const textContent = `${step.name}: ${step.count}`;
            const conversionText = index > 0 ? `Step: ${step.stepConversion.toFixed(2)}%` : '';
            const survivalText = `Overall: ${step.survivalRate.toFixed(2)}%`;
            
            // Draw text
            p.fill(colors.gray.text);
            p.text(textContent, textX, textY - 20);
            p.text(conversionText, textX, textY);
            p.text(survivalText, textX, textY + 20);
        });
    }
});