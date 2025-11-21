# Pickup Complete Screen - Testing Guide

## Pre-Flight Checklist

Before you start testing, verify these files exist:

```bash
# Run this command in your project root
ls -la src/types/pickup.types.ts && \
ls -la src/constants/theme.ts && \
ls -la src/screens/donations/driver/PickupCompleteScreen.tsx && \
echo "✅ All files exist!"
```

---

## Phase 1: Installation Test (5 minutes)

### Step 1.1: TypeScript Setup

```bash
# Install TypeScript dependencies
npm install --save-dev @types/react @types/react-native typescript

# Create tsconfig.json if it doesn't exist
npx expo customize tsconfig.json
```

**Expected Result:** No errors, `tsconfig.json` created

### Step 1.2: Build Test

```bash
# Clear cache and rebuild
npm start -- --clear
```

**Expected Result:**
- ✅ Build succeeds
- ✅ No TypeScript errors
- ✅ Metro bundler running

### Step 1.3: Import Test

Check if the screen can be imported without errors:

```bash
# This should show no errors in your terminal
npm start
```

Then in your app, temporarily add to any file:
```typescript
import PickupCompleteScreen from './src/screens/donations/driver/PickupCompleteScreen';
console.log('PickupCompleteScreen imported:', typeof PickupCompleteScreen);
```

**Expected Result:** Console shows `PickupCompleteScreen imported: function`

---

## Phase 2: Navigation Integration Test (10 minutes)

### Step 2.1: Add to Navigator

In your driver stack navigator file, add:

```typescript
import PickupCompleteScreen from './PickupCompleteScreen';

// Inside your Stack.Navigator
<Stack.Screen
  name="PickupComplete"
  component={PickupCompleteScreen}
  options={{ title: 'Complete Pickup' }}
/>
```

### Step 2.2: Test Navigation

**Method A: Temporary Test Button**

Add this to `ListScreen.js` temporarily:

```javascript
// At the top
import { Button } from 'react-native-elements';

// After your pickups.map(), add:
{pickups.length > 0 && (
  <Button
    title="🧪 Test New Screen"
    onPress={() => {
      const testPickup = pickups[0]; // Use first pickup
      navigation.push('PickupComplete', {
        id: testPickup.id,
        data: testPickup.data,
      });
    }}
    buttonStyle={{ margin: 16, backgroundColor: '#F38020' }}
  />
)}
```

**Method B: Replace Navigation**

Or directly update the existing navigation:

```javascript
// In ListScreen.js, find this:
navigation.push('View', { id, data });

// Change to:
navigation.push('PickupComplete', { id, data });
```

### Step 2.3: Verify Screen Loads

1. Open your app
2. Login as a driver
3. Navigate to the pickups list
4. Tap a pickup (or tap test button)

**Expected Result:**
- ✅ New screen loads
- ✅ No white screen / crash
- ✅ Navigation card appears at top
- ✅ Form fields are visible

---

## Phase 3: Visual Testing (15 minutes)

### Test 3.1: Color Verification

Open the screen and check these colors match:

| Element | Expected Color | Visual Check |
|---------|---------------|--------------|
| Screen background | #F5F6F8 (light gray) | □ |
| Navigation card border | #4285F4 (bright blue) | □ |
| Section titles | #1A2B45 (dark blue) | □ |
| Capture/Upload buttons | #4285F4 (bright blue) | □ |
| Submit button | #F38020 (orange) | □ |

**How to check:** Compare against a color picker or design mockup

### Test 3.2: Layout Verification

Scroll through the screen and verify:

- □ Navigation card shows donor name and address
- □ "Pickup Details" section has weight and category fields
- □ "Receipt" section has radio buttons
- □ "Donor Signature" section exists
- □ Orange submit button is at the bottom
- □ All cards have white background
- □ All cards have shadows/elevation

### Test 3.3: Typography Check

- □ Section titles are bold and dark blue
- □ Required asterisks (*) are red
- □ Button text is white and readable
- □ Input placeholders are gray

---

## Phase 4: Functionality Testing (30 minutes)

### Test 4.1: Happy Path - Complete Pickup

**Scenario:** Driver completes pickup with all information

1. Navigate to a pickup
2. Enter weight: `25.5`
3. Select category: `Produce`
4. Select "Donor has receipt"
5. Tap "Capture" button
6. Allow camera permission
7. Take a photo of something (receipt, paper, anything)
8. Select "Get signature"
9. Tap "Open Signature Pad"
10. Screen rotates to landscape ✓
11. Draw a signature
12. Tap "Submit"
13. Screen rotates back to portrait ✓
14. Tap "COMPLETE PICKUP"
15. Confirm in alert dialog

**Expected Result:**
- ✅ Loading indicator appears
- ✅ Success alert shows
- ✅ Returns to pickup list
- ✅ Pickup removed from list
- ✅ Check Firestore: Document moved from `accepted` to `pickedup`
- ✅ Check Firebase Storage: Receipt image uploaded to `receipts/`
- ✅ Check Firebase Storage: Signature uploaded to `signatures/`

### Test 4.2: No Receipt Flow

1. Navigate to a pickup
2. Enter weight: `10`
3. Select category: `Bakery`
4. Select "No receipt available"
5. Verify photo buttons disappear ✓
6. Verify text area appears ✓
7. Try to submit (leave reason blank)
8. **Expected:** Error alert "Please explain why there is no receipt"
9. Enter reason: `Donor left items at door, no one available`
10. Select "Get signature"
11. Open signature pad and sign
12. Submit

**Expected Result:**
- ✅ Validation error shown when reason is blank
- ✅ Submits successfully with reason
- ✅ Check Firestore: `pickup.noReceiptReason` field exists
- ✅ Check Firestore: `pickup.receiptImage` field does NOT exist

### Test 4.3: No Signature Flow

1. Navigate to a pickup
2. Enter weight: `15.75`
3. Select category: `Canned Goods`
4. Select "Donor has receipt"
5. Take/upload a photo
6. Select "Donor unavailable"
7. Verify signature button disappears ✓
8. Verify text area appears ✓
9. Try to submit (leave reason blank)
10. **Expected:** Error alert about missing signature reason
11. Enter reason: `Donor not present, items left outside`
12. Submit

**Expected Result:**
- ✅ Validation error shown when reason is blank
- ✅ Submits successfully with reason
- ✅ Check Firestore: `pickup.noSignatureReason` field exists
- ✅ Check Firestore: `pickup.signatureImage` field does NOT exist

### Test 4.4: Validation Testing

Test each required field:

**Missing Weight:**
1. Leave weight blank
2. Fill everything else
3. Try to submit
4. **Expected:** Alert shows "Weight is required"

**Invalid Weight:**
1. Enter weight: `-5` or `abc`
2. Try to submit
3. **Expected:** Alert shows "Weight must be a positive number"

**Missing Category:**
1. Leave category as "Select a category"
2. Fill everything else
3. Try to submit
4. **Expected:** Alert shows "Category is required"

**Missing Receipt Photo:**
1. Select "Donor has receipt"
2. Don't take a photo
3. Try to submit
4. **Expected:** Alert shows "Receipt photo is required"

**Multiple Errors:**
1. Leave weight and category blank
2. Try to submit
3. **Expected:** Alert shows both errors in a list

---

## Phase 5: Navigation & Maps Testing (5 minutes)

### Test 5.1: Navigate Button

1. Open a pickup
2. Tap the "Navigate" card at the top
3. **Expected:** Maps app opens with destination set
4. Verify address is correct

**iOS:** Should offer Apple Maps / Google Maps
**Android:** Should open Google Maps or default maps app

### Test 5.2: Back Navigation

1. From pickup screen, use back button/gesture
2. **Expected:** Returns to list without crash
3. Pickup should still be in "accepted" status (not completed)

---

## Phase 6: Photo & Camera Testing (10 minutes)

### Test 6.1: Camera Capture

1. Tap "Capture" button
2. **Expected:** Permission prompt appears (first time)
3. Allow camera access
4. Take a photo
5. **Expected:** Photo appears in preview area
6. Verify photo is clear and properly sized

### Test 6.2: Photo Upload

1. Tap "Upload" button
2. **Expected:** Permission prompt appears (first time)
3. Allow photo library access
4. Select an image
5. **Expected:** Image appears in preview area

### Test 6.3: Photo Replacement

1. Capture a photo
2. Preview appears ✓
3. Tap "Capture" again
4. Take a different photo
5. **Expected:** Old photo is replaced with new one

### Test 6.4: Upload Size Check

After completing a pickup with photo:

1. Go to Firebase Console
2. Navigate to Storage → `receipts/`
3. Check file size
4. **Expected:** File size < 2MB (compressed to 0.8 quality)

---

## Phase 7: Signature Testing (10 minutes)

### Test 7.1: Signature Pad Opens

1. Tap "Open Signature Pad"
2. **Expected:**
   - Modal opens full screen
   - Screen rotates to landscape
   - Canvas is ready for drawing

### Test 7.2: Clear Signature

1. Draw something
2. Tap "Clear"
3. **Expected:** Canvas clears completely
4. Can draw again

### Test 7.3: Cancel Signature

1. Draw something
2. Tap "Cancel"
3. **Expected:**
   - Modal closes
   - Screen rotates back to portrait
   - Signature is NOT saved
   - Preview area still empty

### Test 7.4: Submit Signature

1. Draw a signature
2. Tap "Submit"
3. **Expected:**
   - Modal closes
   - Screen rotates back to portrait
   - Signature appears in preview box
   - Preview is tappable to edit

### Test 7.5: Update Signature

1. After submitting a signature
2. Tap the signature preview
3. **Expected:** Modal reopens with blank canvas
4. Draw new signature
5. Submit
6. **Expected:** Preview updates with new signature

---

## Phase 8: Data Persistence Testing (15 minutes)

### Test 8.1: Firestore Document Check

Complete a pickup, then check Firestore:

**Before Submission:**
```
Collection: accepted/{pickupId}
{
  client: {...},
  pickup: {
    driver: "driverUID",
    date: Timestamp
  }
}
```

**After Submission:**
```
Collection: pickedup/{pickupId}
{
  client: {...},
  pickup: {
    driver: "driverUID",
    date: Timestamp,
    weight: 25.5,                    // ✓ NEW
    category: "produce",             // ✓ NEW
    receiptImage: "receipts/uuid",   // ✓ NEW
    signatureImage: "signatures/uuid" // ✓ NEW
  }
}
```

**Verify:**
- ✅ Document exists in `pickedup` collection
- ✅ Document removed from `accepted` collection
- ✅ All new fields present
- ✅ Values are correct

### Test 8.2: Storage Files Check

In Firebase Console → Storage:

**Receipts folder:**
- ✅ File exists at `receipts/{uuid}`
- ✅ File is viewable/downloadable
- ✅ File size is reasonable

**Signatures folder:**
- ✅ File exists at `signatures/{uuid}.png`
- ✅ File is viewable/downloadable
- ✅ Signature is clear

### Test 8.3: No Receipt/Signature Data

Complete a pickup with "No receipt" and "Donor unavailable":

**Firestore Document:**
```json
{
  pickup: {
    weight: 15,
    category: "bakery",
    noReceiptReason: "Donor left items at door",
    noSignatureReason: "Donor not present",
    // receiptImage: NOT present ✓
    // signatureImage: NOT present ✓
  }
}
```

---

## Phase 9: Platform-Specific Testing

### iOS Testing

- □ Status bar is visible (not hidden)
- □ Safe area insets respected (notch devices)
- □ Keyboard pushes content up (not covering inputs)
- □ Signature pad rotates smoothly
- □ Picker shows iOS wheel style
- □ Camera permission dialog appears
- □ Photos upload successfully

### Android Testing

- □ Navigation bar respected
- □ Keyboard resizes view properly
- □ Signature pad rotates smoothly
- □ Picker shows dropdown style
- □ Camera permission dialog appears
- □ Photos upload successfully
- □ Back button works correctly

---

## Phase 10: Error Scenario Testing

### Test 10.1: Network Failure

1. Turn on Airplane Mode
2. Complete a pickup
3. Try to submit
4. **Expected:** Error alert appears
5. Turn off Airplane Mode
6. Try again
7. **Expected:** Submits successfully

### Test 10.2: Permission Denied

**Camera:**
1. Deny camera permission
2. Tap "Capture"
3. **Expected:** Alert asks to allow permissions
4. Go to Settings → Allow camera
5. Try again
6. **Expected:** Camera opens

**Photos:**
1. Deny photo library permission
2. Tap "Upload"
3. **Expected:** Alert asks to allow permissions

### Test 10.3: Large Photo

1. Select a very large photo (>10MB if available)
2. Upload it
3. **Expected:**
   - Still uploads (may take longer)
   - File is compressed before upload
   - No crash or timeout

---

## Phase 11: Performance Testing

### Test 11.1: Load Time

1. Navigate to pickup screen
2. **Expected:** Screen loads < 1 second
3. All elements visible immediately

### Test 11.2: Submission Time

1. Fill form with all data
2. Tap submit
3. Measure time until success alert

**Expected:**
- Small receipt image: < 3 seconds
- Large receipt image: < 8 seconds
- Loading modal shows during upload

### Test 11.3: Memory Usage

1. Complete 5 pickups in a row
2. **Expected:** No memory warnings
3. App remains responsive

---

## Phase 12: Edge Cases

### Test 12.1: Very Long Address

Test with an address like:
```
1234 Very Long Street Name That Goes On And On And On Avenue, Apartment 123, Building B, San Francisco, CA 94102
```

**Expected:**
- Text wraps properly
- Doesn't overflow card
- Remains readable

### Test 12.2: Special Characters in Reason

Enter in "No receipt reason":
```
Donor said: "Left items @ door 😊" & wasn't available!
```

**Expected:**
- Text saves correctly
- Displays correctly in Firestore
- No encoding issues

### Test 12.3: Decimal Weight

1. Enter weight: `12.345678`
2. Submit
3. Check Firestore

**Expected:** Saves as number with decimals

### Test 12.4: Zero Weight

1. Enter weight: `0`
2. Try to submit
3. **Expected:** Error "Weight must be a positive number"

---

## Phase 13: User Experience Testing

### Test 13.1: Real-World Simulation

**Setup:** Have someone act as a driver at a "loading dock"

1. Driver receives pickup assignment
2. Opens pickup screen while standing
3. Taps Navigate
4. Returns to app
5. Takes photo of "receipt" (while holding phone one-handed)
6. Enters weight (while items are on scale)
7. Selects category
8. Asks "donor" for signature
9. Completes pickup

**Observe:**
- How long does it take? (Target: < 3 minutes)
- Any friction points?
- Is everything reachable one-handed?
- Are buttons large enough?

### Test 13.2: Accessibility Check

**VoiceOver (iOS):**
1. Settings → Accessibility → VoiceOver → On
2. Navigate through form
3. **Expected:** All labels are read aloud
4. All buttons are tappable
5. Error messages are announced

**TalkBack (Android):**
1. Settings → Accessibility → TalkBack → On
2. Navigate through form
3. Same expectations as iOS

---

## Automated Testing Script

Save this as a quick manual test checklist:

```markdown
## Quick 5-Minute Smoke Test

1. □ App builds without errors
2. □ Screen loads when tapped
3. □ Enter weight: 20
4. □ Select category: Produce
5. □ Take receipt photo
6. □ Add signature
7. □ Tap COMPLETE PICKUP
8. □ Success alert appears
9. □ Returns to list
10. □ Check Firestore: Document in `pickedup` ✓
```

---

## Test Data Recommendations

Create test pickups with various data:

```javascript
// Test donor names
- Short: "Jo Wu"
- Long: "María de los Ángeles García-López de la Torre"
- Special: "O'Brien & Sons"

// Test addresses
- Short: "123 Main St"
- Long: "[very long address]"
- Special characters: "Apt. #5, Bldg. B"

// Test weights
- Small: 2.5
- Medium: 50
- Large: 500
- Decimal: 12.345

// Test categories
- All 9 options from the dropdown
```

---

## Success Criteria

### ✅ Must Pass

- [ ] All validation errors show correct messages
- [ ] Photos upload to Firebase Storage
- [ ] Signatures save correctly
- [ ] Document moves from `accepted` to `pickedup`
- [ ] No crashes or white screens
- [ ] Works on both iOS and Android
- [ ] Navigation integration works
- [ ] Required fields are enforced

### ⚠️ Should Pass

- [ ] Loads in < 1 second
- [ ] Submits in < 5 seconds
- [ ] Colors match design spec
- [ ] All text is readable
- [ ] Touch targets are ≥ 44pt
- [ ] Landscape mode works for signature

### 💡 Nice to Have

- [ ] Accessibility features work
- [ ] Handles very large photos
- [ ] Works offline (shows error gracefully)
- [ ] Memory efficient

---

## Troubleshooting Common Issues

### Issue: TypeScript errors in terminal

**Fix:**
```bash
npm install --save-dev typescript @types/react @types/react-native
```

### Issue: "Cannot find module"

**Fix:**
```bash
npm start -- --clear
```

### Issue: Signature doesn't save

**Check:**
- Console logs for errors
- Firebase Storage rules allow writes
- File permissions granted

### Issue: Photos don't appear

**Check:**
- Camera/library permissions granted
- `expo-image-picker` installed
- Android: Check `app.json` permissions

---

## Final Checklist

Before deploying to production:

- [ ] All Phase 4 functionality tests pass
- [ ] Tested on at least 2 iOS devices
- [ ] Tested on at least 2 Android devices
- [ ] Firebase Storage has correct security rules
- [ ] Firestore rules allow driver writes
- [ ] No console errors or warnings
- [ ] Loading states show properly
- [ ] Error messages are user-friendly
- [ ] Backup/rollback plan ready
- [ ] Old screen still accessible (as fallback)

---

## Testing Timeline

**Day 1 (2 hours):**
- Phases 1-3: Installation, Integration, Visual

**Day 2 (3 hours):**
- Phases 4-8: Functionality, Data Persistence

**Day 3 (2 hours):**
- Phases 9-11: Platform-specific, Performance

**Day 4 (1 hour):**
- Phases 12-13: Edge Cases, UX Testing

**Total: ~8 hours** for comprehensive testing

---

## Report Template

After testing, document results:

```markdown
# Pickup Complete Screen - Test Report

**Date:** YYYY-MM-DD
**Tester:** [Your Name]
**Devices:**
- iOS: [model] [version]
- Android: [model] [version]

## Results

### Functionality: ✅ Pass / ❌ Fail
- Weight validation: ✅
- Category validation: ✅
- Photo capture: ✅
- Signature: ✅
- Submission: ✅

### Issues Found:
1. [Description]
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual

### Recommendations:
- [Any suggestions]

### Ready for Production: Yes / No
```

---

Good luck with testing! 🧪
