// Q-Learning Agent Implementation
class QLearningAgent {
    constructor() {
        this.qTable = {};
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.explorationRate = 0.3;
        this.actions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Speed options
    }
    
    // Convert continuous state to discrete buckets
    encodeState(fuel, distance, speed, weather, progress, lat, lng) {
        const fuelBucket = fuel <= 25 ? 0 : fuel <= 50 ? 1 : fuel <= 75 ? 2 : 3;
        const distBucket = distance <= 20 ? 0 : distance <= 40 ? 1 : distance <= 60 ? 2 : distance <= 80 ? 3 : 4;
        const speedBucket = speed <= 3 ? 0 : speed <= 7 ? 1 : 2;
        const weatherBucket = weather - 1; // 0, 1, 2
        const progressBucket = progress <= 33 ? 0 : progress <= 66 ? 1 : 2;
        const latBucket = lat < -30 ? 0 : lat < 30 ? 1 : 2; // South, Equator, North
        const lngBucket = lng < -60 ? 0 : lng < 60 ? 1 : 2; // West, Center, East
        
        return `${fuelBucket}-${distBucket}-${speedBucket}-${weatherBucket}-${progressBucket}-${latBucket}-${lngBucket}`;
    }
    
    // Initialize Q-values for a state if not exists
    initializeState(state) {
        if (!this.qTable[state]) {
            this.qTable[state] = {};
            this.actions.forEach(action => {
                this.qTable[state][action] = 0;
            });
        }
    }

    // Action selection: exploration vs exploitation
    selectAction(state) {
        this.initializeState(state);
        
        if (Math.random() < this.explorationRate) {
            // Exploration: choose random action
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        } else {
            // Exploitation: choose best action based on Q-values
            let bestAction = this.actions[0];
            let bestValue = this.qTable[state][bestAction];
            
            for (let action of this.actions) {
                if (this.qTable[state][action] > bestValue) {
                    bestValue = this.qTable[state][action];
                    bestAction = action;
                }
            }
            return bestAction;
        }
    }

    // Learning update: improve Q-table based on experience
    updateQValue(state, action, reward, nextState) {
        this.initializeState(state);
        this.initializeState(nextState);
        
        // Find best Q-value for next state
        let maxNextQ = Math.max(...this.actions.map(a => this.qTable[nextState][a]));
        
        // Q-Learning formula: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
        let currentQ = this.qTable[state][action];
        let newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
        
        this.qTable[state][action] = newQ;
    }

    // Reward system: calculate feedback for agent's actions
    calculateReward(fuel, distance, speed, reachedDestination) {
        let reward = 0;
        
        // Positive rewards
        if (reachedDestination) reward += 100; // Big bonus for completing flight
        if (fuel > 50) reward += 10; // Bonus for maintaining fuel
        
        // Negative rewards (penalties)
        if (fuel <= 0) reward -= 100; // Heavy penalty for running out of fuel
        if (fuel < 25) reward -= 20; // Penalty for low fuel
        if (speed > 8 && fuel < 50) reward -= 15; // Penalty for high speed with low fuel
        
        // Efficiency bonus: reward fuel-efficient flying
        reward += (fuel / 10); // More fuel remaining = higher reward
        
        return reward;
    }

    // Main Q-Learning flight function
    // Main Q-Learning flight function with dynamic scaling
    async startQLearningFlight(sourcePos, destPos, updateCallback) {
        let currentPos = {lat: sourcePos.lat, lng: sourcePos.lng};
        let fuel = 100;
        let stepCount = 0;
        let maxSteps = 100;
        
        // Calculate total route distance for dynamic scaling
        const totalDistance = this.calculateDistance(sourcePos, destPos);
        const movementScale = totalDistance / 100; // Scale based on route length
        
        while (stepCount < maxSteps && fuel > 0) {
            // Calculate current state
            const distance = this.calculateDistance(currentPos, destPos);
            const progress = (stepCount / maxSteps) * 100;
            const weather = Math.floor(Math.random() * 3) + 1; // Random weather
            const currentSpeed = 5; // Default speed
            
            const state = this.encodeState(fuel, distance/totalDistance*100, currentSpeed, weather, progress, currentPos.lat, currentPos.lng);
            
            // Select action (speed)
            const action = this.selectAction(state);
            
            // Execute action with dynamic movement scaling
            const moveDistance = action * movementScale; // Scales with route distance
            const fuelCost = action * 0.8;
            
            // Update position toward destination
            const bearing = this.calculateBearing(currentPos, destPos);
            currentPos = this.movePosition(currentPos, bearing, moveDistance);
            fuel -= fuelCost;
            
            // Calculate reward
            const newDistance = this.calculateDistance(currentPos, destPos);
            const reachedDestination = newDistance < movementScale;
            const reward = this.calculateReward(fuel, newDistance/totalDistance*100, action, reachedDestination);
            
            // Update Q-table
            const nextState = this.encodeState(fuel, newDistance/totalDistance*100, action, weather, progress + 1, currentPos.lat, currentPos.lng);
            this.updateQValue(state, action, reward, nextState);
            
            // Update display
            if (updateCallback) updateCallback(currentPos, fuel, stepCount);
            
            if (reachedDestination) break;
            stepCount++;
            
            // Add delay for visualization
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }


    // Helper functions
    calculateDistance(pos1, pos2) {
        const R = 6371; // Earth's radius in km
        const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
        const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    calculateBearing(pos1, pos2) {
        const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
        const lat1 = pos1.lat * Math.PI / 180;
        const lat2 = pos2.lat * Math.PI / 180;
        return Math.atan2(Math.sin(dLng) * Math.cos(lat2), 
                        Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng));
    }

    movePosition(pos, bearing, distance) {
        const R = 6371; // Earth's radius
        const lat1 = pos.lat * Math.PI / 180;
        const lng1 = pos.lng * Math.PI / 180;
        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance/R) + 
                            Math.cos(lat1) * Math.sin(distance/R) * Math.cos(bearing));
        const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(distance/R) * Math.cos(lat1),
                                    Math.cos(distance/R) - Math.sin(lat1) * Math.sin(lat2));
        return {lat: lat2 * 180 / Math.PI, lng: lng2 * 180 / Math.PI};
    }




}
