# Pickup Components Guide

## 📦 Components Created

I've created **3 new pickup components** in `src/components/pickup/`:

```
✅ AccessInfoCard.tsx      - Display access notes, dock codes, loading tips
✅ WeightInputRow.tsx      - Camera button + weight input
✅ PackagingSelector.tsx   - Multi-select chips for packaging types
✅ index.ts                - Export file for easy imports
```

---

## 🎨 Component 1: AccessInfoCard

### Purpose
Display important access information for pickup locations (dock codes, loading instructions, etc.)

### Visual Specs
- **Background:** `#1A2B45` (dark blue)
- **Border Radius:** 12px
- **Title:** "Access Notes" - Bold white text
- **Content:** Lighter text color `#B0B8C4`

### Props
```typescript
interface AccessInfoCardProps {
  dockCode?: string;      // Optional: Dock/bay code
  loadingTips?: string;   // Optional: Special instructions
}
```

### Usage Example
```typescript
import { AccessInfoCard } from '../../../components/pickup';

// In your component:
<AccessInfoCard
  dockCode="Bay 3"
  loadingTips="Use side entrance after 5pm. Ring bell twice."
/>
```

### Visual Preview
```
┌─────────────────────────────────┐
│ Access Notes                    │ ← Bold white
│                                 │
│ Dock Code:                      │ ← Light text
│ Bay 3                           │
│                                 │
│ Loading Tips:                   │
│ Use side entrance after 5pm.    │
│ Ring bell twice.                │
└─────────────────────────────────┘
  Background: #1A2B45 (Dark Blue)
```

---

## 🎨 Component 2: WeightInputRow

### Purpose
Combine camera functionality with weight input in a single row

### Visual Specs
- **Camera Button:**
  - Size: 80x80
  - Border Radius: 40 (circular)
  - Background: `rgba(255,255,255,0.1)` (semi-transparent)
  - Border: 2px white
  - Icon: Camera icon, white, size 32

- **Weight Input:**
  - Background: `#FFFFFF` (white)
  - Border Radius: 12px
  - Input: Large text (32px), bold
  - Unit label: "lbs" (right side)

### Props
```typescript
interface WeightInputRowProps {
  weight: string;
  onWeightChange: (weight: string) => void;
  onCameraPress: () => void;
  placeholder?: string;    // Default: "Enter weight"
  unit?: string;           // Default: "lbs"
}
```

### Usage Example
```typescript
import { WeightInputRow } from '../../../components/pickup';
import { useState } from 'react';

const [weight, setWeight] = useState('');

<WeightInputRow
  weight={weight}
  onWeightChange={setWeight}
  onCameraPress={() => {
    // Open camera to capture weight from scale
    console.log('Camera pressed');
  }}
  unit="lbs"
/>
```

### Visual Preview
```
┌────────┐  ┌─────────────────────────────┐
│   📷   │  │  25.5              lbs      │
│  ⭕   │  │  [Large text input]         │
└────────┘  └─────────────────────────────┘
  80x80        White card, flex grows
  Circle       Shadow, 32px text
  White border
```

---

## 🎨 Component 3: PackagingSelector

### Purpose
Multi-select chip interface for packaging types (Boxes, Bags, Pallets)

### Visual Specs
- **Default Chip:**
  - Background: `#D1D9E6` (light gray-blue)
  - Text: `#1A2B45` (dark blue)
  - Font Weight: 500

- **Selected Chip:**
  - Background: `#FFFFFF` (white)
  - Text: `#1A2B45` (dark blue)
  - Font Weight: 700 (bold)
  - Shadow: Slight elevation

### Props
```typescript
interface PackagingSelectorProps {
  selected: string[];              // Array of selected types
  onToggle: (type: string) => void; // Toggle selection
}
```

### Usage Example
```typescript
import { PackagingSelector } from '../../../components/pickup';
import { useState } from 'react';

const [selected, setSelected] = useState<string[]>([]);

const handleToggle = (type: string) => {
  if (selected.includes(type)) {
    // Remove if already selected
    setSelected(selected.filter(t => t !== type));
  } else {
    // Add if not selected
    setSelected([...selected, type]);
  }
};

<PackagingSelector
  selected={selected}
  onToggle={handleToggle}
/>
```

### Visual Preview
```
┌─────────┐  ┌─────────┐  ┌──────────┐
│ Boxes   │  │ Bags    │  │ Pallets  │
└─────────┘  └─────────┘  └──────────┘
  Selected     Default      Default
  (White,      (#D1D9E6,    (#D1D9E6,
   Bold)       Regular)     Regular)
```

---

## 📋 Complete Usage Example

Here's how to use all three components together in a pickup screen:

```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  AccessInfoCard,
  WeightInputRow,
  PackagingSelector,
} from '../../../components/pickup';

const PickupDetailsScreen = ({ route }) => {
  const { pickupData } = route.params;

  const [weight, setWeight] = useState('');
  const [packaging, setPackaging] = useState<string[]>([]);

  const handleCameraPress = async () => {
    // TODO: Open camera to scan weight from scale
    console.log('Opening camera...');
  };

  const handlePackagingToggle = (type: string) => {
    if (packaging.includes(type)) {
      setPackaging(packaging.filter(t => t !== type));
    } else {
      setPackaging([...packaging, type]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Access Information */}
      <AccessInfoCard
        dockCode={pickupData.dockCode}
        loadingTips={pickupData.loadingTips}
      />

      {/* Weight Input with Camera */}
      <WeightInputRow
        weight={weight}
        onWeightChange={setWeight}
        onCameraPress={handleCameraPress}
      />

      {/* Packaging Type Selector */}
      <PackagingSelector
        selected={packaging}
        onToggle={handlePackagingToggle}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F6F8',
  },
});

export default PickupDetailsScreen;
```

---

## 🎨 Color Palette Reference

These components use a consistent color scheme:

```typescript
const COLORS = {
  darkBlue: '#1A2B45',      // Primary dark (AccessInfoCard background)
  lightText: '#B0B8C4',     // Light text (AccessInfoCard content)
  chipDefault: '#D1D9E6',   // Chip default background
  white: '#FFFFFF',         // White backgrounds/text
  transparent: 'rgba(255,255,255,0.1)', // Camera button
};
```

---

## 📦 File Structure

```
src/
├── components/
│   ├── pickup/
│   │   ├── AccessInfoCard.tsx       ✅ Created
│   │   ├── WeightInputRow.tsx       ✅ Created
│   │   ├── PackagingSelector.tsx    ✅ Created
│   │   └── index.ts                 ✅ Created
│   └── PickupItemsList.tsx          (Existing)
```

---

## 🧪 Testing Each Component

### Test AccessInfoCard

```typescript
// Test 1: With all data
<AccessInfoCard
  dockCode="Bay 3"
  loadingTips="Ring bell at side door"
/>

// Test 2: Dock code only
<AccessInfoCard dockCode="Loading Zone A" />

// Test 3: Loading tips only
<AccessInfoCard loadingTips="Use freight elevator" />

// Test 4: Empty state
<AccessInfoCard />
// Should show: "No access notes provided"
```

### Test WeightInputRow

```typescript
// Test 1: Basic usage
<WeightInputRow
  weight="25.5"
  onWeightChange={(w) => console.log(w)}
  onCameraPress={() => console.log('Camera!')}
/>

// Test 2: Custom unit
<WeightInputRow
  weight="11.5"
  onWeightChange={setWeight}
  onCameraPress={handleCamera}
  unit="kg"
/>

// Test 3: Custom placeholder
<WeightInputRow
  weight=""
  onWeightChange={setWeight}
  onCameraPress={handleCamera}
  placeholder="Scan or enter weight"
/>
```

### Test PackagingSelector

```typescript
// Test 1: Nothing selected
<PackagingSelector
  selected={[]}
  onToggle={(t) => console.log('Toggled:', t)}
/>

// Test 2: One selected
<PackagingSelector
  selected={['Boxes']}
  onToggle={handleToggle}
/>

// Test 3: Multiple selected
<PackagingSelector
  selected={['Boxes', 'Bags']}
  onToggle={handleToggle}
/>

// Test 4: All selected
<PackagingSelector
  selected={['Boxes', 'Bags', 'Pallets']}
  onToggle={handleToggle}
/>
```

---

## 🔧 Customization

### AccessInfoCard

To add more fields:
```typescript
// In AccessInfoCard.tsx, add new props:
interface AccessInfoCardProps {
  dockCode?: string;
  loadingTips?: string;
  contactName?: string;    // NEW
  contactPhone?: string;   // NEW
}

// Then in the component:
{contactName && (
  <View style={styles.infoRow}>
    <Text style={styles.label}>Contact:</Text>
    <Text style={styles.value}>{contactName}</Text>
  </View>
)}
```

### WeightInputRow

To change camera button size:
```typescript
// In WeightInputRow.tsx styles:
cameraButton: {
  width: 100,        // Change from 80
  height: 100,       // Change from 80
  borderRadius: 50,  // Change from 40
  // ...
}
```

### PackagingSelector

To add more packaging types:
```typescript
// In PackagingSelector.tsx:
const PACKAGING_TYPES = [
  'Boxes',
  'Bags',
  'Pallets',
  'Crates',    // NEW
  'Loose',     // NEW
];
```

---

## 🎯 Integration with Existing Code

These components can be added to your existing `PickupCompleteScreenV2`:

```typescript
// In PickupCompleteScreenV2.tsx:
import {
  AccessInfoCard,
  WeightInputRow,
  PackagingSelector,
} from '../../../components/pickup';

// Add state:
const [packaging, setPackaging] = useState<string[]>([]);

// Add to the screen (after navigation card):
<AccessInfoCard
  dockCode={data.pickupInfo?.dockCode}
  loadingTips={data.pickupInfo?.loadingTips}
/>

<WeightInputRow
  weight={weight}
  onWeightChange={setWeight}
  onCameraPress={handleWeightScan}
/>

<PackagingSelector
  selected={packaging}
  onToggle={handlePackagingToggle}
/>
```

---

## 🚀 Ready to Use!

All three components are:
- ✅ **Created** in `src/components/pickup/`
- ✅ **Styled** with StyleSheet (no external dependencies)
- ✅ **Typed** with TypeScript interfaces
- ✅ **Exported** through index.ts for easy imports
- ✅ **Documented** with usage examples

### Quick Import

```typescript
// Import all at once:
import {
  AccessInfoCard,
  WeightInputRow,
  PackagingSelector,
} from '../../../components/pickup';

// Or individually:
import AccessInfoCard from '../../../components/pickup/AccessInfoCard';
```

---

## 📸 Visual Summary

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ Access Notes                    │ │ ← AccessInfoCard
│ │ Dock Code: Bay 3                │ │   (#1A2B45)
│ │ Loading Tips: Ring bell twice   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌──┐  ┌──────────────────────────┐ │
│ │📷│  │ 25.5              lbs    │ │ ← WeightInputRow
│ └──┘  └──────────────────────────┘ │
│                                     │
│ ┌───────┐ ┌───────┐ ┌──────────┐  │
│ │Boxes  │ │ Bags  │ │ Pallets  │  │ ← PackagingSelector
│ └───────┘ └───────┘ └──────────┘  │
└─────────────────────────────────────┘
```

---

**All components are ready to use!** 🎉
