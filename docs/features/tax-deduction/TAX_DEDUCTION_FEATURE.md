# Tax Deduction Feature - Complete Implementation

## ✅ Feature Complete

The pickup item component now supports tax deduction calculations by tracking both quantity and unit value for each packaging type, plus total estimated value.

---

## Overview

**Purpose:** Enable the Colombian Food Bank to generate tax certificates for donors by tracking the monetary value of donated items.

**Key Addition:** Unit Price tracking for each packaging type, with auto-calculated total estimated value.

---

## Changes Summary

### 1. Data Structure Updates

**File:** `src/types/pickupItem.types.ts`

#### Added Fields:

```typescript
export interface PackagingDetail {
  type: PackagingType;
  quantity: string;     // Count of packages
  unitPrice: string;    // ✅ NEW: Price per unit in $
}

export interface PickupItem {
  id: string;
  category: DonationCategory | '';
  packaging: PackagingDetail[];
  totalWeight: string;  // Weight in lbs
  totalValue: string;   // ✅ NEW: Total estimated value in $
}

export interface PickupItemData {
  category: DonationCategory;
  packaging: {
    type: PackagingType;
    quantity: number;
    unitPrice: number;  // ✅ NEW
  }[];
  totalWeight: number;
  totalValue: number;   // ✅ NEW
}
```

---

### 2. Component Updates

**File:** `src/components/PickupItemsListV3.tsx`

#### UI Changes:

**Two-Column Packaging Layout:**
```
Before (Weight-Only):
┌────────────────────────────┐
│ Boxes              [trash] │
│                            │
│ Quantity                   │
│ [________]                 │ ← 50% width
└────────────────────────────┘

After (Tax Deduction):
┌────────────────────────────┐
│ Boxes              [trash] │
│                            │
│ Quantity    Unit Value ($) │
│ [_____]     $[_____]       │ ← 50% each
└────────────────────────────┘
```

**Total Value Field Added:**
```
┌────────────────────────────────────┐
│ Total Weight *                     │
│ [___________] lbs                  │ ← Orange (#F38020)
│                                    │
│ 💵 Total Est. Value ($) *          │
│ $[___________]                     │ ← Green (#22C55E)
│ Auto-calculated (editable)         │
└────────────────────────────────────┘
```

#### New Functions:

```typescript
// Auto-calculate total value when packaging changes
const calculateTotalValue = (itemId: string, packaging: PackagingDetail[]) => {
  const totalValue = packaging.reduce((sum, pkg) => {
    const qty = parseFloat(pkg.quantity) || 0;
    const price = parseFloat(pkg.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);

  onUpdateItem(itemId, 'totalValue', totalValue.toFixed(2));
};

// Handle packaging field changes (quantity or unit price)
const handlePackagingFieldChange = (
  itemId: string,
  packageIndex: number,
  field: 'quantity' | 'unitPrice',
  value: string
) => {
  // Update packaging array
  const updatedPackaging = [...item.packaging];
  updatedPackaging[packageIndex] = {
    ...updatedPackaging[packageIndex],
    [field]: value,
  };

  onUpdateItem(itemId, 'packaging', updatedPackaging);

  // Recalculate total value
  calculateTotalValue(itemId, updatedPackaging);
};

// Allow manual override of total value
const handleTotalValueChange = (itemId: string, value: string) => {
  onUpdateItem(itemId, 'totalValue', value);
};
```

---

### 3. Styling Details

**Two-Column Input Row:**
```typescript
twoColumnRow: {
  flexDirection: 'row',
  gap: 12,  // Space between columns
},
columnInput: {
  flex: 1,  // Equal width (50% each)
},
```

**Unit Price Input with $ Prefix:**
```typescript
priceInputWrapper: {
  position: 'relative',
},
priceInput: {
  paddingLeft: 24,  // Make room for $ sign
},
dollarSign: {
  position: 'absolute',
  left: 12,
  top: 12,
  fontSize: 16,
  fontWeight: '600',
  color: '#1A2B45',
  zIndex: 1,
},
```

**Total Value Input (Green Theme):**
```typescript
totalValueHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
},
totalValueLabel: {
  fontSize: 16,
  fontWeight: '700',
  color: '#22C55E',  // Green
},
totalValueInputWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F0FDF4',  // Light green background
  borderRadius: 8,
  paddingHorizontal: 16,
  borderWidth: 2,
  borderColor: '#22C55E',  // Green border
},
dollarSignLarge: {
  fontSize: 24,
  fontWeight: '700',
  color: '#22C55E',
  marginRight: 8,
},
totalValueInput: {
  flex: 1,
  fontSize: 24,
  fontWeight: '700',
  color: '#22C55E',  // Green text
  paddingVertical: 16,
},
autoCalcNote: {
  fontSize: 11,
  color: '#666',
  fontStyle: 'italic',
  marginTop: 4,
},
```

---

### 4. Parent Screen Updates

**File:** `src/screens/donations/driver/PickupCompleteScreenV2.tsx`

#### State Initialization:
```typescript
const [items, setItems] = useState<PickupItem[]>([
  {
    id: uuidv4(),
    category: '',
    packaging: [],
    totalWeight: '',
    totalValue: ''  // ✅ NEW
  },
]);
```

#### Submit Handler:
```typescript
const pickupItems: PickupItemData[] = items.map((item) => {
  const packagingData = item.packaging.map((pkg) => ({
    type: pkg.type,
    quantity: parseFloat(pkg.quantity) || 0,
    unitPrice: parseFloat(pkg.unitPrice) || 0,  // ✅ NEW
  }));

  const totalWeight = parseFloat(item.totalWeight) || 0;
  const totalValue = parseFloat(item.totalValue) || 0;  // ✅ NEW

  return {
    category: item.category as DonationCategory,
    packaging: packagingData,
    totalWeight,
    totalValue,  // ✅ NEW
  };
});

// Calculate totals for entire pickup
const totalWeight = pickupItems.reduce((sum, item) => sum + item.totalWeight, 0);
const totalValue = pickupItems.reduce((sum, item) => sum + item.totalValue, 0);  // ✅ NEW

// Update pickup data
data.pickup.totalValue = totalValue;  // ✅ Total estimated value in $
data.pickup.weight = totalWeight;     // Total weight in lbs
```

#### Validation:
```typescript
// Validate unit price (NEW)
if (!pkg.unitPrice || pkg.unitPrice.trim() === '') {
  errors[`item_${item.id}_pkg_${pkgIndex}_unitPrice`] = 'Unit price is required';
  hasItemErrors = true;
} else if (isNaN(parseFloat(pkg.unitPrice)) || parseFloat(pkg.unitPrice) < 0) {
  errors[`item_${item.id}_pkg_${pkgIndex}_unitPrice`] = 'Unit price must be non-negative';
  hasItemErrors = true;
}

// Validate total value (NEW)
if (!item.totalValue || item.totalValue.trim() === '') {
  errors[`item_${item.id}_totalValue`] = 'Total value is required';
  hasItemErrors = true;
} else if (isNaN(parseFloat(item.totalValue)) || parseFloat(item.totalValue) < 0) {
  errors[`item_${item.id}_totalValue`] = 'Total value must be non-negative';
  hasItemErrors = true;
}
```

---

## Visual Design

### Color Scheme

| Field | Color | Purpose |
|-------|-------|---------|
| **Total Weight** | Orange (#F38020) | Physical metric |
| **Total Est. Value** | Green (#22C55E) | Financial metric |
| **Packaging Chips** | Blue (#4285F4) | Selection state |
| **Trash Button** | Red (#df0b37) | Destructive action |

### Icons

- **Total Weight:** No icon (just "lbs" suffix)
- **Total Est. Value:** 💵 `cash-multiple` icon (green)
- **Remove Packaging:** 🗑️ `trash-can-outline` icon (red)

---

## User Flow Example

### Step 1: Select Packaging Type
User taps "Bags" chip → Chip turns dark blue, detail row appears

### Step 2: Enter Quantity and Unit Price
```
Bags                           [🗑️]

Quantity         Unit Value ($)
[  5  ]          $[  10.00  ]
```

### Step 3: Auto-Calculation
- Component calculates: 5 × $10.00 = $50.00
- Updates "Total Est. Value ($)" field to $50.00
- User can manually override if needed

### Step 4: Add More Packaging
User taps "Boxes" chip:
```
Boxes                          [🗑️]

Quantity         Unit Value ($)
[  10  ]         $[  15.00  ]
```
- Component calculates: 10 × $15.00 = $150.00
- Updates "Total Est. Value ($)" to $200.00 ($50 + $150)

### Step 5: Enter Total Weight
User manually enters total weight:
```
Total Weight *
[  75  ] lbs
```

### Step 6: Review Total Value
```
💵 Total Est. Value ($) *
$[  200.00  ]
Auto-calculated (editable)
```

---

## Data Flow Example

### User Input:
```
Item 1: 🥗 Produce
Packaging:
  - Bags: Qty 5, Unit Price $10.00
  - Boxes: Qty 10, Unit Price $15.00
Total Weight: 75 lbs
Total Est. Value: $200.00 (auto-calculated)

Item 2: 🥛 Dairy
Packaging:
  - Pallets: Qty 2, Unit Price $50.00
Total Weight: 120 lbs
Total Est. Value: $100.00 (auto-calculated)
```

### Saved to Firestore:
```typescript
{
  pickup: {
    items: [
      {
        category: "produce",
        packaging: [
          { type: "Bags", quantity: 5, unitPrice: 10.00 },
          { type: "Boxes", quantity: 10, unitPrice: 15.00 }
        ],
        totalWeight: 75,
        totalValue: 200.00
      },
      {
        category: "dairy",
        packaging: [
          { type: "Pallets", quantity: 2, unitPrice: 50.00 }
        ],
        totalWeight: 120,
        totalValue: 100.00
      }
    ],
    totalValue: 300.00,  // Sum of item values
    weight: 195,         // Sum of item weights
    category: "mixed"    // Multiple items
  }
}
```

### For Tax Certificate:
```
Donation Receipt - Colombian Food Bank
Date: 2025-01-15

Items Donated:
1. Produce (5 Bags, 10 Boxes) - 75 lbs - Est. Value: $200.00
2. Dairy (2 Pallets) - 120 lbs - Est. Value: $100.00

Total Donation:
Weight: 195 lbs
Estimated Value: $300.00

This donation is tax deductible according to IRS regulations.
Donor Signature: [Signature]
```

---

## Key Features

### ✅ All Requirements Met

1. **TWO-COLUMN PACKAGING INPUT ROW**
   - ✅ Quantity input (left column, 50% width)
   - ✅ Unit Value ($) input (right column, 50% width)
   - ✅ Both inputs use numeric keyboard
   - ✅ Unit Value has $ prefix inside input

2. **TOTAL EST. VALUE FIELD**
   - ✅ Auto-calculated from (Quantity × Unit Price) for all packaging
   - ✅ Editable (user can override calculation)
   - ✅ Green color scheme (#22C55E)
   - ✅ Money icon (💵 `cash-multiple`)
   - ✅ "Auto-calculated (editable)" note

3. **STYLING ADJUSTMENTS**
   - ✅ Side-by-side inputs (50% width each)
   - ✅ $ prefix in Unit Price input
   - ✅ $ prefix in Total Value input
   - ✅ Green theme for monetary fields
   - ✅ Proper spacing (12px gap between columns)

4. **DATA STRUCTURE**
   - ✅ Updated types to include `unitPrice`
   - ✅ Updated types to include `totalValue`
   - ✅ State captures all new data
   - ✅ Validation for all new fields
   - ✅ Proper number parsing for submission

---

## Testing Checklist

### Packaging Input
- [ ] Select packaging type
- [ ] Enter quantity
- [ ] Enter unit price
- [ ] Verify $ prefix displays
- [ ] Both inputs show numeric keyboard

### Auto-Calculation
- [ ] Enter quantity and price for one packaging
- [ ] Verify total value updates
- [ ] Add second packaging type
- [ ] Verify total value adds both
- [ ] Remove packaging type
- [ ] Verify total value recalculates

### Manual Override
- [ ] Enter values that auto-calculate to $100
- [ ] Manually change total value to $150
- [ ] Verify manual value persists
- [ ] Change packaging quantity
- [ ] Verify total recalculates (overrides manual)

### Validation
- [ ] Try to submit without unit price
- [ ] See validation error
- [ ] Try to submit without total value
- [ ] See validation error
- [ ] Enter negative unit price
- [ ] See validation error

### Visual Design
- [ ] Total Weight shows orange
- [ ] Total Est. Value shows green
- [ ] Money icon displays
- [ ] "Auto-calculated (editable)" note shows
- [ ] $ prefix visible in both unit price and total value

---

## Files Modified

### Types
- ✅ `src/types/pickupItem.types.ts` - Added `unitPrice` and `totalValue`

### Components
- ✅ `src/components/PickupItemsListV3.tsx` - Complete refactor with:
  - Two-column packaging input
  - Auto-calculation logic
  - Total value field
  - Green styling for monetary values

### Screens
- ✅ `src/screens/donations/driver/PickupCompleteScreenV2.tsx` - Updated:
  - State initialization
  - Submit handler
  - Validation logic

### Documentation
- ✅ `TAX_DEDUCTION_FEATURE.md` - This file

---

## Technical Details

### Auto-Calculation Trigger Points

The `calculateTotalValue` function is called when:
1. User changes quantity in any packaging row
2. User changes unit price in any packaging row
3. User removes a packaging type (chip toggle or trash button)

### Calculation Formula

```typescript
totalValue = Σ (packaging.quantity × packaging.unitPrice)
```

For example:
- Bags: 5 × $10 = $50
- Boxes: 10 × $15 = $150
- **Total: $200**

### Editable Auto-Calculated Field

The Total Est. Value field is:
- **Auto-calculated** by default (updates when packaging changes)
- **Editable** by user (can be manually overridden)
- **Re-calculated** if packaging changes after manual override

This allows drivers to:
1. Use auto-calculation for standard cases
2. Override for special situations (e.g., discounted values)
3. Have flexibility for accurate tax documentation

---

## Benefits

### For Colombian Food Bank:
- ✅ Accurate tracking of donation monetary value
- ✅ Automated tax certificate generation
- ✅ IRS-compliant donation records
- ✅ Better donor relationships (proper tax deductions)

### For Donors:
- ✅ Receive tax deduction certificates
- ✅ Accurate valuation of donations
- ✅ Simplified tax filing

### For Drivers:
- ✅ Clear interface for value entry
- ✅ Auto-calculation reduces errors
- ✅ Manual override for flexibility
- ✅ Visual distinction (green = money, orange = weight)

---

## Summary

✅ **Tax deduction feature complete!**

The app now tracks:
- 📦 **Quantity** of each packaging type
- 💵 **Unit Value** of each packaging type
- ⚖️ **Total Weight** (manual entry)
- 💰 **Total Estimated Value** (auto-calculated, editable)

**Visual Design:**
- Green color scheme for all monetary fields
- $ prefix for clarity
- Money icon for recognition
- "Auto-calculated (editable)" note

**Data Captured:**
- Per-item packaging with quantity and unit price
- Per-item total weight and value
- Pickup-level total weight and value
- Complete data for tax certificate generation

The Colombian Food Bank can now generate accurate tax deduction certificates for donors based on the captured data! 🎉

---

## Next Steps

1. **Test the UI** in the simulator
2. **Verify auto-calculation** with various inputs
3. **Test manual override** functionality
4. **Validate data submission** to Firestore
5. **Generate sample tax certificate** using the captured data

The Metro bundler should hot-reload with these changes automatically!
