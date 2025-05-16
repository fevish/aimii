document.addEventListener('DOMContentLoaded', function() {
    // Test data for the four games
    const gamesData = [
        {
            "game": "Apex Legends",
            "gameFactor": 0.02199999511
        },
        {
            "game": "CS2",
            "gameFactor": 0.02199999511
        },
        {
            "game": "Escape From Tarkov",
            "gameFactor": 0.125
        },
        {
            "game": "Valorant",
            "gameFactor": 0.07
        }
    ];

    // Sort games alphabetically
    gamesData.sort((a, b) => a.game.localeCompare(b.game));

    // Populate game dropdown options
    populateGameDropdowns(gamesData);

    // Form submission handler
    const form = document.getElementById('sensitivityForm');
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        calculateSensitivity(gamesData);
    });
});

function populateGameDropdowns(games) {
    const sourceGameSelect = document.getElementById('sourceGame');
    const targetGameSelect = document.getElementById('targetGame');

    // Clear existing options (except the first placeholder)
    sourceGameSelect.innerHTML = '<option value="" selected disabled>Select your current game</option>';
    targetGameSelect.innerHTML = '<option value="" selected disabled>Select game to convert to</option>';

    // Add game options to both dropdowns
    games.forEach(game => {
        const sourceOption = document.createElement('option');
        sourceOption.value = game.game;
        sourceOption.textContent = game.game;
        sourceGameSelect.appendChild(sourceOption);

        const targetOption = document.createElement('option');
        targetOption.value = game.game;
        targetOption.textContent = game.game;
        targetGameSelect.appendChild(targetOption);
    });
}

function calculateSensitivity(games) {
    // Get input values
    const sourceGameName = document.getElementById('sourceGame').value;
    const targetGameName = document.getElementById('targetGame').value;
    const sourceSensitivity = parseFloat(document.getElementById('sourceSensitivity').value);
    const sourceDPI = parseFloat(document.getElementById('sourceDPI').value);
    const targetDPI = parseFloat(document.getElementById('targetDPI').value);

    // Validate inputs
    if (!sourceGameName || !targetGameName) {
        alert('Please select both source and target games.');
        return;
    }

    if (isNaN(sourceSensitivity) || sourceSensitivity <= 0) {
        alert('Please enter a valid source sensitivity.');
        return;
    }

    if (isNaN(sourceDPI) || sourceDPI <= 0 || isNaN(targetDPI) || targetDPI <= 0) {
        alert('Please enter valid DPI values.');
        return;
    }

    // Find game data for source and target games
    const sourceGame = games.find(g => g.game === sourceGameName);
    const targetGame = games.find(g => g.game === targetGameName);

    if (!sourceGame || !targetGame) {
        alert('Game data not found.');
        return;
    }

    try {
        // Convert to cm/360 (universal measurement)
        const cm360 = calculateCm360(sourceGame.gameFactor, sourceSensitivity, sourceDPI);

        // Convert from cm/360 to target game sensitivity
        const targetSensitivity = calculateTargetSensitivity(targetGame.gameFactor, cm360, targetDPI);

        // Display results
        document.getElementById('convertedSens').textContent = targetSensitivity.toFixed(6);
        document.getElementById('cm360').textContent = cm360.toFixed(3);
        document.getElementById('results').style.display = 'block';
    } catch (error) {
        console.error('Calculation error:', error);
        alert('Error during calculation. Please check the console for details.');
    }
}

/**
 * Calculate cm/360 (centimeters per 360 degree turn)
 * This is a universal measurement that can be converted between games
 */
function calculateCm360(gameFactor, sensitivity, dpi) {
    // Formula: (360 / (gameFactor * sensitivity * dpi)) * 2.54
    // This converts to cm/360
    const inches360 = 360 / (gameFactor * sensitivity * dpi);
    return inches360 * 2.54; // Convert inches to cm
}

/**
 * Convert from cm/360 to game-specific sensitivity
 */
function calculateTargetSensitivity(gameFactor, cm360, targetDPI) {
    // Convert cm back to inches
    const inches360 = cm360 / 2.54;

    // Formula: 360 / (gameFactor * sensitivity * dpi) = inches360
    // Solve for sensitivity: sensitivity = 360 / (gameFactor * dpi * inches360)
    return 360 / (gameFactor * targetDPI * inches360);
}
