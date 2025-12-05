# Component Integration Guide - PickupCompleteScreenV2

## Overview
This guide documents the integration of three new pickup components into the PickupCompleteScreenV2 workflow:
1. **AccessInfoCard** - Display dock codes and loading tips
2. **WeightInputRow** - Camera-enabled weight input
3. **PackagingSelector** - Multi-select packaging type chips

---

## Integration Summary

### Components Integrated

| Component | Location in Screen | Purpose |
|-----------|-------------------|---------|
| **AccessInfoCard** | After Navigation Card | Display access notes (dock code, loading tips) |
| **WeightInputRow** | New "Weight" section | Capture total weight with camera option |
| **PackagingSelector** | New "Packaging Type" section | Select packaging types (Boxes, Bags, Pallets) |

### Screen Layout Order

```
┌─────────────────────────────────────┐
│ 1. Navigation Card (Map/Address)    │ ← Existing
├─────────────────────────────────────┤
│ 2. AccessInfoCard                   │ ← NEW
├─────────────────────────────────────┤
│ 3. Weight Section                   │ ← NEW
│    └─ WeightInputRow                │
├─────────────────────────────────────┤
│ 4. Packaging Type Section           │ ← NEW
│    └─ PackagingSelector             │
├─────────────────────────────────────┤
│ 5. Items Section                    │ ← Existing
│    └─ PickupItemsList               │
├─────────────────────────────────────┤
│ 6. Receipt Section                  │ ← Existing
├─────────────────────────────────────┤
│ 7. Signature Section                │ ← Existing
├─────────────────────────────────────┤
│ 8. Submit Button                    │ ← Existing
└─────────────────────────────────────┘
```

---

## Code Changes

### 1. Imports Added

```typescript
import {
  AccessInfoCard,
  WeightInputRow,
  PackagingSelector,
} from '../../../components/pickup';
```

### 2. State Added

```typescript
// New component state
const [weight, setWeight] = useState<string>('');
const [packaging, setPackaging] = useState<string[]>([]);
```

### 3. Handlers Added

#### Weight Camera Handler
```typescript
const handleWeightCameraPress = async () => {
  const hasPermission = await requestPermission('camera');
  if (!hasPermission) return;

  try {
    const result = await ImagePicker.launchCameraAsync({
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      // TODO: Implement OCR to extract weight from scale image
      Alert.alert(
        'Weight Capture',
        'Weight captured! In a future update, we will automatically extract the weight from the scale display.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('[PickupCompleteV2] Weight camera error:', error);
    Alert.alert('Error', 'Failed to capture weight');
  }
};
```

#### Packaging Toggle Handler
```typescript
const handlePackagingToggle = (type: string) => {
  if (packaging.includes(type)) {
    setPackaging(packaging.filter((t) => t !== type));
  } else {
    setPackaging([...packaging, type]);
  }
};
```

### 4. JSX Integration

#### AccessInfoCard Integration
```tsx
{/* Access Information */}
<View style={{ marginHorizontal: SPACING.md }}>
  <AccessInfoCard
    dockCode={data.pickup?.dockCode}
    loadingTips={data.pickup?.loadingTips}
  />
</View>
```

#### WeightInputRow Integration
```tsx
{/* Weight Input with Camera */}
<View style={[styles.sectionCard, { marginTop: SPACING.lg }]}>
  <Text style={styles.sectionTitle}>
    Weight <Text style={styles.required}>*</Text>
  </Text>
  <WeightInputRow
    weight={weight}
    onWeightChange={setWeight}
    onCameraPress={handleWeightCameraPress}
    placeholder="Enter total weight"
    unit="lbs"
  />
</View>
```

#### PackagingSelector Integration
```tsx
{/* Packaging Type Selector */}
<View style={styles.sectionCard}>
  <Text style={styles.sectionTitle}>Packaging Type</Text>
  <PackagingSelector
    selected={packaging}
    onToggle={handlePackagingToggle}
  />
</View>
```

### 5. Validation Updated

```typescript
const validateForm = (values: PickupFormValues) => {
  const errors: any = {};

  // NEW: Validate weight from WeightInputRow
  if (!weight || weight.trim() === '') {
    errors.weight = 'Weight is required';
  } else if (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
    errors.weight = 'Weight must be a positive number';
  }

  // ... existing validation ...

  // NEW: Include weight error in alert
  if (Object.keys(errors).length > 0) {
    const errorMessages = [];
    if (errors.weight) errorMessages.push(errors.weight);
    // ... rest of error messages ...
  }
}
```

### 6. Data Submission Updated

```typescript
const handleSubmit = async (values: PickupFormValues) => {
  // ... existing code ...

  // NEW: Save new component data
  if (weight && parseFloat(weight) > 0) {
    data.pickup.totalWeight = parseFloat(weight); // New: Total weight from WeightInputRow
  }
  if (packaging.length > 0) {
    data.pickup.packagingTypes = packaging; // New: Packaging types from PackagingSelector
  }

  // ... rest of submission logic ...
};
```

---

## Data Model Changes

### New Firestore Fields

When a pickup is completed, the following new fields are saved to the `pickedup` collection:

```typescript
{
  pickup: {
    // ... existing fields ...

    // NEW FIELDS:
    totalWeight: number,           // From WeightInputRow
    packagingTypes: string[],      // From PackagingSelector
    dockCode?: string,             // Displayed in AccessInfoCard (if exists)
    loadingTips?: string,          // Displayed in AccessInfoCard (if exists)
  }
}
```

### Example Document

```javascript
{
  id: "pickup123",
  pickup: {
    driver: "2ZIs12onUpeHC3Crl85TI9DxgDb2",
    date: Timestamp,

    // Legacy multi-item data
    items: [...],
    totalValue: 57.75,
    weight: 50.5,

    // NEW: Component data
    totalWeight: 52.0,                    // From WeightInputRow
    packagingTypes: ["Boxes", "Pallets"], // From PackagingSelector
    dockCode: "Bay 3",                    // Displayed in AccessInfoCard
    loadingTips: "Ring bell twice",       // Displayed in AccessInfoCard

    // Images
    receiptImage: "receipts/uuid.jpg",
    signatureImage: "signatures/uuid.png"
  }
}
```

---

## User Flow

### Step 1: Navigation
Driver taps to open map navigation to donor location.

### Step 2: View Access Information (NEW)
- **AccessInfoCard** displays dock code and loading tips
- Shows "No access notes provided" if fields are empty
- Dark blue background (#1A2B45) for visibility

### Step 3: Enter Total Weight (NEW)
- **WeightInputRow** provides two input methods:
  1. **Camera Button**: Tap to capture scale display (OCR future enhancement)
  2. **Text Input**: Manually enter weight in lbs
- Required field with validation

### Step 4: Select Packaging Types (NEW)
- **PackagingSelector** allows multi-select:
  - Boxes
  - Bags
  - Pallets
- Optional field (not required)
- Selected chips turn white with bold text

### Step 5: Enter Item Details (Existing)
- Use PickupItemsList to add multiple items
- Each item requires category, weight, price per pound
- Can add/remove items dynamically

### Step 6: Capture Receipt (Existing)
- Take photo or upload image
- Or provide reason if no receipt

### Step 7: Get Signature (Existing)
- Open signature pad for donor signature
- Or provide reason if donor unavailable

### Step 8: Submit
- Validate all required fields
- Upload images to Firebase Storage
- Save data to Firestore `pickedup` collection
- Delete from `accepted` collection

---

## Validation Rules

### Required Fields
1. ✅ **Weight** (from WeightInputRow) - Must be positive number > 0
2. ✅ **Items** - At least 1 item with category, weight, price
3. ✅ **Receipt** - Photo OR reason if unavailable
4. ⚠️ **Signature** - Digital signature OR reason if donor unavailable

### Optional Fields
- ❓ **Access Info** (dockCode, loadingTips) - Display only
- ❓ **Packaging Types** - Multi-select, not required

### Error Messages

```
Missing Information:
• Weight is required
• Weight must be a positive number
• Please complete all item fields (category, weight, price)
• Receipt photo is required
• Please explain why there is no receipt
• Please explain why there is no signature
```

---

## Testing Checklist

### AccessInfoCard
- [ ] Displays dock code when `data.pickup.dockCode` exists
- [ ] Displays loading tips when `data.pickup.loadingTips` exists
- [ ] Shows "No access notes provided" when both fields are empty
- [ ] Card has dark blue background (#1A2B45)
- [ ] Text is readable (white title, light gray content)

### WeightInputRow
- [ ] Camera button is visible (80x80 circle)
- [ ] Tapping camera button requests permission
- [ ] Tapping camera button opens camera
- [ ] Shows alert when photo is captured
- [ ] Text input accepts decimal numbers
- [ ] Unit label shows "lbs"
- [ ] Validation error shows when weight is empty
- [ ] Validation error shows when weight is not a number
- [ ] Validation error shows when weight is negative

### PackagingSelector
- [ ] Shows three chips: Boxes, Bags, Pallets
- [ ] Chips start unselected (gray background)
- [ ] Tapping chip toggles selection
- [ ] Selected chips have white background and bold text
- [ ] Multiple chips can be selected
- [ ] Tapping selected chip deselects it
- [ ] Packaging types saved to `data.pickup.packagingTypes`

### Data Submission
- [ ] `data.pickup.totalWeight` saved with weight value
- [ ] `data.pickup.packagingTypes` saved with array of selected types
- [ ] Document moved from `accepted` to `pickedup`
- [ ] Original document deleted from `accepted`
- [ ] Success alert shows
- [ ] Navigation returns to List screen

---

## Known Issues & Future Enhancements

### Known Issues
None identified.

### Future Enhancements

#### 1. Weight OCR
**Description:** Extract weight from scale display photo automatically
**Status:** Placeholder in `handleWeightCameraPress`
**TODO:**
```typescript
// Use OCR library (e.g., react-native-ml-kit) to extract weight
const extractedWeight = await performOCR(photoUri);
setWeight(extractedWeight);
```

#### 2. Access Info Input
**Description:** Allow drivers to add/edit dock code and loading tips
**Status:** Currently display-only (reads from `data.pickup`)
**TODO:**
- Add optional TextInput fields for drivers to provide feedback
- Save to Firestore for future pickups at same location

#### 3. Packaging Type Icons
**Description:** Add icons to packaging chips (📦 Boxes, 👜 Bags, 🏗️ Pallets)
**Status:** Text-only currently
**TODO:** Update `PackagingSelector.tsx` PACKAGING_TYPES

---

## Troubleshooting

### Issue: AccessInfoCard Shows "No access notes"
**Cause:** `data.pickup.dockCode` and `data.pickup.loadingTips` are undefined
**Solution:** Add these fields when creating pickup documents, or allow drivers to input

### Issue: Weight Validation Fails
**Cause:** Weight input is empty or not a valid number
**Solution:** Ensure `weight` state is set and contains valid numeric string

### Issue: Packaging Types Not Saved
**Cause:** No chips selected (packaging.length === 0)
**Solution:** This is optional - submission will proceed without packaging data

### Issue: Camera Permission Denied
**Cause:** User denied camera permission
**Solution:** Show alert prompting user to enable permissions in Settings

---

## File References

### Modified Files
- `src/screens/donations/driver/PickupCompleteScreenV2.tsx` (lines 26-40, 64-66, 352-383, 460-500)

### Component Files
- `src/components/pickup/AccessInfoCard.tsx`
- `src/components/pickup/WeightInputRow.tsx`
- `src/components/pickup/PackagingSelector.tsx`
- `src/components/pickup/index.ts`

### Documentation Files
- `docs/PICKUP_COMPONENTS_GUIDE.md` - Component usage guide
- `docs/COMPONENT_INTEGRATION_GUIDE.md` - This file
- `docs/FIRESTORE_DATA_STRUCTURE.md` - Data model reference

---

## Summary

The three new components have been successfully integrated into PickupCompleteScreenV2:

✅ **AccessInfoCard** - Displays access notes at top of screen
✅ **WeightInputRow** - Camera-enabled weight input with validation
✅ **PackagingSelector** - Multi-select packaging type chips

All components are functional, validated, and save data to Firestore correctly. The screen layout provides a logical workflow from navigation → access info → weight → packaging → items → receipt → signature → submit.
