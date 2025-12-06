# Firestore Data Structure - Multi-Item Pickup

## Overview
This document describes the Firestore data structure for the new multi-item pickup feature in PickupCompleteScreenV2.

---

## Data Flow

### 1. Before Submission (in `accepted` collection)

```javascript
{
  id: "pickup123",
  donor: {
    name: "John's Restaurant",
    address: "123 Main St, Los Angeles, CA",
    location: { lat: 34.0522, lng: -118.2437 }
  },
  pickup: {
    driver: "2ZIs12onUpeHC3Crl85TI9DxgDb2",
    driverName: "Deborah Schmitt",
    date: Timestamp,
    // Legacy fields (will be updated)
    weight: 0,
    category: null
  }
}
```

### 2. After Submission (in `pickedup` collection)

```javascript
{
  id: "pickup123",
  donor: {
    name: "John's Restaurant",
    address: "123 Main St, Los Angeles, CA",
    location: { lat: 34.0522, lng: -118.2437 }
  },
  pickup: {
    driver: "2ZIs12onUpeHC3Crl85TI9DxgDb2",
    driverName: "Deborah Schmitt",
    date: Timestamp,

    // NEW: Multi-item array
    items: [
      {
        category: "produce",
        weight: 25.5,
        pricePerPound: 0.50,
        totalPrice: 12.75
      },
      {
        category: "dairy",
        weight: 15.0,
        pricePerPound: 2.00,
        totalPrice: 30.00
      },
      {
        category: "bakery",
        weight: 10.0,
        pricePerPound: 1.50,
        totalPrice: 15.00
      }
    ],

    // NEW: Calculated totals
    totalValue: 57.75,          // Sum of all item.totalPrice

    // Legacy fields (maintained for backward compatibility)
    weight: 50.5,               // Sum of all item.weight
    category: "mixed",          // "mixed" when multiple items

    // Optional: Images
    receiptImage: "receipts/uuid-123.jpg",
    signatureImage: "signatures/uuid-456.png",

    // Optional: Missing data reasons
    noReceiptReason: "Receipt not provided by donor",
    noSignatureReason: null
  }
}
```

---

## Data Types

### PickupItemData Interface

```typescript
interface PickupItemData {
  category: DonationCategory;  // Enum value
  weight: number;              // Parsed float
  pricePerPound: number;       // Parsed float
  totalPrice: number;          // Calculated: weight × pricePerPound
}
```

### DonationCategory Enum

```typescript
enum DonationCategory {
  PRODUCE = 'produce',
  DAIRY = 'dairy',
  BAKERY = 'bakery',
  CANNED_GOODS = 'canned_goods',
  DRY_GOODS = 'dry_goods',
  MEAT = 'meat',
  FROZEN = 'frozen',
  MIXED = 'mixed',
  OTHER = 'other',
}
```

---

## Validation Rules

### Item-Level Validation

1. **Category:** Must be non-empty string from DonationCategory enum
2. **Weight:** Must be positive number > 0
3. **Price per Pound:** Must be non-negative number ≥ 0
4. **Total Price:** Auto-calculated, must equal `weight × pricePerPound`

### Pickup-Level Validation

1. **Items Array:** Must contain at least 1 item
2. **Total Value:** Must equal sum of all `item.totalPrice`
3. **Total Weight:** Must equal sum of all `item.weight`
4. **Category:**
   - Single item: Same as item category
   - Multiple items: Set to "mixed"

### Image Validation

1. **Receipt Image:** Optional, stored in Firebase Storage at `receipts/{uuid}.jpg`
2. **Signature Image:** Optional, stored in Firebase Storage at `signatures/{uuid}.png`
3. **Reasons:** Required if hasReceipt='no' or hasSignature='no'

---

## Test Scenarios

### Scenario 1: Single Item Pickup

**Input:**
```javascript
items: [
  { category: 'produce', weight: '25.5', pricePerPound: '0.50' }
]
```

**Expected Output:**
```javascript
{
  pickup: {
    items: [
      { category: 'produce', weight: 25.5, pricePerPound: 0.50, totalPrice: 12.75 }
    ],
    totalValue: 12.75,
    weight: 25.5,
    category: 'produce'  // ← Same as single item
  }
}
```

### Scenario 2: Multiple Items (Mixed Categories)

**Input:**
```javascript
items: [
  { category: 'produce', weight: '10', pricePerPound: '1.00' },
  { category: 'dairy', weight: '5', pricePerPound: '2.00' }
]
```

**Expected Output:**
```javascript
{
  pickup: {
    items: [
      { category: 'produce', weight: 10, pricePerPound: 1.00, totalPrice: 10.00 },
      { category: 'dairy', weight: 5, pricePerPound: 2.00, totalPrice: 10.00 }
    ],
    totalValue: 20.00,
    weight: 15,
    category: 'mixed'  // ← Multiple items = mixed
  }
}
```

### Scenario 3: Free Donation (Price = 0)

**Input:**
```javascript
items: [
  { category: 'bakery', weight: '20', pricePerPound: '0' }
]
```

**Expected Output:**
```javascript
{
  pickup: {
    items: [
      { category: 'bakery', weight: 20, pricePerPound: 0, totalPrice: 0 }
    ],
    totalValue: 0,
    weight: 20,
    category: 'bakery'
  }
}
```

### Scenario 4: With Images and Reasons

**Input:**
```javascript
items: [{ category: 'produce', weight: '15', pricePerPound: '1.50' }]
hasReceipt: 'no'
noReceiptReason: 'Donor forgot to provide receipt'
hasSignature: 'yes'
signatureImage: '/path/to/signature.png'
```

**Expected Output:**
```javascript
{
  pickup: {
    items: [
      { category: 'produce', weight: 15, pricePerPound: 1.50, totalPrice: 22.50 }
    ],
    totalValue: 22.50,
    weight: 15,
    category: 'produce',
    noReceiptReason: 'Donor forgot to provide receipt',
    signatureImage: 'signatures/uuid-123.png'
  }
}
```

---

## Code Reference

### Submission Logic (PickupCompleteScreenV2.tsx:197-255)

```typescript
const handleSubmit = async (values: PickupFormValues) => {
  // 1. Convert items to PickupItemData format
  const pickupItems: PickupItemData[] = items.map((item) => {
    const weight = parseFloat(item.weight);
    const pricePerPound = parseFloat(item.pricePerPound);
    const totalPrice = weight * pricePerPound;

    return {
      category: item.category as DonationCategory,
      weight,
      pricePerPound,
      totalPrice,
    };
  });

  // 2. Calculate totals
  const totalValue = pickupItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalWeight = pickupItems.reduce((sum, item) => sum + item.weight, 0);

  // 3. Update pickup data
  data.pickup.items = pickupItems;
  data.pickup.totalValue = totalValue;
  data.pickup.weight = totalWeight; // Legacy
  data.pickup.category = pickupItems.length === 1
    ? pickupItems[0].category
    : DonationCategory.MIXED;

  // 4. Upload images to Storage
  await uploadImagesToStorage();

  // 5. Move from 'accepted' to 'pickedup'
  const pickedUpRef = doc(db, 'pickedup', id);
  await setDoc(pickedUpRef, data);
  await deleteDoc(doc(db, 'accepted', id));
};
```

---

## Backward Compatibility

The new structure maintains backward compatibility:

1. **Legacy fields preserved:**
   - `weight`: Total weight (sum of all items)
   - `category`: Item category or "mixed"

2. **New fields additive:**
   - `items`: Array of detailed item data
   - `totalValue`: Total monetary value

3. **Old screens still work:**
   - Screens reading `pickup.weight` will get correct total
   - Screens reading `pickup.category` will get appropriate category

---

## Firestore Console Verification

To verify in Firebase Console:

1. Go to **Firestore Database**
2. Navigate to **`pickedup`** collection
3. Find a recent pickup document
4. Verify structure matches:

```
pickedup/{pickupId}
├── donor/
│   ├── name: string
│   ├── address: string
│   └── location: { lat, lng }
└── pickup/
    ├── driver: string
    ├── driverName: string
    ├── date: Timestamp
    ├── items: Array
    │   └── [0]:
    │       ├── category: string
    │       ├── weight: number
    │       ├── pricePerPound: number
    │       └── totalPrice: number
    ├── totalValue: number
    ├── weight: number (legacy)
    ├── category: string (legacy)
    ├── receiptImage: string (optional)
    ├── signatureImage: string (optional)
    ├── noReceiptReason: string (optional)
    └── noSignatureReason: string (optional)
```

---

## Testing Checklist

- [ ] Complete pickup with single item
- [ ] Verify `items` array has 1 element
- [ ] Verify `totalValue` equals `items[0].totalPrice`
- [ ] Verify `category` equals `items[0].category`
- [ ] Complete pickup with multiple items
- [ ] Verify `items` array has correct count
- [ ] Verify `totalValue` equals sum of all `totalPrice`
- [ ] Verify `category` is "mixed"
- [ ] Complete pickup with price = 0
- [ ] Verify `totalPrice` is 0
- [ ] Complete pickup with receipt image
- [ ] Verify `receiptImage` path in Storage
- [ ] Complete pickup with signature
- [ ] Verify `signatureImage` path in Storage
- [ ] Complete pickup without receipt (with reason)
- [ ] Verify `noReceiptReason` is saved
- [ ] Verify document moves from `accepted` to `pickedup`
- [ ] Verify original document deleted from `accepted`

---

## Common Issues

### Issue 1: Items Array Empty
**Symptom:** `items: []` in Firestore
**Cause:** User submitted without adding any items
**Fix:** Validation should prevent submission (check PickupItemsList validation)

### Issue 2: Incorrect totalValue
**Symptom:** `totalValue` doesn't match sum of items
**Cause:** Math error in calculation
**Fix:** Verify line 216: `pickupItems.reduce((sum, item) => sum + item.totalPrice, 0)`

### Issue 3: Category Not "mixed"
**Symptom:** Multiple items but category is not "mixed"
**Cause:** Logic error in category assignment
**Fix:** Verify line 225: `pickupItems.length === 1 ? ... : DonationCategory.MIXED`

### Issue 4: Images Not Uploading
**Symptom:** `receiptImage` or `signatureImage` is null/undefined
**Cause:** Upload failed or permission denied
**Fix:** Check Firebase Storage rules and `uploadImagesToStorage()` function

---

## Firebase Security Rules

Ensure your Firestore security rules allow:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow drivers to write to pickedup
    match /pickedup/{pickupId} {
      allow write: if request.auth != null &&
                   request.resource.data.pickup.driver == request.auth.uid;
      allow read: if request.auth != null;
    }

    // Allow drivers to delete from accepted
    match /accepted/{pickupId} {
      allow delete: if request.auth != null &&
                    resource.data.pickup.driver == request.auth.uid;
    }
  }
}
```

---

**Summary:** The multi-item pickup data structure is correctly implemented with proper validation, calculation, and backward compatibility. All test scenarios should verify data integrity before and after Firestore submission.
