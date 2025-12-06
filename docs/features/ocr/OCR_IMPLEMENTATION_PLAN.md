# OCR Receipt Scanning Implementation Plan
## Google Cloud Vision API Integration

**Goal:** Enable drivers to scan receipts and auto-populate pickup items

**Timeline:** 2-3 days (can be done in phases)

---

## 📋 Overview

This plan implements OCR (Optical Character Recognition) to automatically extract items, quantities, and prices from receipt photos using Google Cloud Vision API.

**User Flow:**
```
1. Driver captures receipt photo
2. Driver clicks "Scan Receipt" button
3. App uploads photo to Firebase Storage
4. Cloud Function calls Vision API
5. Text is extracted and parsed
6. Items auto-populate in the form
7. Driver reviews/edits items
8. Driver completes pickup
```

**Cost:** FREE for up to 1,000 receipts/month, then $1.50 per 1,000 receipts

---

## 🎯 Phase 1: Google Cloud Setup (30 minutes)

### Step 1.1: Enable Cloud Vision API

**Action Items:**
1. Go to: https://console.cloud.google.com/apis/library/vision.googleapis.com?project=bda-cali
2. Click "Enable" button
3. Wait for API to activate (~1 minute)

**Verification:**
- Green checkmark appears next to "Cloud Vision API"
- API shows as "Enabled" in console

---

### Step 1.2: Set Up Billing (Required)

**Why Required:** Google Cloud Vision API requires a billing account even though free tier covers 1,000 requests/month.

**Action Items:**
1. Go to: https://console.cloud.google.com/billing?project=bda-cali
2. Click "Link a billing account"
3. If you don't have one, click "Create billing account"
4. Enter payment information (credit/debit card)
5. Accept terms and conditions

**Important:**
- You will NOT be charged for the first 1,000 requests/month
- Google requires a card on file but won't auto-charge without confirmation
- You can set up budget alerts to prevent unexpected charges

**Set Budget Alert (Recommended):**
1. Go to: https://console.cloud.google.com/billing/budgets
2. Click "Create Budget"
3. Set amount: $20/month
4. Set alert at 50%, 90%, 100%
5. Add your email for notifications

**Verification:**
- Billing account shows as "Active"
- No charges should appear yet

---

### Step 1.3: Verify Firebase Project Permissions

**Action Items:**
1. Go to: https://console.cloud.google.com/iam-admin/iam?project=bda-cali
2. Find "App Engine default service account" (ends with @appspot.gserviceaccount.com)
3. Verify it has "Cloud Vision API User" role
4. If not, click "Edit" → "Add Another Role" → "Cloud Vision API User" → Save

**Verification:**
- Service account has necessary permissions
- No permission errors when deploying functions

---

## 🔧 Phase 2: Backend Implementation (4-6 hours)

### Step 2.1: Initialize Firebase Functions

**Check if functions exist:**
```bash
cd /Users/yaoyaopeng/Documents/BDA-Cali
ls -la functions/
```

**If functions/ doesn't exist, initialize:**
```bash
firebase init functions
# Select:
# - Use existing project: bda-cali
# - Language: JavaScript
# - ESLint: No (optional)
# - Install dependencies: Yes
```

**If functions/ already exists, skip to Step 2.2**

---

### Step 2.2: Install Dependencies

**Navigate to functions directory:**
```bash
cd /Users/yaoyaopeng/Documents/BDA-Cali/functions
```

**Install Google Cloud Vision:**
```bash
npm install @google-cloud/vision@4.0.2
```

**Verify package.json includes:**
```json
{
  "dependencies": {
    "firebase-admin": "^11.0.0",
    "firebase-functions": "^4.0.0",
    "@google-cloud/vision": "^4.0.2"
  }
}
```

---

### Step 2.3: Create OCR Cloud Function

**File:** `/Users/yaoyaopeng/Documents/BDA-Cali/functions/index.js`

**Implementation:** See code below (will create in next step)

**Key Components:**
1. `processReceiptOCR` - Main HTTPS callable function
2. `parseReceiptText` - Extract items from OCR text
3. `classifyCategory` - Map items to categories
4. `inferPackagingType` - Determine packaging type

---

### Step 2.4: Deploy Functions

**Deploy command:**
```bash
cd /Users/yaoyaopeng/Documents/BDA-Cali/functions
firebase deploy --only functions
```

**Expected output:**
```
✔ functions: Finished running predeploy script.
i functions: preparing functions directory for uploading...
i functions: packaged functions (X KB) for uploading
✔ functions: functions folder uploaded successfully
i functions: creating Node.js 18 function processReceiptOCR(us-central1)...
✔ functions[processReceiptOCR(us-central1)]: Successful create operation.
Function URL: https://us-central1-bda-cali.cloudfunctions.net/processReceiptOCR

✔ Deploy complete!
```

**Verification:**
1. Go to: https://console.firebase.google.com/project/bda-cali/functions
2. Verify "processReceiptOCR" function appears
3. Status should be "Healthy" (green checkmark)

---

## 📱 Phase 3: Frontend Implementation (6-8 hours)

### Step 3.1: Create OCR Service Module

**File:** `/Users/yaoyaopeng/Documents/BDA-Cali/src/services/ocrService.ts`

**Features:**
- Upload receipt image to Firebase Storage
- Call Cloud Function to process OCR
- Handle errors gracefully
- Return parsed items in PickupItem format

---

### Step 3.2: Update PickupCompleteScreenV2

**File:** `/Users/yaoyaopeng/Documents/BDA-Cali/src/screens/donations/driver/PickupCompleteScreenV2.tsx`

**Changes:**
1. Import OCR service
2. Add `isProcessingOCR` state
3. Add `ocrResult` state
4. Create `handleScanReceipt` function
5. Add "Scan Receipt" button in UI
6. Add confidence badge display

---

### Step 3.3: Update PickupItemsListV3 with Confidence Badges

**File:** `/Users/yaoyaopeng/Documents/BDA-Cali/src/components/PickupItemsListV3.tsx`

**Changes:**
1. Add optional `confidence` field to PickupItem type
2. Display confidence badges for items with confidence < 0.85
3. Add warning badge for items with confidence < 0.75
4. Style badges appropriately

---

## 🧪 Phase 4: Testing (4-6 hours)

### Step 4.1: Test with Sample Receipts

**Test Cases:**

1. **High Quality Receipt** (Expected: High confidence)
   - Clear printed receipt from supermarket
   - Good lighting
   - All text readable

2. **Medium Quality Receipt** (Expected: Medium confidence)
   - Thermal receipt (faded)
   - Slightly blurry
   - Some text hard to read

3. **Low Quality Receipt** (Expected: Should fail gracefully)
   - Very blurry
   - Poor lighting
   - Handwritten

4. **Spanish Receipt** (Expected: Should work)
   - Receipt with Spanish text
   - Special characters (ñ, á, é, etc.)

---

### Step 4.2: Verify Data Accuracy

**Checklist:**
- [ ] Item names extracted correctly
- [ ] Quantities extracted correctly
- [ ] Prices extracted correctly
- [ ] Categories auto-assigned reasonably
- [ ] Packaging types inferred correctly
- [ ] Total values calculated correctly

---

### Step 4.3: Test Error Scenarios

**Scenarios:**
- [ ] Upload fails (no internet)
- [ ] OCR fails (no text detected)
- [ ] Vision API returns error
- [ ] Low confidence results
- [ ] Cloud Function timeout
- [ ] Malformed receipt data

---

## 📊 Success Metrics

**Accuracy Targets:**
- Text extraction: >90% accuracy
- Item parsing: >80% accuracy
- Category classification: >70% accuracy
- Price extraction: >95% accuracy

**Performance Targets:**
- Upload time: <3 seconds
- OCR processing: <5 seconds
- Total time: <10 seconds

**User Experience Targets:**
- Auto-fill saves >5 minutes per pickup
- Reduces manual entry errors by >50%
- Works on 80%+ of receipt types

---

## 💰 Cost Estimation

**Monthly Volume Scenarios:**

| Pickups/Month | OCR Calls | Free Tier | Paid | Total Cost |
|---------------|-----------|-----------|------|------------|
| 100           | 100       | 100       | 0    | $0         |
| 500           | 500       | 500       | 0    | $0         |
| 1,000         | 1,000     | 1,000     | 0    | $0         |
| 2,000         | 2,000     | 1,000     | 1,000| $1.50      |
| 5,000         | 5,000     | 1,000     | 4,000| $6.00      |
| 10,000        | 10,000    | 1,000     | 9,000| $13.50     |

**Pricing:** $1.50 per 1,000 requests after free tier

---

## 🚀 Deployment Checklist

**Before Production:**
- [ ] Enable Cloud Vision API
- [ ] Set up billing account
- [ ] Set budget alerts ($20/month recommended)
- [ ] Deploy Cloud Functions
- [ ] Test with 10+ real receipts
- [ ] Verify error handling works
- [ ] Update Firebase security rules if needed
- [ ] Train drivers on how to use OCR feature
- [ ] Create troubleshooting guide

**Post-Deployment Monitoring:**
- [ ] Monitor Vision API usage dashboard
- [ ] Track costs daily for first week
- [ ] Collect driver feedback
- [ ] Monitor error rates in Cloud Functions logs
- [ ] Review auto-populated data accuracy

---

## 🔍 Troubleshooting

**Common Issues:**

### "Permission Denied" when calling Vision API
**Solution:** Verify billing is set up and Vision API is enabled

### "Cloud Function times out"
**Solution:** Increase timeout in functions/index.js:
```javascript
exports.processReceiptOCR = functions
  .runWith({ timeoutSeconds: 60 })
  .https.onCall(async (data, context) => { ... });
```

### "No text detected in receipt"
**Solution:** Ensure image quality is good, suggest retaking photo with better lighting

### "Low confidence results"
**Solution:** Add image preprocessing (resize, enhance contrast) before OCR

---

## 📚 Resources

**Documentation:**
- Google Cloud Vision API: https://cloud.google.com/vision/docs
- Firebase Cloud Functions: https://firebase.google.com/docs/functions
- React Native Firebase: https://rnfirebase.io

**Pricing:**
- Vision API Pricing: https://cloud.google.com/vision/pricing
- Firebase Pricing: https://firebase.google.com/pricing

**Support:**
- GCP Console: https://console.cloud.google.com
- Firebase Console: https://console.firebase.google.com
- Stack Overflow: https://stackoverflow.com/questions/tagged/google-cloud-vision

---

## 🎯 Next Steps

Ready to begin? Let's start with:

**Step 1:** Enable Cloud Vision API (2 minutes)
**Step 2:** Set up billing (5 minutes)
**Step 3:** Create Cloud Function (30 minutes)

Let me know when you're ready to proceed with Step 1!
