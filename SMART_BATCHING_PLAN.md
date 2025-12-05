# Smart Pickup Batching System

**Feature:** Intelligent grouping and visual organization of driver pickups
**Version:** 1.0.0
**Date:** December 5, 2025

---

## Overview

The Smart Batching System automatically groups pickups by geographic proximity (ZIP code) and displays them in chronological order with color-coded visual indicators to help drivers efficiently plan their routes.

## Goals

1. **Visual Grouping**: Same ZIP code = Same color
2. **Time Ordering**: Chronological sort within each day
3. **Route Efficiency**: Minimize driving distance between pickups
4. **Driver UX**: Clear visual indication of which pickups are in the same area

---

## Algorithm Design

### Step 1: Group by ZIP Code

```javascript
// Extract ZIP code from address
function extractZipCode(address) {
  // Match 5-digit ZIP code pattern
  const zipMatch = address.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1] : 'unknown';
}

// Group pickups by ZIP code
function groupByZipCode(pickups) {
  const groups = {};

  pickups.forEach(pickup => {
    const zip = extractZipCode(pickup.location.address);

    if (!groups[zip]) {
      groups[zip] = [];
    }

    groups[zip].push(pickup);
  });

  return groups;
}
```

### Step 2: Assign Colors to ZIP Code Groups

```javascript
// Color palette for batching (10 distinct colors)
const BATCH_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788', // Green
];

function assignBatchColors(zipGroups) {
  const zipCodes = Object.keys(zipGroups);
  const colorMap = {};

  zipCodes.forEach((zip, index) => {
    colorMap[zip] = BATCH_COLORS[index % BATCH_COLORS.length];
  });

  return colorMap;
}
```

### Step 3: Sort Chronologically Within Groups

```javascript
function sortPickupsByTime(pickups) {
  return pickups.sort((a, b) => {
    const timeA = a.pickup?.scheduledDate?.toDate() || new Date(0);
    const timeB = b.pickup?.scheduledDate?.toDate() || new Date(0);
    return timeA - timeB;
  });
}
```

### Step 4: Combine - Sorted by Time, Grouped by Color

```javascript
function batchPickups(pickups) {
  // Step 1: Group by ZIP
  const zipGroups = groupByZipCode(pickups);

  // Step 2: Assign colors
  const colorMap = assignBatchColors(zipGroups);

  // Step 3: Flatten and sort by time, keeping ZIP info
  const batchedPickups = [];

  Object.keys(zipGroups).forEach(zip => {
    const groupPickups = sortPickupsByTime(zipGroups[zip]);

    groupPickups.forEach(pickup => {
      batchedPickups.push({
        ...pickup,
        batchColor: colorMap[zip],
        batchZipCode: zip,
        batchSize: zipGroups[zip].length
      });
    });
  });

  // Final sort: chronological order across all groups
  return sortPickupsByTime(batchedPickups);
}
```

---

## Implementation

### File 1: Batching Service

**File:** `src/services/batchingService.ts`

```typescript
/**
 * Smart Batching Service
 *
 * Groups pickups by ZIP code with color coding and chronological sorting
 */

export interface BatchedPickup {
  id: string;
  batchColor: string;
  batchZipCode: string;
  batchSize: number;
  batchIndex: number;
  [key: string]: any;
}

// Distinct color palette for up to 10 ZIP code groups
const BATCH_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788', // Green
];

/**
 * Extract ZIP code from address string
 */
export function extractZipCode(address: string): string {
  // Match 5-digit ZIP code pattern (US)
  const zipMatch = address.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1] : 'unknown';
}

/**
 * Group pickups by ZIP code
 */
function groupByZipCode(pickups: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};

  pickups.forEach(pickup => {
    const zip = extractZipCode(pickup.location?.address || '');

    if (!groups[zip]) {
      groups[zip] = [];
    }

    groups[zip].push(pickup);
  });

  return groups;
}

/**
 * Assign colors to ZIP code groups
 */
function assignBatchColors(zipGroups: Record<string, any[]>): Record<string, string> {
  const zipCodes = Object.keys(zipGroups).sort(); // Sort for consistency
  const colorMap: Record<string, string> = {};

  zipCodes.forEach((zip, index) => {
    colorMap[zip] = BATCH_COLORS[index % BATCH_COLORS.length];
  });

  return colorMap;
}

/**
 * Sort pickups chronologically by scheduled time
 */
function sortPickupsByTime(pickups: any[]): any[] {
  return [...pickups].sort((a, b) => {
    const timeA = a.pickup?.scheduledDate?.toDate?.() || new Date(a.pickup?.scheduledDate || 0);
    const timeB = b.pickup?.scheduledDate?.toDate?.() || new Date(b.pickup?.scheduledDate || 0);
    return timeA.getTime() - timeB.getTime();
  });
}

/**
 * Main batching function
 *
 * Groups pickups by ZIP code, assigns colors, and sorts chronologically
 */
export function batchPickups(pickups: any[]): BatchedPickup[] {
  if (!pickups || pickups.length === 0) {
    return [];
  }

  // Step 1: Group by ZIP code
  const zipGroups = groupByZipCode(pickups);

  // Step 2: Assign colors to ZIP groups
  const colorMap = assignBatchColors(zipGroups);

  // Step 3: Create batched pickups with metadata
  const batchedPickups: BatchedPickup[] = [];

  Object.keys(zipGroups).forEach(zip => {
    const groupPickups = sortPickupsByTime(zipGroups[zip]);

    groupPickups.forEach((pickup, index) => {
      batchedPickups.push({
        ...pickup,
        batchColor: colorMap[zip],
        batchZipCode: zip,
        batchSize: groupPickups.length,
        batchIndex: index + 1, // 1-indexed for display
      });
    });
  });

  // Step 4: Final sort - chronological order across all groups
  return sortPickupsByTime(batchedPickups);
}

/**
 * Get batch summary statistics
 */
export function getBatchSummary(batchedPickups: BatchedPickup[]): {
  totalPickups: number;
  totalBatches: number;
  batchBreakdown: Array<{
    zipCode: string;
    color: string;
    count: number;
  }>;
} {
  const zipCounts: Record<string, { color: string; count: number }> = {};

  batchedPickups.forEach(pickup => {
    const zip = pickup.batchZipCode;

    if (!zipCounts[zip]) {
      zipCounts[zip] = {
        color: pickup.batchColor,
        count: 0,
      };
    }

    zipCounts[zip].count++;
  });

  const batchBreakdown = Object.keys(zipCounts).map(zip => ({
    zipCode: zip,
    color: zipCounts[zip].color,
    count: zipCounts[zip].count,
  }));

  return {
    totalPickups: batchedPickups.length,
    totalBatches: batchBreakdown.length,
    batchBreakdown,
  };
}
```

---

### File 2: Batch Indicator Component

**File:** `src/components/BatchIndicator.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BatchIndicatorProps {
  color: string;
  zipCode: string;
  index: number;
  total: number;
  size?: 'small' | 'medium' | 'large';
}

export const BatchIndicator: React.FC<BatchIndicatorProps> = ({
  color,
  zipCode,
  index,
  total,
  size = 'medium',
}) => {
  const sizeStyles = {
    small: { width: 8, height: 8, marginRight: 6 },
    medium: { width: 12, height: 12, marginRight: 8 },
    large: { width: 16, height: 16, marginRight: 10 },
  };

  return (
    <View style={styles.container}>
      {/* Color dot indicator */}
      <View
        style={[
          styles.dot,
          sizeStyles[size],
          { backgroundColor: color }
        ]}
      />

      {/* ZIP code label */}
      <Text style={styles.zipText}>ZIP {zipCode}</Text>

      {/* Batch count */}
      <Text style={styles.countText}>
        ({index}/{total})
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dot: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#fff',
  },
  zipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginRight: 6,
  },
  countText: {
    fontSize: 11,
    color: '#999',
  },
});
```

---

### File 3: Updated Driver List Screen

**File:** `src/screens/donations/driver/ListScreen.tsx` (modifications)

```typescript
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { batchPickups, getBatchSummary, BatchedPickup } from '../../../services/batchingService';
import { BatchIndicator } from '../../../components/BatchIndicator';

export default function DriverListScreen() {
  const [pickups, setPickups] = useState<any[]>([]);
  const [batchedPickups, setBatchedPickups] = useState<BatchedPickup[]>([]);

  useEffect(() => {
    // Fetch pickups from Firestore
    const unsubscribe = fetchDriverPickups((fetchedPickups) => {
      setPickups(fetchedPickups);

      // Apply smart batching
      const batched = batchPickups(fetchedPickups);
      setBatchedPickups(batched);
    });

    return unsubscribe;
  }, []);

  const renderPickupCard = ({ item }: { item: BatchedPickup }) => (
    <View style={[
      styles.card,
      { borderLeftColor: item.batchColor, borderLeftWidth: 6 }
    ]}>
      {/* Batch indicator */}
      <BatchIndicator
        color={item.batchColor}
        zipCode={item.batchZipCode}
        index={item.batchIndex}
        total={item.batchSize}
      />

      {/* Pickup time */}
      <Text style={styles.time}>
        {formatTime(item.pickup?.scheduledDate)}
      </Text>

      {/* Address */}
      <Text style={styles.address}>
        {item.location?.address}
      </Text>

      {/* Donor info */}
      <Text style={styles.donor}>
        {item.donorInfo?.name}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Batch summary header */}
      <BatchSummaryHeader pickups={batchedPickups} />

      {/* Pickup list */}
      <FlatList
        data={batchedPickups}
        renderItem={renderPickupCard}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  time: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  donor: {
    fontSize: 14,
    color: '#999',
  },
});
```

---

### File 4: Batch Summary Header Component

**File:** `src/components/BatchSummaryHeader.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getBatchSummary, BatchedPickup } from '../services/batchingService';

interface BatchSummaryHeaderProps {
  pickups: BatchedPickup[];
}

export const BatchSummaryHeader: React.FC<BatchSummaryHeaderProps> = ({ pickups }) => {
  const summary = getBatchSummary(pickups);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Today's Route: {summary.totalPickups} Pickups in {summary.totalBatches} Areas
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {summary.batchBreakdown.map((batch) => (
          <View key={batch.zipCode} style={styles.batchChip}>
            <View
              style={[styles.colorDot, { backgroundColor: batch.color }]}
            />
            <Text style={styles.batchText}>
              ZIP {batch.zipCode}: {batch.count}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  batchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  batchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});
```

---

## Visual Example

```
┌─────────────────────────────────────────────────────┐
│ Today's Route: 6 Pickups in 4 Areas                │
│                                                     │
│ [●] ZIP 95339: 2   [●] ZIP 95769: 1               │
│ [●] ZIP 95889: 1   [●] ZIP 95327: 2               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ● ZIP 95339 (1/2)                 9:00 AM           │
│ 3969 Williamson View                                │
│ Commercial Bakery                                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ● ZIP 95072 (1/1)                11:00 AM           │
│ 980 S Broad Street                                  │
│ Downtown Restaurant                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ● ZIP 95339 (2/2)                 1:00 PM           │
│ 51703 Haylee Flats                                  │
│ Family Donation                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ● ZIP 95327 (1/2)                 9:00 AM (next day)│
│ 4097 Walker Inlet                                   │
│ Grocery Store                                       │
└─────────────────────────────────────────────────────┘
```

## Benefits

### For Drivers:
✅ **Visual clarity**: Instantly see which pickups are in the same area
✅ **Route planning**: Group nearby pickups mentally
✅ **Time management**: See chronological order at a glance
✅ **Efficiency**: Minimize backtracking between areas

### For Warehouse:
✅ **Assignment optimization**: Assign pickups in same ZIP to same driver
✅ **Monitoring**: Track driver progress by batch
✅ **Analytics**: Understand geographic distribution of pickups

---

## Testing

### Test Case 1: Same ZIP Code

**Input:**
```javascript
[
  { address: '123 Main St, City, CA 95339', scheduledDate: '9:00 AM' },
  { address: '456 Oak Ave, Town, CA 95339', scheduledDate: '2:00 PM' },
  { address: '789 Elm Blvd, Village, CA 95339', scheduledDate: '11:00 AM' }
]
```

**Expected:**
- All 3 pickups have same color
- Sorted: 9:00 AM → 11:00 AM → 2:00 PM
- Batch indicators: (1/3), (2/3), (3/3)

### Test Case 2: Multiple ZIP Codes

**Input:**
```javascript
[
  { address: 'Address A, CA 95001', scheduledDate: '10:00 AM' },
  { address: 'Address B, CA 95002', scheduledDate: '9:00 AM' },
  { address: 'Address C, CA 95001', scheduledDate: '3:00 PM' }
]
```

**Expected:**
- ZIP 95001: Color 1 (2 pickups)
- ZIP 95002: Color 2 (1 pickup)
- Sorted: 9:00 AM (95002) → 10:00 AM (95001) → 3:00 PM (95001)

---

## Future Enhancements

1. **Advanced Batching**:
   - Use actual GPS distance instead of ZIP code
   - K-means clustering for optimal geographic groups
   - Consider traffic patterns

2. **Driver Preferences**:
   - Let drivers manually reorder within batches
   - Save preferred routes

3. **Dynamic Re-batching**:
   - Update colors/groups when new pickups added
   - Suggest optimal insertion point for new pickup

4. **Analytics**:
   - Track average time per batch
   - Identify most efficient routes
   - Suggest warehouse assignments based on driver location

---

**Implementation Time:** 4-6 hours
**Complexity:** Low-Medium
**Impact:** High (better driver experience + route efficiency)
