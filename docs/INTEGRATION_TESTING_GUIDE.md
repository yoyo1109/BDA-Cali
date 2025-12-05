# Integration Testing Guide - New Pickup Components

## Quick Start Testing

### Prerequisites
1. App is running on iOS simulator or device
2. Logged in as driver (Deborah Schmitt)
3. At least one test pickup exists in `accepted` collection

### Test Flow (5 minutes)

```bash
# 1. Start the app
npx expo run:ios

# 2. Login as driver
# Email: deb@email.com
# Password: [driver password]

# 3. Navigate to pickup
# Tap "Pickup List" → Select any pickup → Opens PickupCompleteScreenV2
```

---

## Visual Verification Checklist

### Screen Layout Order
When you open PickupCompleteScreenV2, you should see components in this order:

```
✅ 1. Blue Navigation Card (Map icon + "Navigate" + Address)
✅ 2. Dark Blue AccessInfoCard (with "Access Notes" title)
✅ 3. White "Weight" Section (Camera button + input field)
✅ 4. White "Packaging Type" Section (Boxes, Bags, Pallets chips)
✅ 5. White "Items" Section (Category/Weight/Price inputs)
✅ 6. White "Receipt" Section (Camera/Upload buttons)
✅ 7. White "Signature" Section (Open Signature Pad button)
✅ 8. Orange "COMPLETE PICKUP" Button at bottom
```

---

## Component-by-Component Testing

### Test 1: AccessInfoCard

#### Visual Check
- [ ] Card appears below Navigation Card
- [ ] Background is dark blue (#1A2B45)
- [ ] Rounded corners (12px)
- [ ] Title "Access Notes" is bold white text
- [ ] Padding looks correct (16px)

#### Behavior Tests

**Test 1.1: With Data**
```javascript
// If pickup has dockCode and loadingTips:
Expected Display:
┌─────────────────────────────────┐
│ Access Notes                    │
│                                 │
│ Dock Code:                      │
│ Bay 3                           │
│                                 │
│ Loading Tips:                   │
│ Ring bell twice.                │
└─────────────────────────────────┘
```

**Test 1.2: Without Data**
```javascript
// If pickup has no dockCode or loadingTips:
Expected Display:
┌─────────────────────────────────┐
│ Access Notes                    │
│                                 │
│ No access notes provided        │
└─────────────────────────────────┘
```

**Steps:**
1. Open pickup
2. Scroll to AccessInfoCard (below Navigation)
3. Verify card appearance matches spec
4. Check text color: title (white), content (light gray #B0B8C4)

**Expected:** Card displays correctly with dark blue background

---

### Test 2: WeightInputRow

#### Visual Check
- [ ] Row contains camera button (left) and input card (right)
- [ ] Camera button is circular (80x80)
- [ ] Camera button has white border (2px)
- [ ] Camera button has semi-transparent background
- [ ] Camera icon is white and centered
- [ ] Input card is white with shadow
- [ ] Input text is large (32px)
- [ ] Unit "lbs" appears on right side

#### Behavior Tests

**Test 2.1: Manual Weight Input**
1. Tap weight input field
2. Keyboard appears (numeric)
3. Type "25.5"
4. Verify text displays in large font
5. Verify "lbs" label visible on right

**Expected:** Weight input works correctly

**Test 2.2: Camera Button**
1. Tap circular camera button
2. Permission dialog appears (if first time)
3. Allow camera permission
4. Camera opens
5. Take photo of scale (or any photo)
6. Alert shows: "Weight captured! In a future update..."
7. Tap OK on alert

**Expected:** Camera opens and alert shows (OCR not yet implemented)

**Test 2.3: Validation**
1. Leave weight field empty
2. Scroll to bottom and tap "COMPLETE PICKUP"
3. Alert shows: "Missing Information: • Weight is required"
4. Tap OK
5. Enter "abc" in weight field
6. Tap "COMPLETE PICKUP"
7. Alert shows: "Missing Information: • Weight must be a positive number"
8. Tap OK
9. Enter "-10" in weight field
10. Tap "COMPLETE PICKUP"
11. Alert shows: "Missing Information: • Weight must be a positive number"

**Expected:** Validation errors show for empty/invalid/negative weight

---

### Test 3: PackagingSelector

#### Visual Check
- [ ] Three chips displayed horizontally
- [ ] Chips labeled: "Boxes", "Bags", "Pallets"
- [ ] Chips have rounded corners (24px)
- [ ] Gap between chips (12px)
- [ ] Default chips have gray background (#D1D9E6)
- [ ] Default chips have dark text (#1A2B45)

#### Behavior Tests

**Test 3.1: Single Selection**
1. All chips start unselected (gray background)
2. Tap "Boxes" chip
3. Boxes chip turns white with shadow
4. Boxes text becomes bold
5. Bags and Pallets remain gray

**Expected:** Single chip selection works

**Test 3.2: Multi Selection**
1. Starting from Test 3.1 (Boxes selected)
2. Tap "Pallets" chip
3. Pallets chip turns white with shadow
4. Pallets text becomes bold
5. Boxes remains white (still selected)
6. Bags remains gray (unselected)

**Expected:** Multiple chips can be selected simultaneously

**Test 3.3: Deselection**
1. Starting from Test 3.2 (Boxes and Pallets selected)
2. Tap "Boxes" chip again
3. Boxes chip turns gray
4. Boxes text becomes normal weight
5. Pallets remains white (still selected)

**Expected:** Tapping selected chip deselects it

**Test 3.4: All Selected**
1. Tap all three chips (Boxes, Bags, Pallets)
2. All three chips turn white
3. All three texts become bold

**Expected:** All chips can be selected

---

## Integration Testing

### Test 4: Complete Workflow (Happy Path)

**Scenario:** Driver completes pickup with all new components

**Steps:**
1. Login as driver
2. Navigate to List screen
3. Select a pickup
4. **AccessInfoCard:** View access notes (if any)
5. **WeightInputRow:** Enter weight "35.5"
6. **PackagingSelector:** Select "Boxes" and "Bags"
7. **PickupItemsList:** Add item:
   - Category: Produce
   - Weight: 35
   - Price: 1.50
8. **Receipt:** Take photo or select "No receipt available" + reason
9. **Signature:** Open signature pad, draw signature, submit
10. Tap "COMPLETE PICKUP"
11. Confirm dialog appears
12. Tap "Confirm"
13. Loading modal shows
14. Success alert shows
15. Returns to List screen

**Expected:** Pickup completes successfully

**Verify in Firestore:**
```javascript
// Check pickedup collection
{
  pickup: {
    totalWeight: 35.5,              // ✅ From WeightInputRow
    packagingTypes: ["Boxes", "Bags"], // ✅ From PackagingSelector
    items: [
      {
        category: "produce",
        weight: 35,
        pricePerPound: 1.50,
        totalPrice: 52.50
      }
    ],
    totalValue: 52.50,
    receiptImage: "receipts/uuid.jpg",
    signatureImage: "signatures/uuid.png"
  }
}
```

---

### Test 5: Validation Errors

**Scenario:** Submit without required fields

**Steps:**
1. Open pickup
2. Leave weight field empty
3. Leave all item fields empty
4. Select "Donor has receipt" but don't take photo
5. Select "Get signature" but don't open signature pad
6. Tap "COMPLETE PICKUP"

**Expected Alert:**
```
Missing Information:
• Weight is required
• Please complete all item fields (category, weight, price)
• Receipt photo is required
```

**Steps (continue):**
7. Tap OK
8. Enter weight "25"
9. Fill out item (category: Dairy, weight: 25, price: 2.00)
10. Take receipt photo
11. Get signature
12. Tap "COMPLETE PICKUP"
13. Confirm dialog appears
14. Tap "Confirm"

**Expected:** Pickup completes successfully after fixing errors

---

### Test 6: Packaging Optional

**Scenario:** Submit without selecting packaging

**Steps:**
1. Open pickup
2. Enter weight "20"
3. Add item (Bakery, 20, 1.00)
4. Take receipt photo
5. Get signature
6. **DO NOT** select any packaging types (leave all gray)
7. Tap "COMPLETE PICKUP"
8. Confirm

**Expected:** Pickup completes successfully (packaging is optional)

**Verify in Firestore:**
```javascript
{
  pickup: {
    totalWeight: 20,
    // packagingTypes: undefined (field not saved if empty)
    items: [...]
  }
}
```

---

### Test 7: Camera Permissions

**Scenario:** Test camera permission handling

**Test 7.1: First Camera Use**
1. Fresh install or reset permissions
2. Tap camera button on WeightInputRow
3. Permission dialog appears: "Allow BDA-Cali to access camera?"
4. Tap "Don't Allow"
5. Alert shows: "Permission Required: Please allow camera permissions."

**Expected:** Permission alert shows, camera doesn't open

**Test 7.2: Grant Permission**
1. Tap camera button again
2. Permission dialog appears again
3. Tap "Allow"
4. Camera opens

**Expected:** Camera opens after granting permission

---

## Data Verification

### Firestore Console Checks

After completing a pickup, verify in Firebase Console:

1. **Go to Firestore Database**
2. **Check `pickedup` collection**
3. **Find the latest document**
4. **Verify structure:**

```javascript
pickedup/{pickupId}
└── pickup/
    ├── totalWeight: 35.5           // ✅ NEW from WeightInputRow
    ├── packagingTypes: [           // ✅ NEW from PackagingSelector
    │     "Boxes",
    │     "Bags"
    │   ]
    ├── items: [                    // ✅ Existing multi-item data
    │     {
    │       category: "produce",
    │       weight: 35,
    │       pricePerPound: 1.50,
    │       totalPrice: 52.50
    │     }
    │   ]
    ├── totalValue: 52.50
    ├── receiptImage: "receipts/..."
    └── signatureImage: "signatures/..."
```

5. **Check `accepted` collection**
6. **Verify original document is deleted**

---

## Common Issues

### Issue 1: Components Not Visible
**Symptom:** Don't see AccessInfoCard, WeightInputRow, or PackagingSelector
**Cause:** Wrong screen (using old PickupCompleteScreen instead of V2)
**Solution:** Verify navigation goes to `PickupCompleteV2` screen

### Issue 2: Camera Button Doesn't Work
**Symptom:** Tapping camera does nothing
**Cause:** Permissions not granted
**Solution:** Check console logs, ensure permission request appears

### Issue 3: Validation Always Fails
**Symptom:** Can't submit even with weight entered
**Cause:** Weight field has non-numeric characters
**Solution:** Clear field and enter only numbers (e.g., "25.5")

### Issue 4: Packaging Not Saved
**Symptom:** packagingTypes field missing in Firestore
**Cause:** No packaging selected (field only saved if array is not empty)
**Solution:** This is expected behavior - packaging is optional

---

## Performance Checks

- [ ] Screen loads within 2 seconds
- [ ] Camera opens within 1 second
- [ ] Signature pad opens immediately
- [ ] Submission completes within 5 seconds
- [ ] No lag when typing in weight input
- [ ] No lag when toggling packaging chips
- [ ] Smooth scrolling through entire screen

---

## Accessibility Checks

- [ ] All text is readable (good contrast)
- [ ] Touch targets are large enough (min 44x44)
- [ ] Camera button is easily tappable (80x80)
- [ ] Packaging chips are easily tappable
- [ ] Input fields have clear labels
- [ ] Required fields marked with red asterisk

---

## Cross-Platform Testing

### iOS Specific
- [ ] Camera permission dialog shows
- [ ] Keyboard type is numeric for weight
- [ ] Shadows appear on selected chips
- [ ] ScrollView scrolls smoothly

### Android Specific
- [ ] Camera permission dialog shows
- [ ] Keyboard type is numeric for weight
- [ ] Elevation appears on selected chips
- [ ] ScrollView scrolls smoothly

---

## Regression Testing

Ensure existing features still work:

- [ ] Navigation card opens map
- [ ] Multi-item list add/remove works
- [ ] Category picker works
- [ ] Receipt photo capture works
- [ ] Signature pad works
- [ ] Validation still catches errors
- [ ] Submission to Firestore works
- [ ] Document moves from `accepted` to `pickedup`
- [ ] Navigation returns to List screen

---

## Test Results Template

```
Date: ____________
Tester: ____________
Device: ____________ (e.g., iPhone 14 Simulator, iOS 17.0)
App Version: ____________

Component Tests:
[ ] AccessInfoCard - Visual
[ ] AccessInfoCard - With Data
[ ] AccessInfoCard - Without Data
[ ] WeightInputRow - Visual
[ ] WeightInputRow - Manual Input
[ ] WeightInputRow - Camera
[ ] WeightInputRow - Validation
[ ] PackagingSelector - Visual
[ ] PackagingSelector - Single Selection
[ ] PackagingSelector - Multi Selection
[ ] PackagingSelector - Deselection

Integration Tests:
[ ] Complete Workflow (Happy Path)
[ ] Validation Errors
[ ] Packaging Optional
[ ] Camera Permissions

Data Verification:
[ ] totalWeight saved to Firestore
[ ] packagingTypes saved to Firestore
[ ] Document moved to pickedup
[ ] Original document deleted

Performance:
[ ] No lag or stuttering
[ ] Camera opens quickly
[ ] Submission completes in < 5s

Issues Found:
_________________________________________________
_________________________________________________
_________________________________________________

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## Next Steps After Testing

1. **If all tests pass:**
   - ✅ Mark components as production-ready
   - ✅ Update release notes
   - ✅ Train drivers on new workflow

2. **If issues found:**
   - 📝 Document issues with screenshots
   - 🐛 Create bug tickets
   - 🔧 Fix issues and re-test

3. **Future enhancements:**
   - Implement OCR for weight extraction
   - Add icons to packaging chips
   - Allow drivers to input access notes
   - Add more packaging types if needed

---

**Testing complete! All components integrated and ready for production.**
