# Weight-Based Refactor - Complete Implementation

## ✅ Refactoring Complete

The pickup item component has been completely refactored to track **weight (lbs)** instead of price. All price-related fields have been removed.

---

## Changes Summary

### 1. Data Structure Changes

**File:** `src/types/pickupItem.types.ts`

#### Before (Price-Based):
```typescript
export interface PackagingDetail {
  type: PackagingType;
  quantity: string;     // Count
  pricePerUnit: string; // $ per unit
  subtotal: number;     // quantity × price
}

export interface PickupItem {
  id: string;
  category: DonationCategory | '';
  packaging: PackagingDetail[];
  totalPrice: number;   // Sum of subtotals
}

export interface PickupItemData {
  category: DonationCategory;
  packaging: {
    type: PackagingType;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
  }[];
  totalPrice: number;
}
```

#### After (Weight-Based):
```typescript
export interface PackagingDetail {
  type: PackagingType;
  quantity: string;     // Count of packages only
}

export interface PickupItem {
  id: string;
  category: DonationCategory | '';
  packaging: PackagingDetail[];
  totalWeight: string;  // Manual weight input (lbs)
}

export interface PickupItemData {
  category: DonationCategory;
  packaging: {
    type: PackagingType;
    quantity: number;   // Count of packages
  }[];
  totalWeight: number;  // Weight in lbs
}
```

**Key Changes:**
- ❌ Removed `pricePerUnit` field
- ❌ Removed `subtotal` field
- ✅ Added `totalWeight` field (manual input)
- ✅ Packaging now only tracks quantity (count)

---

### 2. Component Refactoring

**File:** `src/components/PickupItemsListV3.tsx`

#### UI Changes:

**Removed:**
- ❌ Price/Unit input field
- ❌ Subtotal display
- ❌ Multiplication (×) and equals (=) symbols
- ❌ Auto-calculated totals from packaging

**Added:**
- ✅ Trash icon button to remove packaging types
- ✅ Large "Total Weight" input field at bottom
- ✅ Manual weight entry (numeric keyboard)
- ✅ "lbs" unit label next to weight input

**Improved:**
- ✅ Simplified packaging detail rows (quantity only)
- ✅ Left-aligned quantity input (50% width)
- ✅ Red trash can icon with light red background
- ✅ Prominent total weight input with blue border

#### Code Changes:

```typescript
// OLD: handlePackagingChange with price calculation
const handlePackagingChange = (
  itemId: string,
  packageIndex: number,
  field: 'quantity' | 'pricePerUnit',
  value: string
) => {
  // Calculate subtotal: quantity × price
  updatedPackaging[packageIndex].subtotal = quantity * price;
};

// NEW: handlePackagingQuantityChange (quantity only)
const handlePackagingQuantityChange = (
  itemId: string,
  packageIndex: number,
  value: string
) => {
  const updatedPackaging = [...item.packaging];
  updatedPackaging[packageIndex] = {
    ...updatedPackaging[packageIndex],
    quantity: value,
  };
  onUpdateItem(itemId, 'packaging', updatedPackaging);
};

// NEW: handleTotalWeightChange
const handleTotalWeightChange = (itemId: string, value: string) => {
  onUpdateItem(itemId, 'totalWeight', value);
};

// NEW: handleRemovePackaging (trash button)
const handleRemovePackaging = (itemId: string, packageIndex: number) => {
  const item = items.find((i) => i.id === itemId);
  if (!item) return;

  console.log('[PickupItemsListV3] Removing packaging at index:', packageIndex);
  const updatedPackaging = item.packaging.filter((_, idx) => idx !== packageIndex);
  onUpdateItem(itemId, 'packaging', updatedPackaging);
};
```

---

### 3. Parent Screen Updates

**File:** `src/screens/donations/driver/PickupCompleteScreenV2.tsx`

#### State Initialization:
```typescript
// Before
const [items, setItems] = useState<PickupItem[]>([
  {
    id: uuidv4(),
    category: '',
    packaging: [],
    totalPrice: 0  // ❌ Old
  },
]);

// After
const [items, setItems] = useState<PickupItem[]>([
  {
    id: uuidv4(),
    category: '',
    packaging: [],
    totalWeight: ''  // ✅ New
  },
]);
```

#### Submit Handler:
```typescript
// Before: Price-based calculation
const pickupItems: PickupItemData[] = items.map((item) => {
  const packagingData = item.packaging.map((pkg) => ({
    type: pkg.type,
    quantity: parseFloat(pkg.quantity),
    pricePerUnit: parseFloat(pkg.pricePerUnit),  // ❌
    subtotal: parseFloat(pkg.quantity) * parseFloat(pkg.pricePerUnit),  // ❌
  }));

  const totalPrice = packagingData.reduce((sum, pkg) => sum + pkg.subtotal, 0);  // ❌

  return {
    category: item.category as DonationCategory,
    packaging: packagingData,
    totalPrice,  // ❌
  };
});

// After: Weight-based
const pickupItems: PickupItemData[] = items.map((item) => {
  const packagingData = item.packaging.map((pkg) => ({
    type: pkg.type,
    quantity: parseFloat(pkg.quantity) || 0,  // ✅ Quantity only
  }));

  const totalWeight = parseFloat(item.totalWeight) || 0;  // ✅ Manual weight

  return {
    category: item.category as DonationCategory,
    packaging: packagingData,
    totalWeight,  // ✅ Weight instead of price
  };
});

// Calculate total weight (sum of all items)
const totalWeight = pickupItems.reduce((sum, item) => sum + item.totalWeight, 0);

// Update pickup data
data.pickup.items = pickupItems;
data.pickup.totalValue = totalWeight;  // ✅ Now represents weight
data.pickup.weight = totalWeight;
```

#### Validation Updates:
```typescript
// Before: Validate price and subtotal
item.packaging.forEach((pkg, pkgIndex) => {
  // Validate quantity
  if (!pkg.quantity || pkg.quantity.trim() === '') {
    errors[`item_${item.id}_pkg_${pkgIndex}_quantity`] = 'Quantity is required';
  }

  // Validate price  ❌
  if (!pkg.pricePerUnit || pkg.pricePerUnit.trim() === '') {
    errors[`item_${item.id}_pkg_${pkgIndex}_price`] = 'Price is required';
  }
});

// After: Validate quantity and total weight
item.packaging.forEach((pkg, pkgIndex) => {
  // Validate quantity only
  if (!pkg.quantity || pkg.quantity.trim() === '') {
    errors[`item_${item.id}_pkg_${pkgIndex}_quantity`] = 'Quantity is required';
    hasItemErrors = true;
  } else if (isNaN(parseFloat(pkg.quantity)) || parseFloat(pkg.quantity) <= 0) {
    errors[`item_${item.id}_pkg_${pkgIndex}_quantity`] = 'Quantity must be positive';
    hasItemErrors = true;
  }
});

// Validate total weight  ✅
if (!item.totalWeight || item.totalWeight.trim() === '') {
  errors[`item_${item.id}_totalWeight`] = 'Total weight is required';
  hasItemErrors = true;
} else if (isNaN(parseFloat(item.totalWeight)) || parseFloat(item.totalWeight) <= 0) {
  errors[`item_${item.id}_totalWeight`] = 'Total weight must be positive';
  hasItemErrors = true;
}
```

---

## UI Layout (After Refactor)

```
┌────────────────────────────────────────────┐
│ Item 1                                [×]  │
├────────────────────────────────────────────┤
│ Category                                   │
│ ┌────────────────────────────────────────┐ │
│ │ 🥗 Produce                          ▼ │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Packaging Types                            │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│ │  Boxes  │  │  Bags   │  │ Pallets │    │
│ └─────────┘  └─────────┘  └─────────┘    │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ Boxes                          [🗑️] │   │
│ │                                      │   │
│ │ Quantity                             │   │
│ │ [____]                               │   │ ← 50% width, left-aligned
│ └──────────────────────────────────────┘   │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ Bags                           [🗑️] │   │
│ │                                      │   │
│ │ Quantity                             │   │
│ │ [____]                               │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ ────────────────────────────────────────   │
│                                            │
│ Total Weight *                             │
│ ┌────────────────────────────────────────┐ │
│ │           [_________]         lbs      │ │ ← Large, prominent
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

**Visual Details:**
- **Category:** Light gray background (#F5F6F8), chevron down
- **Packaging Chips:** Light blue unselected (#E3F2FD), dark blue selected (#4285F4)
- **Quantity Input:** White background, left-aligned, 50% width
- **Trash Button:** Light red background (#FFE5E5), red trash icon (#df0b37)
- **Total Weight:** Large input (24px font), blue border (#4285F4), orange text (#F38020)

---

## Key Features

### ✅ Requirements Met

1. **REPLACE PRICE WITH WEIGHT**
   - ✅ Removed "Price/Unit" and "Subtotal" fields
   - ✅ Only track quantity (count) for each packaging type
   - ✅ Added manual "Total Weight" input at bottom
   - ✅ Driver enters total weight manually (not calculated)

2. **MAKE PACKAGING REMOVABLE**
   - ✅ Red trash icon on each packaging row
   - ✅ Tapping removes packaging type from array
   - ✅ Also works via chip toggle (tap selected chip)

3. **DATA STRUCTURE UPDATE**
   - ✅ Matches exact specification
   - ✅ Packaging only has `type` and `quantity`
   - ✅ Item has `category`, `packaging[]`, and `totalWeight`

4. **UI POLISH**
   - ✅ Large, easy-to-tap Total Weight input (24px font, full width)
   - ✅ Quantity input left-aligned (50% width)
   - ✅ Numeric keyboard for all inputs (`keyboardType="numeric"`)
   - ✅ Clean layout with proper spacing

---

## Testing Checklist

### Category Selection
- [ ] Tap category → modal opens
- [ ] Select category → displays correctly
- [ ] Validation error if category not selected

### Packaging Selection
- [ ] Tap chip → turns dark blue and shows detail row
- [ ] Tap selected chip → removes packaging and row disappears
- [ ] Trash button → removes packaging row

### Packaging Quantity
- [ ] Enter quantity in packaging row
- [ ] Numeric keyboard appears
- [ ] Validation error if quantity empty or ≤ 0

### Total Weight
- [ ] Large input field visible at bottom
- [ ] Numeric keyboard appears when tapped
- [ ] "lbs" unit label displays
- [ ] Blue border makes it prominent
- [ ] Validation error if weight empty or ≤ 0

### Remove Packaging
- [ ] Click trash icon → packaging row disappears
- [ ] Chip returns to light blue (unselected)
- [ ] Can re-add same packaging type

### Submit
- [ ] All validations work correctly
- [ ] Data saved with correct structure
- [ ] Total weight calculated as sum of all item weights

---

## Data Flow Example

**User Input:**
```
Item 1:
- Category: 🥗 Produce
- Packaging:
  - Boxes: quantity = 10
  - Bags: quantity = 5
- Total Weight: 150 lbs

Item 2:
- Category: 🥛 Dairy
- Packaging:
  - Pallets: quantity = 2
- Total Weight: 80 lbs
```

**Saved to Firestore:**
```typescript
{
  pickup: {
    items: [
      {
        category: "produce",
        packaging: [
          { type: "Boxes", quantity: 10 },
          { type: "Bags", quantity: 5 }
        ],
        totalWeight: 150
      },
      {
        category: "dairy",
        packaging: [
          { type: "Pallets", quantity: 2 }
        ],
        totalWeight: 80
      }
    ],
    totalValue: 230,  // Sum of weights (150 + 80)
    weight: 230,      // Total weight
    category: "mixed" // Multiple items
  }
}
```

---

## Files Modified

### Types
- ✅ `src/types/pickupItem.types.ts` - Updated data interfaces

### Components
- ✅ `src/components/PickupItemsListV3.tsx` - Complete refactor

### Screens
- ✅ `src/screens/donations/driver/PickupCompleteScreenV2.tsx` - Updated state and validation

### Documentation
- ✅ `WEIGHT_BASED_REFACTOR.md` - This file

---

## Breaking Changes

### Data Structure
The `PickupItem` and `PickupItemData` interfaces have changed:
- **Removed fields:** `pricePerUnit`, `subtotal`, `totalPrice`
- **Added fields:** `totalWeight`

### Component Props
No breaking changes to component props - `PickupItemsListV3` uses same interface:
```typescript
interface PickupItemsListProps {
  items: PickupItem[];
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, field: keyof PickupItem, value: any) => void;
  errors: any;
}
```

### Migration Notes
If you have existing data with the old structure:
1. Old `totalPrice` field → map to new `totalWeight` field
2. Old packaging `pricePerUnit` and `subtotal` → discard
3. Old packaging `quantity` → keep as-is

---

## Summary

✅ **All Requirements Met:**
1. ✅ Price tracking completely removed
2. ✅ Only weight (lbs) is tracked
3. ✅ Packaging types are removable (trash icon + chip toggle)
4. ✅ Total weight is manual input (not calculated)
5. ✅ Clean, polished UI
6. ✅ Numeric keyboards for all inputs
7. ✅ Data structure matches specification

**Before:** Price-based system with quantity × price = subtotal
**After:** Weight-based system with manual total weight input

**The app is now focused on tracking donation weight, not dollar value.** 🎉

---

## Next Steps

1. **Test the refactored UI** in the simulator
2. **Verify data flow** from input to Firestore
3. **Check validation** for all fields
4. **Test edge cases** (remove all packaging, empty fields, etc.)

The Metro bundler should hot-reload with these changes automatically!
