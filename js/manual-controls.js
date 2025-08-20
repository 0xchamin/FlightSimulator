let manualAircraft = null;
let manualPosition = null;
let manualFuel = 100;
let keyPressed = {};

function startManualFlight() {
    if (!sourceMarker || !destMarker) return;
    
    // Initialize manual flight
    const sourcePos = sourceMarker.getLatLng();
    manualPosition = {lat: sourcePos.lat, lng: sourcePos.lng};
    manualFuel = 100;

    map.keyboard.disable();
    
    // Create aircraft at starting position
    if (manualAircraft) map.removeLayer(manualAircraft);
    manualAircraft = createAircraftMarker(manualPosition.lat, manualPosition.lng);
    
    // Add keyboard listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Start manual control loop
    manualControlLoop();
    
    console.log('Manual flight started - Use arrow keys to control');
}

function handleKeyDown(e) {
    keyPressed[e.code] = true;
}

function handleKeyUp(e) {
    keyPressed[e.code] = false;
}

function manualControlLoop() {
    if (manualFuel <= 0) {
        console.log('Out of fuel!');
        return;
    }
    
    // Get current speed from slider
    const speed = parseInt(document.getElementById('speed-slider').value);
    
    // Movement based on pressed keys
    let moved = false;
    if (keyPressed['ArrowUp']) {
        manualPosition.lat += 0.1;
        moved = true;
    }
    if (keyPressed['ArrowDown']) {
        manualPosition.lat -= 0.1;
        moved = true;
    }
    if (keyPressed['ArrowLeft']) {
        manualPosition.lng -= 0.1;
        moved = true;
    }
    if (keyPressed['ArrowRight']) {
        manualPosition.lng += 0.1;
        moved = true;
    }
    
    // Update aircraft position and consume fuel based on speed
    if (moved) {
        if (manualAircraft) map.removeLayer(manualAircraft);
        manualAircraft = createAircraftMarker(manualPosition.lat, manualPosition.lng);
        manualFuel -= (speed * 0.1); // Higher speed = more fuel consumption
        console.log('Fuel remaining:', manualFuel.toFixed(1));
    }
    
    // Continue loop
    setTimeout(manualControlLoop, 100);
}


// function manualControlLoop() {
//     if (manualFuel <= 0) {
//         console.log('Out of fuel!');
//         return;
//     }
    
//     // Movement based on pressed keys
//     let moved = false;
//     if (keyPressed['ArrowUp']) {
//         manualPosition.lat += 0.1;
//         moved = true;
//     }
//     if (keyPressed['ArrowDown']) {
//         manualPosition.lat -= 0.1;
//         moved = true;
//     }
//     if (keyPressed['ArrowLeft']) {
//         manualPosition.lng -= 0.1;
//         moved = true;
//     }
//     if (keyPressed['ArrowRight']) {
//         manualPosition.lng += 0.1;
//         moved = true;
//     }
    
//     // Update aircraft position and consume fuel
//     if (moved) {
//         if (manualAircraft) map.removeLayer(manualAircraft);
//         manualAircraft = createAircraftMarker(manualPosition.lat, manualPosition.lng);
//         manualFuel -= 0.5;
//         console.log('Fuel remaining:', manualFuel.toFixed(1));
//     }
    
//     // Continue loop
//     setTimeout(manualControlLoop, 100);
// }


function stopManualFlight() {
    // Re-enable map keyboard controls
    map.keyboard.enable();
    
    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}
