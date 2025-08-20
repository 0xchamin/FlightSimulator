// js/map.js - Complete version
let map;
let sourceMarker = null;
let destMarker = null;
let routeLine = null;
let clickCount = 0;

// Initialize the map
function initMap() {
    map = L.map('map').setView([20, 0], 2);
    
    // Add tile layer with dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 18
    }).addTo(map);
    
    // Add click event listener
    map.on('click', handleMapClick);
}

function setSource(lat, lng) {
    if (sourceMarker) map.removeLayer(sourceMarker);
    sourceMarker = L.marker([lat, lng]).addTo(map);
    document.getElementById('source-coords').textContent = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
}

function setDestination(lat, lng) {
    if (destMarker) map.removeLayer(destMarker);
    destMarker = L.marker([lat, lng]).addTo(map);
    document.getElementById('dest-coords').textContent = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
}


function drawRoute() {
    if (routeLine) map.removeLayer(routeLine);
    if (sourceMarker && destMarker) {
        const sourcePos = sourceMarker.getLatLng();
        const destPos = destMarker.getLatLng();
        
        // Simple arc calculation - add a midpoint that's slightly "up"
        const midLat = (sourcePos.lat + destPos.lat) / 2 + 5; // Add 5 degrees north
        const midLng = (sourcePos.lng + destPos.lng) / 2;
        
        routeLine = L.polyline([
            [sourcePos.lat, sourcePos.lng],
            [midLat, midLng],
            [destPos.lat, destPos.lng]
        ], {color: '#38bdf8'}).addTo(map);
        
        document.getElementById('route-info').style.display = 'block';
        document.getElementById('flight-controls').style.display = 'block';
        
        if (currentAircraft) map.removeLayer(currentAircraft);
        currentAircraft = createAircraftMarker(sourcePos.lat, sourcePos.lng);
    }
}



function handleMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    if (clickCount === 0) {
        setSource(lat, lng);
        clickCount = 1;
        document.getElementById('status').textContent = 'Now click destination point';
    } else if (clickCount === 1) {
        setDestination(lat, lng);
        clickCount = 0;
        drawRoute();
        document.getElementById('status').textContent = 'Route set! Click anywhere to start over';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initMap);

// Add this function to js/map.js
// function createAircraftMarker(lat, lng) {
//     const aircraftIcon = L.divIcon({
//         html: '<div class="aircraft-icon"></div>',
//         className: 'aircraft-marker',
//         iconSize: [24, 24],
//         iconAnchor: [12, 12]
//     });
    
//     return L.marker([lat, lng], {icon: aircraftIcon}).addTo(map);
// }
function createAircraftMarker(lat, lng) {
    const aircraftIcon = L.divIcon({
        html: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                 <path d="M4 12L28 2L22 26L16 20L10 24L4 12Z" 
                       fill="#f97316" stroke="#38bdf8" stroke-width="2"/>
               </svg>`,
        className: 'aircraft-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
    
    return L.marker([lat, lng], {icon: aircraftIcon}).addTo(map);
}

// Add this event listener (you can put it near the bottom of the file)
document.getElementById('speed-slider').addEventListener('input', function(e) {
    document.getElementById('speed-value').textContent = e.target.value;
});

// Calculate great circle arc points
function calculateArcPoints(start, end, numPoints = 50) {
    const points = [];
    const lat1 = start.lat * Math.PI / 180;
    const lon1 = start.lng * Math.PI / 180;
    const lat2 = end.lat * Math.PI / 180;
    const lon2 = end.lng * Math.PI / 180;
    
    for (let i = 0; i <= numPoints; i++) {
        const f = i / numPoints;
        const a = Math.sin((1-f) * Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1))) / Math.sin(Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1)));
        const b = Math.sin(f * Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1))) / Math.sin(Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1)));
        
        const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
        const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
        const z = a * Math.sin(lat1) + b * Math.sin(lat2);
        
        const lat = Math.atan2(z, Math.sqrt(x*x + y*y)) * 180 / Math.PI;
        const lng = Math.atan2(y, x) * 180 / Math.PI;
        
        points.push([lat, lng]);
    }
    return points;
}

let currentAircraft = null;
let animationId = null;

function animateAircraft() {
    if (!sourceMarker || !destMarker) return;
    
    const speed = parseInt(document.getElementById('speed-slider').value);
    const arcPoints = calculateArcPoints(sourceMarker.getLatLng(), destMarker.getLatLng());
    
    // Update route to use arc
    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.polyline(arcPoints, {color: '#38bdf8'}).addTo(map);
    
    // Remove existing aircraft
    if (currentAircraft) map.removeLayer(currentAircraft);
    
    let currentPoint = 0;
    const totalPoints = arcPoints.length;
    
    function moveAircraft() {
        if (currentPoint >= totalPoints) {
            document.getElementById('start-flight').textContent = 'Start Flight';
            return;
        }
        
        const [lat, lng] = arcPoints[currentPoint];
        
        if (currentAircraft) map.removeLayer(currentAircraft);
        currentAircraft = createAircraftMarker(lat, lng);
        
        currentPoint++;
        animationId = setTimeout(moveAircraft, 100 / speed);
    }
    
    moveAircraft();
}


// document.getElementById('start-flight').addEventListener('click', function() {
//     if (this.textContent === 'Start Flight') {
//         this.textContent = 'Stop Flight';
//         animateAircraft();
//     } else {
//         this.textContent = 'Start Flight';
//         if (animationId) clearTimeout(animationId);
//     }
// });

document.getElementById('start-flight').addEventListener('click', function() {
    const selectedAgent = document.getElementById('agent-dropdown').value;
    
    if (this.textContent.includes('Start')) {
        this.textContent = 'Stop Flight';
        
        // Call different functions based on selected agent
        switch(selectedAgent) {
            case 'manual':
                startManualFlight();
                break;
            case 'baseline':
                startBaselineAgent();
                break;
            case 'qlearning':
                startQLearningAgent();
                break;
            default:
                animateAircraft(); // Current animation for now
        }
    } else {
        this.textContent = selectedAgent === 'manual' ? 'Start Manual Flight' : 'Start AI Flight';
        if (animationId) clearTimeout(animationId);
    }
});



// Add event listener for agent selection
document.getElementById('agent-dropdown').addEventListener('change', function() {
    const selectedAgent = this.value;
    console.log('Selected agent:', selectedAgent);
    
    // Update UI based on selection
    if (selectedAgent === 'manual') {
        document.getElementById('start-flight').textContent = 'Start Manual Flight';
    } else {
        document.getElementById('start-flight').textContent = 'Start AI Flight';
    }
});


function startManualFlight() {
    console.log('Manual flight started');
    // TODO: Implement manual controls
}

function startBaselineAgent() {
    console.log('Baseline agent started');
    animateAircraft(); // Use existing animation for now
}

let qLearningAgent = null;
let qLearningAircraft = null;

function startQLearningAgent() {
    if (!sourceMarker || !destMarker) return;
    
    // Initialize Q-Learning agent
    if (!qLearningAgent) {
        qLearningAgent = new QLearningAgent();
    }
    
    const sourcePos = sourceMarker.getLatLng();
    const destPos = destMarker.getLatLng();
    
    // Remove existing aircraft
    if (qLearningAircraft) map.removeLayer(qLearningAircraft);
    
    // Start Q-Learning flight with callback to update map
    qLearningAgent.startQLearningFlight(sourcePos, destPos, (position, fuel, step) => {
        if (qLearningAircraft) map.removeLayer(qLearningAircraft);
        qLearningAircraft = createAircraftMarker(position.lat, position.lng);
        console.log(`Step ${step}: Fuel ${fuel.toFixed(1)}%`);
        // Update analytics panel
        const distance = qLearningAgent.calculateDistance(position, destPos);
        updateAnalytics(position, fuel, 5, distance, step, qLearningAgent);
    });
}

// Analytics panel update functions
function updateAnalytics(position, fuel, speed, distance, step, qAgent) {
    // Update current flight stats
    document.getElementById('fuel-display').textContent = fuel.toFixed(1);
    document.getElementById('speed-display').textContent = speed;
    document.getElementById('distance-display').textContent = distance.toFixed(0);
    
    // Update learning progress
    if (qAgent) {
        document.getElementById('exploration-display').textContent = (qAgent.explorationRate * 100).toFixed(0);
        document.getElementById('qtable-size').textContent = Object.keys(qAgent.qTable).length;
    }
    
    // Add log entry
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `Step ${step}: Speed ${speed}, Fuel ${fuel.toFixed(1)}%, Dist ${distance.toFixed(0)}km`;
    
    const logEntries = document.getElementById('log-entries');
    logEntries.insertBefore(logEntry, logEntries.firstChild);
    
    // Keep only last 10 entries
    while (logEntries.children.length > 10) {
        logEntries.removeChild(logEntries.lastChild);
    }
}
