# New Packaging Workflow - PickupCompleteScreenV2

## Overview

The pickup workflow has been completely redesigned to support **per-item packaging details** with **quantity-based pricing**.

---

## What Changed

### Removed Components
- ❌ **WeightInputRow** - Standalone weight input removed
- ❌ **PackagingSelector** - Standalone packaging chips removed

### New Structure
- ✅ **Packaging integrated into each item**
- ✅ **Multiple packaging types per item** (Boxes, Bags, Pallets)
- ✅ **Quantity × Price calculation** for each packaging type
- ✅ **Auto-calculated subtotals** and item totals

---

## New Data Model

### PickupItem (UI Model)
```typescript
interface PickupItem {
  id: string;
  category: DonationCategory | '';
  packaging: PackagingDetail[];  // NEW: Array of packaging types
  totalPrice: number;            // NEW: Sum of all packaging subtotals
}

interface PackagingDetail {
  type: 'Boxes' | 'Bags' | 'Pallets';
  quantity: string;      // User input
  pricePerUnit: string;  // User input
  subtotal: number;      // Calculated: quantity × pricePerUnit
}
```

### PickupItemData (Firestore Model)
```typescript
interface PickupItemData {
  category: DonationCategory;
  packaging: {
    type: 'Boxes' | 'Bags' | 'Pallets';
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
  }[];
  totalPrice: number;
}
```

---

## User Workflow

### Step 1: Select Category
Driver selects food category (Produce, Dairy, Bakery, etc.)

### Step 2: Add Packaging Types
Driver taps "+ Boxes", "+ Bags", or "+ Pallets" to add packaging

### Step 3: Enter Quantities and Prices
For each packaging type:
- Enter quantity (e.g., 5 boxes)
- Enter price per unit (e.g., $10/box)
- **Subtotal auto-calculates** (5 × $10 = $50)

### Step 4: View Item Total
**Item Total** shows sum of all packaging subtotals

### Step 5: Add More Items (Optional)
Tap "Add Another Item" to add items with different categories/packaging

### Step 6: Submit
Total value = sum of all item totals

---

## Example Workflow

### Example 1: Single Item, Multiple Packaging Types

**Item 1: Produce**
- Category: 🥗 Produce
- Packaging:
  - Boxes: 5 × $10.00 = $50.00
  - Bags: 10 × $2.50 = $25.00
- **Item Total: $75.00**

**Saved to Firestore:**
```javascript
{
  pickup: {
    items: [
      {
        category: "produce",
        packaging: [
          { type: "Boxes", quantity: 5, pricePerUnit: 10.00, subtotal: 50.00 },
          { type: "Bags", quantity: 10, pricePerUnit: 2.50, subtotal: 25.00 }
        ],
        totalPrice: 75.00
      }
    ],
    totalValue: 75.00,
    weight: 15  // Total quantity from all packaging
  }
}
```

### Example 2: Multiple Items, Different Packaging

**Item 1: Produce**
- Category: 🥗 Produce
- Packaging:
  - Boxes: 3 × $12.00 = $36.00
- **Item Total: $36.00**

**Item 2: Dairy**
- Category: 🥛 Dairy
- Packaging:
  - Pallets: 2 × $50.00 = $100.00
  - Bags: 5 × $3.00 = $15.00
- **Item Total: $115.00**

**Item 3: Bakery**
- Category: 🍞 Bakery
- Packaging:
  - Bags: 20 × $1.50 = $30.00
- **Item Total: $30.00**

**Pickup Total: $181.00**

**Saved to Firestore:**
```javascript
{
  pickup: {
    items: [
      {
        category: "produce",
        packaging: [{ type: "Boxes", quantity: 3, pricePerUnit: 12.00, subtotal: 36.00 }],
        totalPrice: 36.00
      },
      {
        category: "dairy",
        packaging: [
          { type: "Pallets", quantity: 2, pricePerUnit: 50.00, subtotal: 100.00 },
          { type: "Bags", quantity: 5, pricePerUnit: 3.00, subtotal: 15.00 }
        ],
        totalPrice: 115.00
      },
      {
        category: "bakery",
        packaging: [{ type: "Bags", quantity: 20, pricePerUnit: 1.50, subtotal: 30.00 }],
        totalPrice: 30.00
      }
    ],
    totalValue: 181.00,
    weight: 30  // Total: 3 + 2 + 5 + 20 = 30 units
  }
}
```

---

## Visual Design

### Item Card Layout

```
┌─────────────────────────────────────────────────────┐
│ Item 1                                          [×] │
├─────────────────────────────────────────────────────┤
│ Category: 🥗 Produce                                │
├─────────────────────────────────────────────────────┤
│ Packaging Types:                                    │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Boxes                                       [×] │ │
│ │                                                 │ │
│ │ Quantity:  [5    ]  ×  Price/Unit: [$10.00  ]  │ │
│ │                                                 │ │
│ │ = Subtotal: $50.00                              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Bags                                        [×] │ │
│ │                                                 │ │
│ │ Quantity:  [10   ]  ×  Price/Unit: [$2.50   ]  │ │
│ │                                                 │ │
│ │ = Subtotal: $25.00                              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Add: [+ Pallets]                                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Item Total:                              $75.00    │
└─────────────────────────────────────────────────────┘
```

### Packaging Chips (Before Selection)
```
Add: [+ Boxes]  [+ Bags]  [+ Pallets]
```

---

## Validation Rules

### Required Fields
1. ✅ **Category** - Must select a category for each item
2. ✅ **At least one packaging type** - Each item must have at least one packaging
3. ✅ **Quantity** - Must be positive number > 0
4. ✅ **Price per unit** - Must be non-negative number ≥ 0

### Error Messages
```
Missing Information:
• Please complete all item fields (category, packaging, quantities, prices)
```

---

## Component Reference

### PickupItemsListV2.tsx

**Location:** `src/components/PickupItemsListV2.tsx`

**Key Features:**
- Category picker with emojis
- Add/remove packaging types
- Quantity and price inputs
- Auto-calculated subtotals
- Item total calculation
- Add/remove items

**Functions:**
```typescript
handleAddPackaging(itemId, type)        // Add Boxes/Bags/Pallets
handleRemovePackaging(itemId, index)    // Remove packaging type
handlePackagingChange(itemId, index, field, value)  // Update quantity/price
calculateItemTotal(itemId, packaging)   // Sum subtotals
```

---

## Screen Layout

```
┌─────────────────────────────────────────────────────┐
│  ◀  Complete Pickup                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Navigation Card]          ← Tap to open maps     │
│                                                     │
│  [Access Info Card]         ← Dock codes, tips     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Items *                                     │   │
│  │                                             │   │
│  │ [Item 1 Card]                               │   │
│  │ - Category picker                           │   │
│  │ - Packaging types (Boxes, Bags, Pallets)    │   │
│  │ - Quantity × Price = Subtotal               │   │
│  │ - Item Total                                │   │
│  │                                             │   │
│  │ [+ Add Another Item]                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Receipt Section]          ← Photo or reason      │
│                                                     │
│  [Signature Section]        ← Digital signature    │
│                                                     │
│  [COMPLETE PICKUP]          ← Submit button        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Firestore Structure

### Before Submission (`accepted` collection)
```javascript
{
  id: "pickup123",
  donor: { ... },
  pickup: {
    driver: "driver_uid",
    date: Timestamp,
    // No items yet
  }
}
```

### After Submission (`pickedup` collection)
```javascript
{
  id: "pickup123",
  donor: { ... },
  pickup: {
    driver: "driver_uid",
    date: Timestamp,

    // NEW STRUCTURE:
    items: [
      {
        category: "produce",
        packaging: [
          {
            type: "Boxes",
            quantity: 5,
            pricePerUnit: 10.00,
            subtotal: 50.00
          },
          {
            type: "Bags",
            quantity: 10,
            pricePerUnit: 2.50,
            subtotal: 25.00
          }
        ],
        totalPrice: 75.00
      }
    ],
    totalValue: 75.00,     // Sum of all item totals
    weight: 15,            // Sum of all quantities
    category: "produce",   // First item category (legacy)

    // Images
    receiptImage: "receipts/uuid.jpg",
    signatureImage: "signatures/uuid.png"
  }
}
```

---

## Migration from Old Structure

### Old Structure (Deprecated)
```javascript
items: [
  {
    category: "produce",
    weight: 35,              // ❌ Single weight
    pricePerPound: 1.50,     // ❌ Price per pound
    totalPrice: 52.50
  }
]
```

### New Structure
```javascript
items: [
  {
    category: "produce",
    packaging: [             // ✅ Array of packaging
      {
        type: "Boxes",
        quantity: 5,         // ✅ Quantity of boxes
        pricePerUnit: 10.00, // ✅ Price per box
        subtotal: 50.00      // ✅ Auto-calculated
      }
    ],
    totalPrice: 50.00
  }
]
```

---

## Testing Checklist

### UI Testing
- [ ] Category picker displays all options
- [ ] Can add Boxes packaging
- [ ] Can add Bags packaging
- [ ] Can add Pallets packaging
- [ ] Cannot add duplicate packaging type
- [ ] Can remove packaging type
- [ ] Quantity input accepts decimal numbers
- [ ] Price input accepts decimal numbers
- [ ] Subtotal updates when quantity changes
- [ ] Subtotal updates when price changes
- [ ] Item total updates when subtotal changes
- [ ] Can add multiple items
- [ ] Can remove items (if > 1)
- [ ] Add Another Item button works

### Validation Testing
- [ ] Error if category not selected
- [ ] Error if no packaging added
- [ ] Error if quantity empty
- [ ] Error if quantity negative
- [ ] Error if price empty
- [ ] Error if price negative (should allow 0)
- [ ] Error message displays correctly

### Data Submission Testing
- [ ] Single item saves correctly
- [ ] Multiple items save correctly
- [ ] Packaging array saves correctly
- [ ] Quantities convert to numbers
- [ ] Prices convert to numbers
- [ ] Subtotals calculated correctly
- [ ] Total value calculated correctly
- [ ] Total weight calculated correctly
- [ ] Document moves from `accepted` to `pickedup`
- [ ] Original document deleted

---

## Known Issues & Limitations

### Current Limitations
1. **Fixed packaging types** - Only Boxes, Bags, Pallets (cannot add custom)
2. **No packaging icons** - Text-only labels
3. **No weight units** - Assumes quantity = weight in lbs

### Future Enhancements
1. 🔮 **Custom packaging types** - Allow drivers to add custom types
2. 🔮 **Packaging icons** - Add visual icons (📦 🛍️ 🏗️)
3. 🔮 **Weight units** - Support lbs, kg, tons
4. 🔮 **Packaging templates** - Quick add common combinations
5. 🔮 **Price suggestions** - Historical pricing data

---

## Troubleshooting

### Issue: Cannot add packaging
**Solution:** Make sure category is selected first (though not strictly required)

### Issue: Subtotal not calculating
**Solution:** Enter both quantity and price (both must be valid numbers)

### Issue: Cannot remove packaging type
**Solution:** Tap the [×] button next to the packaging type name

### Issue: Validation fails even with data entered
**Solution:** Check that all fields have numeric values (not empty strings)

### Issue: Item total shows $0.00
**Solution:** Enter quantities and prices for all packaging types

---

## Summary

**Old Workflow:**
1. Enter total weight
2. Select packaging types (global)
3. Enter item details (weight, price per pound)

**New Workflow:**
1. Select category for item
2. Add packaging types to item (Boxes/Bags/Pallets)
3. Enter quantity and price for each packaging type
4. View auto-calculated subtotals and item total
5. Add more items if needed

**Benefits:**
- ✅ More detailed tracking (quantity per packaging type)
- ✅ Flexible pricing (different prices for different packaging)
- ✅ Better inventory management
- ✅ Accurate cost calculations
- ✅ Per-item categorization with packaging details

**Example Use Case:**
A restaurant donates:
- 5 boxes of fresh produce @ $10/box = $50
- 10 bags of bakery items @ $2.50/bag = $25
- 2 pallets of canned goods @ $50/pallet = $100

**Total Donation Value: $175**
**Total Weight: 17 units** (5 + 10 + 2)

This provides much more detailed tracking than the old "total weight × price per pound" model!
