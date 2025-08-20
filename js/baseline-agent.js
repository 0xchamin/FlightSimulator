let baselineAircraft = null;
let baselineAnimationId = null;

function startBaselineAgent() {
    if (!sourceMarker || !destMarker) return;
    
    const speed = parseInt(document.getElementById('speed-slider').value);
    const sourcePos = sourceMarker.getLatLng();
    const destPos = destMarker.getLatLng();
    
    // Use great circle interpolation instead of simple arc
    const routePoints = calculateGreatCirclePoints(sourcePos, destPos, 69);
    
    // Remove existing aircraft
    if (baselineAircraft) map.removeLayer(baselineAircraft);
    
    let currentPoint = 0;
    const totalPoints = routePoints.length;
    
    function moveBaselineAircraft() {
        if (currentPoint >= totalPoints) {
            document.getElementById('start-flight').textContent = 'Start AI Flight';
            return;
        }
        
        const [lat, lng] = routePoints[currentPoint];
        
        if (baselineAircraft) map.removeLayer(baselineAircraft);
        baselineAircraft = createAircraftMarker(lat, lng);

        // Add analytics update here
        const currentPos = {lat: lat, lng: lng};
        const distance = calculateDistance(currentPos, destPos);
        const fuel = 100 - (currentPoint / totalPoints * 50); // Simulate fuel consumption
        updateAnalytics(currentPos, fuel, speed, distance, currentPoint, null);
        
        currentPoint++;
        baselineAnimationId = setTimeout(moveBaselineAircraft, 100 / speed);
    }
    
    moveBaselineAircraft();
}

function calculateGreatCirclePoints(start, end, numPoints = 69) {
    const points = [];
    const lat1 = start.lat * Math.PI / 180;
    const lon1 = start.lng * Math.PI / 180;
    const lat2 = end.lat * Math.PI / 180;
    const lon2 = end.lng * Math.PI / 180;
    
    const d = Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
                       Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1));
    
    for (let i = 0; i <= numPoints + 1; i++) {
        const f = i / (numPoints + 1);
        const a = Math.sin((1 - f) * d) / Math.sin(d);
        const b = Math.sin(f * d) / Math.sin(d);
        
        const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
        const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
        const z = a * Math.sin(lat1) + b * Math.sin(lat2);
        
        const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
        const lng = Math.atan2(y, x) * 180 / Math.PI;
        
        points.push([lat, lng]);
    }
    return points;
}

function calculateDistance(pos1, pos2) {
    const R = 6371; // Earth's radius in km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
