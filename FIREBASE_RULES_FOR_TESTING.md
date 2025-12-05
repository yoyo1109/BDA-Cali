# Firebase Rules Configuration for Testing

## Overview

You have **two separate rule sets** in Firebase:
1. **Firestore Rules** - Controls access to database collections (pending, accepted, pickedup, users)
2. **Storage Rules** - Controls access to uploaded files (receipts, signatures)

Both need to be configured to allow testing.

---

## Option 1: Temporary Open Rules (Fastest for Testing)

⚠️ **WARNING: These rules allow anyone to read/write. Only use for testing, never in production!**

### Step 1: Update Firestore Rules

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/cali-food-bank/firestore/rules
   ```

2. **Click "Rules" tab**

3. **Replace with these TEST rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TESTING ONLY - Allow all read/write
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. **Click "Publish"**

### Step 2: Update Storage Rules

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/cali-food-bank/storage/rules
   ```

2. **Click "Rules" tab**

3. **Replace with these TEST rules:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // TESTING ONLY - Allow all read/write
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

4. **Click "Publish"**

### Step 3: Test Your App

Now you can:
- ✅ Create pickups
- ✅ Upload receipt images
- ✅ Upload signature images
- ✅ Complete pickups
- ✅ Move documents between collections

### Step 4: Restore Production Rules (IMPORTANT!)

After testing, restore the secure rules (see Option 2 below).

---

## Option 2: Production-Ready Authenticated Rules (Recommended)

These rules are secure and only allow authenticated users with proper roles.

### Firestore Rules (Production)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function userRole() {
      return isSignedIn()
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.type
        : null;
    }

    function isAdmin() {
      return userRole() == 'admin';
    }

    function isWarehouse() {
      return userRole() == 'warehouse';
    }

    function isDriver() {
      return userRole() == 'driver';
    }

    function isAdminOrWarehouse() {
      return isAdmin() || isWarehouse();
    }

    // Users collection
    match /users/{uid} {
      allow read: if isSignedIn() && (request.auth.uid == uid || isAdminOrWarehouse());
      allow create: if isSignedIn() && isAdminOrWarehouse();
      allow update, delete: if isSignedIn() && (request.auth.uid == uid || isAdminOrWarehouse());
    }

    // Pending pickups (warehouse/admin only)
    match /pending/{docId} {
      allow read, write: if isAdminOrWarehouse();
    }

    // Accepted pickups (warehouse/admin can read/write, driver can read/update their own)
    match /accepted/{docId} {
      allow read, write: if isAdminOrWarehouse();
      allow read, update, delete: if isDriver() && resource.data.pickup.driver == request.auth.uid;
    }

    // Completed pickups
    match /pickedup/{docId} {
      allow read, write: if isAdminOrWarehouse();
      // Allow drivers to CREATE completed pickups for their own pickups
      allow create: if isDriver();
      allow read: if isDriver() && resource.data.pickup.driver == request.auth.uid;
    }
  }
}
```

### Storage Rules (Production)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function isDriver() {
      return isSignedIn() &&
             firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.type == 'driver';
    }

    function isAdminOrWarehouse() {
      let userData = firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data;
      return isSignedIn() && (userData.type == 'admin' || userData.type == 'warehouse');
    }

    // Receipt images
    match /receipts/{receiptId} {
      // Drivers can upload receipts
      allow write: if isDriver();
      // Admin and warehouse can read all receipts
      allow read: if isAdminOrWarehouse();
    }

    // Signature images
    match /signatures/{signatureId} {
      // Drivers can upload signatures
      allow write: if isDriver();
      // Admin and warehouse can read all signatures
      allow read: if isAdminOrWarehouse();
    }
  }
}
```

---

## Option 3: Hybrid Approach (Testing with Authentication)

Use production rules but authenticate as a test driver.

### Step 1: Create Test Driver User

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/cali-food-bank/authentication/users
   ```

2. **Click "Add user"**

3. **Enter:**
   - Email: `testdriver@bdacali.com`
   - Password: `TestDriver123!`

4. **Copy the UID** (you'll need this)

### Step 2: Add Test Driver to Firestore

1. **Go to Firestore:**
   ```
   https://console.firebase.google.com/project/cali-food-bank/firestore/data
   ```

2. **Click "Start collection"** (if `users` doesn't exist)
   - Collection ID: `users`

3. **Add document:**
   - Document ID: `[paste the UID from step 1]`
   - Fields:
     ```
     email: "testdriver@bdacali.com"
     displayName: "Test Driver"
     type: "driver"
     active: true
     createdAt: [current timestamp]
     ```

### Step 3: Sign In as Test Driver in App

In your app, sign in with:
- Email: `testdriver@bdacali.com`
- Password: `TestDriver123!`

Now you can test with production-ready rules!

---

## Quick Fix for Your Current Issue

Based on your issue, here's the **fastest solution**:

### Deploy This to Firebase Console

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Open for testing
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;  // Open for testing
    }
  }
}
```

### Where to Deploy:

1. **Firestore:** https://console.firebase.google.com/project/cali-food-bank/firestore/rules
2. **Storage:** https://console.firebase.google.com/project/cali-food-bank/storage/rules

Click **"Publish"** on both pages.

---

## Verification Steps

After deploying rules, verify they work:

### Test Firestore Access

```bash
node scripts/seedTestData.js
```

Should succeed without permission errors.

### Test Storage Access

In your app:
1. Complete a pickup
2. Upload receipt image
3. Upload signature image
4. Check Firebase Storage console - files should appear

---

## Common Issues

### Issue 1: "Permission Denied" on Firestore
**Solution:** Firestore rules not deployed. Go to console and publish rules.

### Issue 2: "Permission Denied" on Storage
**Solution:** Storage rules are **separate** from Firestore. Deploy storage rules too.

### Issue 3: Rules deployed but still getting errors
**Solution:** Wait 1-2 minutes for rules to propagate globally.

### Issue 4: Can't find Storage rules
**Solution:**
1. Go to Firebase Console → Storage
2. Click "Rules" tab at top
3. If you see "Get Started", click it to initialize Storage

---

## Rules Comparison

| Rule Type | Security | Use Case | Setup Time |
|-----------|----------|----------|------------|
| **Open (if true)** | ⚠️ None | Quick testing | 2 minutes |
| **Authenticated** | ✅ Medium | Development | 10 minutes |
| **Role-based** | ✅✅ High | Production | 20 minutes |

---

## Next Steps

1. **For immediate testing:** Use Option 1 (Open rules)
2. **Run your tests:** Complete pickups, upload images
3. **Before production:** Switch to Option 2 (Production rules)
4. **Create test accounts:** Set up test driver/admin/warehouse users

---

## File Locations in Your Project

- Firestore rules: `/firestore.rules`
- Storage rules: Create `/storage.rules` (doesn't exist yet)
- Deploy via: Firebase Console (manual) or `firebase deploy --only firestore:rules,storage`

---

## Security Best Practices

✅ **DO:**
- Use role-based authentication in production
- Test with real user accounts before launch
- Keep test rules in a separate file
- Document which rules are active

❌ **DON'T:**
- Deploy `if true` rules to production
- Share test credentials publicly
- Leave storage publicly accessible
- Skip authentication in production

---

## Summary

**Immediate Fix (2 minutes):**
1. Go to Firestore Rules → Replace with `allow read, write: if true`
2. Go to Storage Rules → Replace with `allow read, write: if true`
3. Click "Publish" on both
4. Test your app

**Production Setup (20 minutes):**
1. Use the role-based rules provided above
2. Create test driver account
3. Add driver to `users` collection with `type: "driver"`
4. Sign in with test account
5. Test with secure rules

Your app should work perfectly after applying these rules! 🎉
