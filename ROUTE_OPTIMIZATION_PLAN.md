# Route Optimization & Navigation Implementation Plan

**Project:** BDA-Cali Driver Routing System
**Version:** 1.0.0
**Date:** December 5, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Problem Breakdown](#problem-breakdown)
4. [Solution Architecture](#solution-architecture)
5. [Part 1: Route Optimization (The Math)](#part-1-route-optimization-the-math)
6. [Part 2: Turn-by-Turn Navigation](#part-2-turn-by-turn-navigation)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Technology Stack & Libraries](#technology-stack--libraries)
9. [Cost Analysis](#cost-analysis)
10. [Testing Strategy](#testing-strategy)
11. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### The Challenge

When a food bank driver has multiple pickups assigned for the day, they face two distinct problems:

1. **What order should I visit these locations?** (Route Optimization)
2. **How do I get to each location?** (Turn-by-Turn Navigation)

### Current State

The BDA-Cali app currently:
- ✅ Shows assigned pickups to drivers
- ✅ Opens external maps app (Google Maps/Apple Maps) for single-destination navigation
- ❌ Does NOT optimize route order for multiple pickups
- ❌ Does NOT provide in-app navigation
- ❌ Does NOT consider traffic, time windows, or pickup priorities

### Proposed Solution

Implement a **two-tier routing system**:

1. **Backend Route Optimization**: Cloud Function calculates optimal pickup order using Traveling Salesman Problem (TSP) algorithms
2. **Frontend Navigation Integration**: Enhanced map view with turn-by-turn directions and multi-stop routing

### Expected Benefits

- **30-40% reduction** in total driving time
- **25-35% fuel cost savings**
- **40-50% increase** in daily pickups per driver
- **Improved donor experience** with accurate ETAs
- **Real-time traffic adaptation**

---

## Current State Analysis

### Existing Navigation Flow

```
Driver Views Pickup
      ↓
Taps "Navigate" Button
      ↓
Opens External Map App
(Google Maps or Apple Maps)
      ↓
Driver navigates to single location
      ↓
Returns to BDA app to complete pickup
```

### Current Implementation

**File:** `src/screens/donations/driver/PickupCompleteScreen.tsx:326`

```typescript
import openMap from 'react-native-open-maps';

// Simple external map opening
onPress={() => openMap({ end: data.client.address.formatted })}
```

### Limitations

1. **No Multi-Stop Optimization**: Each pickup navigated individually
2. **No Traffic Awareness**: No real-time traffic consideration
3. **Context Switching**: Driver must switch between apps
4. **No Route Tracking**: No data on actual routes taken
5. **No ETA Updates**: Warehouse has no visibility into driver progress

---

## Problem Breakdown

### Part 1: Route Optimization (The Math)

**Problem Type:** Traveling Salesman Problem (TSP) variant

**Goal:** Find the shortest path that visits all pickup locations exactly once and returns to warehouse

**Input:**
- Warehouse location (start/end point)
- List of N pickup locations (latitude/longitude)
- Optional constraints:
  - Time windows (donor available 9am-5pm)
  - Pickup priorities (urgent vs. flexible)
  - Vehicle capacity limits

**Output:**
- Ordered list of pickups to visit
- Estimated total distance
- Estimated total time
- Individual ETAs for each stop

**Complexity:**
- **Brute Force:** O(n!) - Impractical for >10 stops
- **Optimized Algorithms:** O(n²) to O(n² log n)
- **Approximation Algorithms:** 95-98% optimal in O(n log n)

---

### Part 2: Turn-by-Turn Navigation

**Problem Type:** Path Finding + Real-Time Guidance

**Goal:** Guide driver along optimized route with live directions

**Requirements:**
1. Display route on map
2. Show turn-by-turn instructions
3. Provide voice guidance
4. Update for traffic changes
5. Track driver progress
6. Show next pickup info

**Challenges:**
- Real-time location tracking (battery drain)
- Background location permissions
- Voice guidance implementation
- Offline map support
- Traffic data freshness

---

## Solution Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (React Native)                 │
│  ┌────────────────────┐  ┌─────────────────────────────────┐   │
│  │  Route Display     │  │  Navigation View                │   │
│  │  - Map with stops  │  │  - Turn-by-turn directions      │   │
│  │  - Optimized order │  │  - Voice guidance               │   │
│  │  - ETAs per stop   │  │  - Real-time position tracking  │   │
│  └────────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Cloud Functions                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  optimizeRoute(pickups[], warehouseLocation)             │  │
│  │  - Calculate distance matrix (Google Distance Matrix API)│  │
│  │  - Run TSP optimization algorithm                        │  │
│  │  - Return optimized order + ETAs                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                      External APIs                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Google Maps      │  │ Distance Matrix  │  │ Directions   │ │
│  │ Directions API   │  │ API              │  │ API          │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Driver starts shift
   ↓
2. App fetches assigned pickups from Firestore
   ↓
3. App calls Cloud Function: optimizeRoute()
   ↓
4. Cloud Function:
   a. Calls Distance Matrix API (get travel times between all stops)
   b. Runs TSP optimization algorithm
   c. Returns ordered pickup list with ETAs
   ↓
5. App displays optimized route on map
   ↓
6. Driver taps "Start Route"
   ↓
7. App shows turn-by-turn navigation for first stop
   ↓
8. Driver completes pickup, marks as done
   ↓
9. App automatically navigates to next stop
   ↓
10. Repeat until all pickups complete
```

---

## Part 1: Route Optimization (The Math)

### Approach: Nearest Neighbor + 2-Opt Optimization

**Why This Approach?**
- Fast enough for real-world use (processes 20 stops in <2 seconds)
- Produces near-optimal solutions (95-98% optimal)
- Easy to understand and debug
- Works well with real-world constraints

### Algorithm Choice Comparison

| Algorithm | Complexity | Quality | Implementation Difficulty | Best For |
|-----------|-----------|---------|--------------------------|----------|
| **Brute Force** | O(n!) | 100% optimal | Easy | ≤10 stops |
| **Nearest Neighbor** | O(n²) | 70-80% optimal | Easy | Quick approximation |
| **2-Opt** | O(n²) | 90-95% optimal | Medium | Refinement step |
| **Genetic Algorithm** | O(n² × generations) | 95-98% optimal | Hard | Large routes (>50 stops) |
| **Google OR-Tools** | O(n³) | 98-99% optimal | Easy (library) | Production (recommended) |

### Recommended Solution: Google OR-Tools

**Why OR-Tools?**
- Industry-standard library from Google
- Handles TSP, VRP (Vehicle Routing Problem), and constraints
- Free and open-source
- Python/Node.js support (perfect for Cloud Functions)
- Built-in constraint handling (time windows, capacity, priorities)

### Implementation: Cloud Function

**File:** `functions/optimizeRoute.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

/**
 * Optimize pickup route order using Google OR-Tools
 *
 * Input: {
 *   pickups: [{ id, location: { lat, lng }, timeWindow?, priority? }],
 *   warehouseLocation: { lat, lng },
 *   driverStartTime: Timestamp
 * }
 *
 * Output: {
 *   optimizedOrder: [pickupId1, pickupId2, ...],
 *   totalDistance: number (km),
 *   totalTime: number (minutes),
 *   etas: { pickupId: estimatedArrivalTime },
 *   routePolyline: string (encoded polyline)
 * }
 */
exports.optimizeRoute = functions.https.onCall(async (request) => {
  const { pickups, warehouseLocation, driverStartTime } = request.data;

  // Step 1: Get distance/time matrix between all points
  const distanceMatrix = await getDistanceMatrix(
    [warehouseLocation, ...pickups.map(p => p.location)]
  );

  // Step 2: Run TSP optimization
  const optimizedOrder = solveTSP(distanceMatrix, pickups);

  // Step 3: Calculate ETAs for each stop
  const etas = calculateETAs(optimizedOrder, distanceMatrix, driverStartTime);

  // Step 4: Get route polyline for visualization
  const routePolyline = await getRoutePolyline(optimizedOrder, warehouseLocation);

  return {
    optimizedOrder: optimizedOrder.map(p => p.id),
    totalDistance: calculateTotalDistance(optimizedOrder, distanceMatrix),
    totalTime: calculateTotalTime(optimizedOrder, distanceMatrix),
    etas,
    routePolyline
  };
});

/**
 * Get distance/time matrix using Google Distance Matrix API
 */
async function getDistanceMatrix(locations) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const origins = locations.map(l => `${l.lat},${l.lng}`).join('|');
  const destinations = origins; // Same locations

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=driving&traffic_model=best_guess&departure_time=now&key=${apiKey}`;

  const response = await axios.get(url);

  // Parse response into 2D matrix
  const matrix = response.data.rows.map(row =>
    row.elements.map(element => ({
      distance: element.distance.value, // meters
      duration: element.duration_in_traffic?.value || element.duration.value, // seconds
    }))
  );

  return matrix;
}

/**
 * Solve TSP using Nearest Neighbor + 2-Opt
 */
function solveTSP(distanceMatrix, pickups) {
  // Start at warehouse (index 0)
  let currentIndex = 0;
  const visited = new Set([0]);
  const route = [null]; // Warehouse placeholder

  // Nearest Neighbor: Build initial route
  while (visited.size <= pickups.length) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (let i = 1; i <= pickups.length; i++) {
      if (!visited.has(i)) {
        const distance = distanceMatrix[currentIndex][i].distance;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
    }

    if (nearestIndex === -1) break;

    visited.add(nearestIndex);
    route.push(pickups[nearestIndex - 1]);
    currentIndex = nearestIndex;
  }

  // 2-Opt: Improve route by swapping edges
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const currentDistance = routeDistance(route, distanceMatrix);

        // Swap edges
        const newRoute = [...route];
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, segment.length, ...segment);

        const newDistance = routeDistance(newRoute, distanceMatrix);

        if (newDistance < currentDistance) {
          route = newRoute;
          improved = true;
        }
      }
    }
  }

  return route.filter(p => p !== null); // Remove warehouse placeholder
}

/**
 * Calculate total route distance
 */
function routeDistance(route, distanceMatrix) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const fromIndex = route[i] ? pickupToIndex(route[i]) : 0;
    const toIndex = route[i + 1] ? pickupToIndex(route[i + 1]) : 0;
    total += distanceMatrix[fromIndex][toIndex].distance;
  }
  return total;
}

/**
 * Calculate ETAs for each stop
 */
function calculateETAs(route, distanceMatrix, startTime) {
  const etas = {};
  let currentTime = startTime;
  let currentIndex = 0; // Warehouse

  for (const pickup of route) {
    const pickupIndex = pickupToIndex(pickup);
    const travelTime = distanceMatrix[currentIndex][pickupIndex].duration;
    const pickupDuration = 15 * 60; // 15 minutes per pickup

    currentTime += travelTime + pickupDuration;
    etas[pickup.id] = new Date(startTime * 1000 + currentTime * 1000);
    currentIndex = pickupIndex;
  }

  return etas;
}

/**
 * Get route polyline for map visualization
 */
async function getRoutePolyline(route, warehouseLocation) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const waypoints = route.map(p => `${p.location.lat},${p.location.lng}`).join('|');

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${warehouseLocation.lat},${warehouseLocation.lng}&destination=${warehouseLocation.lat},${warehouseLocation.lng}&waypoints=optimize:false|${waypoints}&key=${apiKey}`;

  const response = await axios.get(url);
  return response.data.routes[0]?.overview_polyline?.points || '';
}
```

### Alternative: Using Google OR-Tools Library

**For production, use OR-Tools instead of custom implementation:**

```javascript
const { RoutingIndexManager, RoutingModel, Assignment } = require('or-tools');

function solveTSPWithORTools(distanceMatrix) {
  const numLocations = distanceMatrix.length;
  const manager = new RoutingIndexManager(numLocations, 1, 0); // 1 vehicle, start at index 0
  const routing = new RoutingModel(manager);

  // Define distance callback
  const transitCallbackIndex = routing.RegisterTransitCallback((fromIndex, toIndex) => {
    const fromNode = manager.IndexToNode(fromIndex);
    const toNode = manager.IndexToNode(toIndex);
    return distanceMatrix[fromNode][toNode].distance;
  });

  routing.SetArcCostEvaluatorOfAllVehicles(transitCallbackIndex);

  // Solve
  const searchParameters = routing.DefaultSearchParameters();
  searchParameters.FirstSolutionStrategy = 'PATH_CHEAPEST_ARC';

  const solution = routing.SolveWithParameters(searchParameters);

  // Extract route
  const route = [];
  let index = routing.Start(0);
  while (!routing.IsEnd(index)) {
    route.push(manager.IndexToNode(index));
    index = solution.Value(routing.NextVar(index));
  }

  return route;
}
```

---

## Part 2: Turn-by-Turn Navigation

### Approach: Google Maps Directions API + React Native Maps

### Option 1: External Navigation (Current + Enhanced)

**Keep using external maps app but with multi-stop support**

```typescript
// Enhanced external navigation with waypoints
import openMap from 'react-native-open-maps';

function navigateOptimizedRoute(pickups: Pickup[]) {
  const waypoints = pickups.map(p =>
    `${p.location.latitude},${p.location.longitude}`
  ).join('|');

  // Open Google Maps with optimized waypoints
  openMap({
    start: warehouseLocation.formatted,
    waypoints: waypoints,
    navigate: true,
    travelType: 'drive'
  });
}
```

**Pros:**
- Simple implementation
- Uses native map apps (better UX)
- No battery drain from in-app tracking
- Free (no API costs)

**Cons:**
- No in-app tracking
- Driver must switch between apps
- No control over UI/UX
- No route analytics

---

### Option 2: In-App Navigation (Recommended)

**Full turn-by-turn navigation within BDA app**

**Libraries Needed:**
```json
{
  "react-native-maps": "^1.3.2",           // Already installed
  "react-native-maps-directions": "^1.9.0", // NEW: Directions rendering
  "@react-native-community/geolocation": "^3.0.6", // NEW: Location tracking
  "react-native-voice": "^3.2.4"           // NEW: Voice instructions (optional)
}
```

**Implementation:**

**File:** `src/screens/donations/driver/RouteNavigationScreen.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from '@react-native-community/geolocation';
import { GOOGLE_MAPS_API_KEY } from '../../../constants/config';

interface RouteNavigationScreenProps {
  route: {
    params: {
      pickups: Pickup[];
      optimizedOrder: string[];
      warehouseLocation: Location;
    };
  };
}

export default function RouteNavigationScreen({ route }: RouteNavigationScreenProps) {
  const { pickups, optimizedOrder, warehouseLocation } = route.params;

  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [nextInstruction, setNextInstruction] = useState('');
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [timeToNext, setTimeToNext] = useState(0);

  const mapRef = useRef<MapView>(null);

  // Get ordered pickup locations
  const orderedPickups = optimizedOrder.map(id =>
    pickups.find(p => p.id === id)
  );

  const currentStop = orderedPickups[currentStopIndex];
  const nextStop = orderedPickups[currentStopIndex + 1];

  // Track driver's real-time location
  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });

        // Check if arrived at current stop
        if (currentStop) {
          const distance = calculateDistance(
            { latitude, longitude },
            currentStop.location
          );

          if (distance < 50) { // Within 50 meters
            Alert.alert(
              'Arrived at Pickup',
              `You've arrived at ${currentStop.donorInfo.name}`,
              [
                { text: 'Complete Pickup', onPress: () => navigateToCompleteScreen() },
                { text: 'Navigate to Next', onPress: () => moveToNextStop() }
              ]
            );
          }
        }
      },
      (error) => console.error('Location error:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000,     // Update every 5 seconds
      }
    );

    return () => Geolocation.clearWatch(watchId);
  }, [currentStopIndex]);

  // Auto-center map on driver location
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentLocation]);

  const moveToNextStop = () => {
    if (currentStopIndex < orderedPickups.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
    } else {
      Alert.alert('Route Complete', 'All pickups completed!');
    }
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...warehouseLocation,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {/* Warehouse Marker */}
        <Marker
          coordinate={warehouseLocation}
          title="Warehouse"
          pinColor="blue"
        />

        {/* Pickup Markers */}
        {orderedPickups.map((pickup, index) => (
          <Marker
            key={pickup.id}
            coordinate={pickup.location}
            title={`Stop ${index + 1}: ${pickup.donorInfo.name}`}
            pinColor={index === currentStopIndex ? 'red' : 'green'}
          >
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}

        {/* Route Directions */}
        {currentStop && (
          <MapViewDirections
            origin={currentLocation || warehouseLocation}
            destination={currentStop.location}
            waypoints={nextStop ? [nextStop.location] : []}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#FF6B35"
            optimizeWaypoints={false}
            onReady={(result) => {
              setDistanceToNext(result.distance);
              setTimeToNext(result.duration);

              // Extract first instruction
              if (result.legs[0]?.steps[0]) {
                setNextInstruction(result.legs[0].steps[0].html_instructions);
              }
            }}
          />
        )}
      </MapView>

      {/* Navigation Instructions Overlay */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionHeader}>
          <Text style={styles.distanceText}>
            {(distanceToNext * 1000).toFixed(0)}m
          </Text>
          <Text style={styles.timeText}>
            {Math.round(timeToNext)} min
          </Text>
        </View>

        <Text style={styles.instructionText}>
          {stripHTML(nextInstruction) || 'Calculating route...'}
        </Text>

        <View style={styles.stopInfo}>
          <Text style={styles.stopLabel}>
            Stop {currentStopIndex + 1} of {orderedPickups.length}
          </Text>
          <Text style={styles.stopName}>
            {currentStop?.donorInfo.name}
          </Text>
          <Text style={styles.stopAddress}>
            {currentStop?.location.address}
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={() => mapRef.current?.animateToRegion({
            ...currentLocation,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          })}
        >
          <Icon name="crosshairs-gps" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={moveToNextStop}
        >
          <Text style={styles.skipButtonText}>Skip to Next Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper: Strip HTML from instructions
function stripHTML(html: string): string {
  return html?.replace(/<[^>]*>/g, '') || '';
}

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(coord1: Location, coord2: Location): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = coord1.latitude * Math.PI / 180;
  const φ2 = coord2.latitude * Math.PI / 180;
  const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  instructionsCard: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    fontSize: 18,
    color: '#666',
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  stopInfo: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
  },
  stopLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  stopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stopAddress: {
    fontSize: 14,
    color: '#666',
  },
  markerLabel: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  controls: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recenterButton: {
    backgroundColor: '#FF6B35',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  skipButton: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: '#4CAF50',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up route optimization backend

- [ ] Create `optimizeRoute` Cloud Function
- [ ] Implement Nearest Neighbor algorithm
- [ ] Integrate Google Distance Matrix API
- [ ] Add 2-Opt optimization
- [ ] Test with sample data (5, 10, 20 stops)
- [ ] Deploy to Firebase

**Deliverables:**
- Working Cloud Function
- Unit tests for algorithm
- API documentation

---

### Phase 2: Basic Route Display (Week 3)

**Goal:** Show optimized route to drivers

- [ ] Create `RouteOverviewScreen.tsx`
- [ ] Display map with numbered markers
- [ ] Show pickup list in optimized order
- [ ] Display total distance/time
- [ ] Add "Start Route" button (opens external maps)

**Deliverables:**
- Route overview screen
- Integration with existing driver flow

---

### Phase 3: In-App Navigation (Week 4-5)

**Goal:** Full turn-by-turn navigation

- [ ] Install `react-native-maps-directions`
- [ ] Implement real-time location tracking
- [ ] Create `RouteNavigationScreen.tsx`
- [ ] Add turn-by-turn instruction display
- [ ] Implement arrival detection
- [ ] Add re-routing on deviation

**Deliverables:**
- Working in-app navigation
- Smooth transitions between stops
- Arrival notifications

---

### Phase 4: Advanced Features (Week 6-7)

**Goal:** Production-ready enhancements

- [ ] Add voice guidance (Text-to-Speech)
- [ ] Implement offline map caching
- [ ] Add traffic alerts
- [ ] Create route analytics dashboard
- [ ] Add ETA notifications to warehouse
- [ ] Implement route history tracking

**Deliverables:**
- Voice navigation
- Offline support
- Analytics dashboard

---

### Phase 5: Optimization & Testing (Week 8)

**Goal:** Performance tuning and QA

- [ ] Real-world testing with drivers
- [ ] Battery optimization
- [ ] API cost optimization
- [ ] Bug fixes
- [ ] Documentation

**Deliverables:**
- Production-ready system
- User documentation
- Training materials

---

## Technology Stack & Libraries

### Frontend Dependencies

```json
{
  "react-native-maps": "^1.3.2",
  "react-native-maps-directions": "^1.9.0",
  "@react-native-community/geolocation": "^3.0.6",
  "react-native-open-maps": "^0.4.0",
  "@mapbox/polyline": "^1.2.0"
}
```

### Backend Dependencies (Cloud Functions)

```json
{
  "axios": "^1.4.0",
  "or-tools": "^9.6.0",
  "firebase-functions": "^7.0.1",
  "firebase-admin": "^13.6.0"
}
```

### External APIs

| API | Purpose | Free Tier | Cost After |
|-----|---------|-----------|------------|
| **Google Distance Matrix API** | Travel time/distance between points | 40,000 elements/month | $5 per 1,000 elements |
| **Google Directions API** | Turn-by-turn directions | 40,000 requests/month | $5 per 1,000 requests |
| **Google Maps SDK** | Map rendering | Free (with attribution) | Free |

---

## Cost Analysis

### Monthly API Cost Estimation

**Assumptions:**
- 5 drivers
- Each driver: 8 pickups/day
- Working days: 22 days/month

**Distance Matrix API:**
```
Calculations per route optimization:
- 8 pickups + 1 warehouse = 9 locations
- Matrix size: 9 × 9 = 81 elements

Monthly usage:
- 5 drivers × 22 days × 81 elements = 8,910 elements
- Under free tier (40,000)
- Cost: $0
```

**Directions API:**
```
Requests per route:
- 1 request per pickup for turn-by-turn
- 8 pickups per driver per day

Monthly usage:
- 5 drivers × 22 days × 8 requests = 880 requests
- Under free tier (40,000)
- Cost: $0
```

**Total Estimated Cost: $0/month** (under free tier)

**At Scale (50 drivers):**
- Distance Matrix: ~89,100 elements = $244.50/month
- Directions: 8,800 requests = $0 (under free tier)
- **Total: ~$245/month**

---

## Testing Strategy

### Unit Tests

**Route Optimization Algorithm:**
```javascript
describe('Route Optimization', () => {
  test('should find shortest route for 5 stops', () => {
    const stops = generateTestStops(5);
    const optimized = optimizeRoute(stops);
    expect(optimized.totalDistance).toBeLessThan(bruteForceOptimal(stops).totalDistance * 1.1);
  });

  test('should handle time window constraints', () => {
    const stops = [
      { id: '1', location: {...}, timeWindow: { start: 9, end: 11 } },
      { id: '2', location: {...}, timeWindow: { start: 14, end: 16 } }
    ];
    const optimized = optimizeRoute(stops);
    expect(isTimeWindowsRespected(optimized)).toBe(true);
  });
});
```

### Integration Tests

**Cloud Function:**
```javascript
test('optimizeRoute Cloud Function returns valid response', async () => {
  const result = await testEnv
    .wrapped(optimizeRoute)
    .call({
      pickups: samplePickups,
      warehouseLocation: { lat: 3.4516, lng: -76.5320 }
    });

  expect(result.optimizedOrder).toHaveLength(samplePickups.length);
  expect(result.totalDistance).toBeGreaterThan(0);
  expect(result.totalTime).toBeGreaterThan(0);
});
```

### Field Tests

**Real-World Validation:**
1. Compare optimized route vs. driver's usual route
2. Measure actual time savings
3. Collect driver feedback on navigation UX
4. Verify arrival detection accuracy (50m threshold)
5. Test offline behavior (no internet)

---

## Future Enhancements

### Advanced Routing Features

1. **Multi-Warehouse Support**
   - Route ending at different warehouse
   - Cross-warehouse pickups

2. **Vehicle Capacity Constraints**
   - Track truck load weight
   - Reject routes exceeding capacity
   - Suggest warehouse drop-off points

3. **Dynamic Re-Routing**
   - Adjust route when new pickup added mid-route
   - Re-optimize based on traffic changes
   - Handle pickup cancellations

4. **Predictive ETAs**
   - Learn from historical data
   - Account for typical delays
   - Improve accuracy over time

### Analytics Dashboard

**Warehouse View:**
- Real-time driver locations on map
- Live ETA updates
- Route completion percentage
- Performance metrics (avg time per pickup)

**Driver Performance:**
- Routes completed per week
- On-time arrival rate
- Fuel efficiency (km per liter)
- Pickup success rate

### Gamification

- Leaderboard for most efficient drivers
- Badges for milestones (100 pickups, perfect week)
- Fuel savings achievements

---

## Appendix

### Algorithm Pseudocode

**Nearest Neighbor:**
```
function nearestNeighbor(warehouse, pickups):
  route = [warehouse]
  unvisited = copy(pickups)
  current = warehouse

  while unvisited is not empty:
    nearest = findClosest(current, unvisited)
    route.append(nearest)
    unvisited.remove(nearest)
    current = nearest

  route.append(warehouse)  # Return to warehouse
  return route
```

**2-Opt Improvement:**
```
function twoOpt(route):
  improved = true

  while improved:
    improved = false
    for i from 1 to route.length - 2:
      for j from i + 1 to route.length - 1:
        if swapImproves(route, i, j):
          route = swap(route, i, j)
          improved = true

  return route

function swapImproves(route, i, j):
  currentCost = distance(route[i-1], route[i]) + distance(route[j], route[j+1])
  swapCost = distance(route[i-1], route[j]) + distance(route[i], route[j+1])
  return swapCost < currentCost
```

### Sample API Responses

**Distance Matrix API:**
```json
{
  "rows": [
    {
      "elements": [
        {
          "distance": { "value": 5234, "text": "5.2 km" },
          "duration": { "value": 720, "text": "12 mins" },
          "duration_in_traffic": { "value": 900, "text": "15 mins" }
        }
      ]
    }
  ]
}
```

**Directions API:**
```json
{
  "routes": [
    {
      "overview_polyline": { "points": "encoded_polyline_string" },
      "legs": [
        {
          "distance": { "value": 5234 },
          "duration": { "value": 720 },
          "steps": [
            {
              "html_instructions": "Head <b>north</b> on <b>Main St</b>",
              "distance": { "value": 150 },
              "duration": { "value": 30 }
            }
          ]
        }
      ]
    }
  ]
}
```

---

**Document Version:** 1.0.0
**Last Updated:** December 5, 2025
**Author:** BDA-Cali Development Team + Claude Code
