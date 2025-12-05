# Quick Firebase Setup for Testing - 2 Minute Guide

## 🚀 Fastest Way to Enable Testing

### Step 1: Open Firestore Rules (30 seconds)

1. Go to: https://console.firebase.google.com/project/cali-food-bank/firestore/rules
2. **Replace ALL content** with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

### Step 2: Open Storage Rules (30 seconds)

1. Go to: https://console.firebase.google.com/project/cali-food-bank/storage
2. Click **"Get Started"** if you haven't initialized Storage
3. Click **"Rules"** tab at the top
4. **Replace ALL content** with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **"Publish"**

### Step 3: Wait & Test (30 seconds)

1. Wait **30-60 seconds** for rules to propagate
2. Reload your app (Cmd+R in simulator)
3. Try completing a pickup with receipt upload
4. ✅ Should work!

---

## ⚠️ IMPORTANT: Security Warning

These rules allow **ANYONE** to read/write your database and storage!

**Only use for testing. Never deploy to production.**

After testing, restore secure rules from `FIREBASE_RULES_FOR_TESTING.md`.

---

## 🔧 Troubleshooting

### Still getting "Permission Denied"?

**Firestore:**
- Check you published the rules (green checkmark appears)
- Wait 1-2 minutes for global propagation
- Check the correct project (cali-food-bank)

**Storage:**
- Make sure you're on the "Rules" tab, not "Files" tab
- If you see "Get Started", click it first to initialize Storage
- Check bucket name matches your config (`cali-food-bank.appspot.com`)

### How to verify rules are active?

**Firestore:**
```bash
# In your terminal
node scripts/seedTestData.js
```
Should succeed without errors.

**Storage:**
Open your app and try uploading a receipt. Check the logs:
```
[PickupCompleteV2] Uploading receipt image...
[PickupCompleteV2] Receipt uploaded successfully: https://...
```

---

## 📋 Quick Checklist

- [ ] Firestore rules updated to `allow read, write: if true`
- [ ] Firestore rules published (green checkmark)
- [ ] Storage initialized (not showing "Get Started")
- [ ] Storage rules updated to `allow read, write: if true`
- [ ] Storage rules published (green checkmark)
- [ ] Waited 1-2 minutes for propagation
- [ ] App reloaded (Cmd+R)
- [ ] Test upload working

---

## 🎯 What This Enables

✅ Create/read/update/delete any Firestore documents
✅ Upload receipt images to Storage
✅ Upload signature images to Storage
✅ Complete pickups without authentication errors
✅ Run seed scripts to add test data

---

## 🔐 Restore Production Rules Later

See `FIREBASE_RULES_FOR_TESTING.md` for secure production rules with:
- Role-based authentication (admin, warehouse, driver)
- Proper access control
- Secure image upload permissions

---

## Links

- **Firestore Rules:** https://console.firebase.google.com/project/cali-food-bank/firestore/rules
- **Storage Rules:** https://console.firebase.google.com/project/cali-food-bank/storage/rules
- **Authentication:** https://console.firebase.google.com/project/cali-food-bank/authentication/users
- **Firestore Data:** https://console.firebase.google.com/project/cali-food-bank/firestore/data
- **Storage Files:** https://console.firebase.google.com/project/cali-food-bank/storage/files

---

**Total Time: 2 minutes** ⏱️

**Result: Full testing access** ✅
