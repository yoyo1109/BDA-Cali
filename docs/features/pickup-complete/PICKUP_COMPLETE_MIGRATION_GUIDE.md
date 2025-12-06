# Pickup Complete Screen - Migration Guide

## Overview

This guide will help you integrate the new TypeScript-based "Pickup Complete" workflow into your existing React Native + Expo project.

## What's New

### Features Implemented
✅ **Weight Input** - Mandatory field for donation weight (in pounds)
✅ **Category Selection** - Dropdown picker for donation type
✅ **Receipt Photo Capture** - Camera/upload with "no receipt" fallback
✅ **Digital Signature** - Signature pad with "donor unavailable" option
✅ **Navigation Integration** - One-tap navigation to donor location
✅ **Improved Visual Design** - New color scheme and card-based layout
✅ **TypeScript Support** - Full type safety with interfaces
✅ **Enhanced Validation** - Client-side form validation with helpful error messages

### New Color Scheme
- **Dark Blue Header/Card:** `#1A2B45`
- **Bright Blue Actions:** `#4285F4`
- **Orange Confirm Button:** `#F38020`
- **Background:** `#F5F6F8`

---

## Installation Steps

### Step 1: Enable TypeScript in Your Expo Project

Your project already has TypeScript dependencies, but you need to create a TypeScript config:

```bash
# Create tsconfig.json if it doesn't exist
npx expo customize tsconfig.json
```

Or manually create `tsconfig.json` in your project root:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-native",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

### Step 2: Install TypeScript Types

```bash
npm install --save-dev @types/react @types/react-native typescript
```

### Step 3: Files Created

The following files have been created:

1. **`src/types/pickup.types.ts`** - TypeScript type definitions
2. **`src/constants/theme.ts`** - Theme constants (colors, spacing, etc.)
3. **`src/screens/donations/driver/PickupCompleteScreen.tsx`** - Main component

### Step 4: Update Your Navigation

Update your driver stack navigator to use the new screen:

**Before (JavaScript):**
```javascript
// In your driver navigation stack
import ViewScreen from './ViewScreen';

<Stack.Screen name="View" component={ViewScreen} />
```

**After (TypeScript):**
```typescript
import ViewScreen from './ViewScreen'; // Keep old one
import PickupCompleteScreen from './PickupCompleteScreen'; // Add new one

// You can run both in parallel during testing:
<Stack.Screen name="View" component={ViewScreen} />
<Stack.Screen name="PickupComplete" component={PickupCompleteScreen} />

// Then switch navigation to point to the new screen:
navigation.push('PickupComplete', { id, data });
```

---

## Testing the New Screen

### Option 1: Test Alongside Existing Screen

Keep both screens and add a test button in `ListScreen.js`:

```javascript
// In ListScreen.js
<ListItem
  key={id}
  onPress={() => {
    // Old screen
    navigation.push('View', { id, data });
  }}
  bottomDivider
>
  {/* ... existing content ... */}
</ListItem>

// Add a second button for testing new screen
<Button
  title="Test New Screen"
  onPress={() => {
    navigation.push('PickupComplete', { id, data });
  }}
/>
```

### Option 2: Direct Replacement

Simply update your navigation call:

```javascript
// Old
navigation.push('View', { id, data });

// New
navigation.push('PickupComplete', { id, data });
```

---

## Data Structure Changes

### Required Firestore Fields

The new screen expects these fields in your pickup data:

```typescript
{
  pickup: {
    driver: string,           // Driver ID (existing)
    date: Timestamp,          // Pickup date (existing)
    weight?: number,          // NEW: Weight in pounds
    category?: DonationCategory, // NEW: Food category
    receiptImage?: string,    // Storage path (existing)
    signatureImage?: string,  // Storage path (existing)
    noReceiptReason?: string, // NEW: Reason if no receipt
    noSignatureReason?: string, // NEW: Reason if no signature
  }
}
```

### Database Migration

Your existing data will work! The new fields are optional. Old pickups won't break.

If you want to make weight/category required in Firestore rules:

```javascript
// firestore.rules
match /pickedup/{docId} {
  allow create: if request.auth != null
    && request.resource.data.pickup.weight is number
    && request.resource.data.pickup.category is string;
}
```

---

## Customization

### Update Categories

Edit `src/types/pickup.types.ts` to add/remove categories:

```typescript
export enum DonationCategory {
  PRODUCE = 'produce',
  DAIRY = 'dairy',
  BAKERY = 'bakery',
  // Add your own categories here
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
}
```

### Change Colors

Edit `src/constants/theme.ts`:

```typescript
export const COLORS = {
  darkBlue: '#1A2B45',     // Change to your brand color
  brightBlue: '#4285F4',   // Change to your accent color
  orange: '#F38020',       // Change to your CTA color
  background: '#F5F6F8',   // Change to your background
};
```

### Adjust Validation Rules

In `PickupCompleteScreen.tsx`, modify the `validateForm` function:

```typescript
const validateForm = (values: PickupFormValues) => {
  const errors: Partial<Record<keyof PickupFormValues, string>> = {};

  // Make signature optional
  // Remove or comment out signature validation

  // Add maximum weight validation
  if (parseFloat(values.weight) > 500) {
    errors.weight = 'Weight cannot exceed 500 lbs';
  }

  return errors;
};
```

---

## Troubleshooting

### Issue: TypeScript errors in old JavaScript files

**Solution:** You can mix TypeScript and JavaScript! Your old `.js` files will continue to work. Only new files need to be `.tsx`.

### Issue: Import errors for types

**Solution:** Make sure your `tsconfig.json` includes the correct paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Issue: Picker not showing on iOS

**Solution:** The Picker component has known styling issues on iOS. If needed, wrap it:

```typescript
<View style={{ backgroundColor: COLORS.white }}>
  <Picker ... />
</View>
```

### Issue: Signature not saving

**Solution:** Check that your Firebase Storage security rules allow uploads:

```javascript
// storage.rules
match /signatures/{signatureId} {
  allow write: if request.auth != null;
}
match /receipts/{receiptId} {
  allow write: if request.auth != null;
}
```

### Issue: Images not uploading on Android

**Solution:** Ensure permissions are granted. Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow BDA Cali to access your photos",
          "cameraPermission": "Allow BDA Cali to use your camera"
        }
      ]
    ]
  }
}
```

---

## Comparison: Old vs New

| Feature | Old ViewScreen.js | New PickupCompleteScreen.tsx |
|---------|------------------|------------------------------|
| **Language** | JavaScript | TypeScript |
| **Weight Field** | ❌ No | ✅ Yes (required) |
| **Category Field** | ❌ No | ✅ Yes (required) |
| **Receipt Photo** | ✅ Yes | ✅ Yes (improved UI) |
| **No Receipt Option** | ✅ Yes | ✅ Yes (with reason) |
| **Signature** | ✅ Yes | ✅ Yes |
| **No Signature Option** | ❌ No | ✅ Yes (with reason) |
| **Navigation** | ✅ Yes | ✅ Yes (improved card) |
| **Visual Design** | Old blue (#0074cb) | New color scheme |
| **Type Safety** | ❌ No | ✅ Full TypeScript |
| **Form Validation** | Basic | Enhanced with clear errors |

---

## Rollback Plan

If you need to revert to the old screen:

1. Keep the old `ViewScreen.js` file (don't delete it)
2. In your navigator, simply change back:
   ```javascript
   navigation.push('View', { id, data }); // Old screen
   ```

3. The new files won't interfere with your app

---

## Next Steps

### Recommended Workflow

1. ✅ **Test in Development** - Use the new screen with test data
2. ✅ **Run a Pilot** - Have 1-2 drivers test the new workflow
3. ✅ **Gather Feedback** - Compare against user interview pain points
4. ✅ **Iterate** - Adjust based on real-world usage
5. ✅ **Full Rollout** - Replace old screen completely

### Future Enhancements

Consider adding:
- **Offline Support** - Cache pickups when no internet
- **Photo Compression** - Reduce image file sizes before upload
- **Barcode Scanning** - Quick item identification
- **Voice Input** - Hands-free weight entry
- **Multiple Photos** - Capture multiple receipt/item photos
- **Auto-categorization** - Suggest category based on donor history

---

## Support

If you encounter issues:

1. Check the console logs (filter by `[PickupComplete]`)
2. Verify Firebase permissions and rules
3. Test on both iOS and Android
4. Review the TypeScript errors carefully

---

## Summary

You now have a production-ready, TypeScript-based "Pickup Complete" screen that addresses all the pain points from your user interviews:

✅ Quick-capture mode (photo first, details after)
✅ Mandatory weight and category fields
✅ Flexible signature collection with fallback
✅ Improved visual hierarchy and color scheme
✅ Type-safe code for better maintainability

The screen works with your existing Expo setup - no migration to React Native CLI needed!
