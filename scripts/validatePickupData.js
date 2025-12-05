/**
 * Firestore Pickup Data Validator
 *
 * This script validates that pickup documents in Firestore
 * have the correct multi-item data structure.
 *
 * Usage:
 *   node scripts/validatePickupData.js [pickupId]
 *
 * If no pickupId provided, validates the most recent pickup.
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Valid donation categories
const VALID_CATEGORIES = [
  'produce',
  'dairy',
  'bakery',
  'canned_goods',
  'dry_goods',
  'meat',
  'frozen',
  'mixed',
  'other',
];

/**
 * Validates a single pickup item
 */
function validateItem(item, index) {
  const errors = [];

  // Check required fields
  if (!item.category) {
    errors.push(`Item ${index + 1}: Missing 'category'`);
  } else if (!VALID_CATEGORIES.includes(item.category)) {
    errors.push(`Item ${index + 1}: Invalid category '${item.category}'`);
  }

  if (typeof item.weight !== 'number') {
    errors.push(`Item ${index + 1}: 'weight' must be a number`);
  } else if (item.weight <= 0) {
    errors.push(`Item ${index + 1}: 'weight' must be > 0`);
  }

  if (typeof item.pricePerPound !== 'number') {
    errors.push(`Item ${index + 1}: 'pricePerPound' must be a number`);
  } else if (item.pricePerPound < 0) {
    errors.push(`Item ${index + 1}: 'pricePerPound' must be >= 0`);
  }

  if (typeof item.totalPrice !== 'number') {
    errors.push(`Item ${index + 1}: 'totalPrice' must be a number`);
  } else {
    // Verify calculation
    const expectedTotal = item.weight * item.pricePerPound;
    const diff = Math.abs(item.totalPrice - expectedTotal);
    if (diff > 0.01) {
      errors.push(
        `Item ${index + 1}: totalPrice (${item.totalPrice}) doesn't match weight × pricePerPound (${expectedTotal})`
      );
    }
  }

  return errors;
}

/**
 * Validates a pickup document
 */
function validatePickup(data, pickupId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Validating Pickup: ${pickupId}`);
  console.log('='.repeat(60));

  const errors = [];
  const warnings = [];

  // Check pickup structure
  if (!data.pickup) {
    errors.push('Missing "pickup" object');
    return { errors, warnings };
  }

  const pickup = data.pickup;

  // Validate items array
  if (!Array.isArray(pickup.items)) {
    errors.push('Missing or invalid "items" array');
  } else if (pickup.items.length === 0) {
    errors.push('"items" array is empty');
  } else {
    console.log(`\n📦 Items: ${pickup.items.length}`);
    console.log('-'.repeat(60));

    pickup.items.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(`  Category: ${item.category}`);
      console.log(`  Weight: ${item.weight} lbs`);
      console.log(`  Price/lb: $${item.pricePerPound.toFixed(2)}`);
      console.log(`  Total: $${item.totalPrice.toFixed(2)}`);

      const itemErrors = validateItem(item, index);
      errors.push(...itemErrors);
    });
  }

  // Validate totalValue
  if (typeof pickup.totalValue !== 'number') {
    errors.push('"totalValue" must be a number');
  } else if (Array.isArray(pickup.items) && pickup.items.length > 0) {
    const expectedTotal = pickup.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const diff = Math.abs(pickup.totalValue - expectedTotal);
    if (diff > 0.01) {
      errors.push(
        `"totalValue" (${pickup.totalValue}) doesn't match sum of item.totalPrice (${expectedTotal})`
      );
    }
  }

  // Validate legacy weight field
  if (typeof pickup.weight !== 'number') {
    warnings.push('Legacy "weight" field is missing or not a number');
  } else if (Array.isArray(pickup.items) && pickup.items.length > 0) {
    const expectedWeight = pickup.items.reduce((sum, item) => sum + item.weight, 0);
    const diff = Math.abs(pickup.weight - expectedWeight);
    if (diff > 0.01) {
      warnings.push(
        `Legacy "weight" (${pickup.weight}) doesn't match sum of item.weight (${expectedWeight})`
      );
    }
  }

  // Validate category field
  if (!pickup.category) {
    warnings.push('Legacy "category" field is missing');
  } else if (Array.isArray(pickup.items) && pickup.items.length > 1) {
    if (pickup.category !== 'mixed') {
      warnings.push(
        `Multiple items but category is "${pickup.category}" (expected "mixed")`
      );
    }
  } else if (Array.isArray(pickup.items) && pickup.items.length === 1) {
    if (pickup.category !== pickup.items[0].category) {
      warnings.push(
        `Single item but category is "${pickup.category}" (expected "${pickup.items[0].category}")`
      );
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Value: $${pickup.totalValue?.toFixed(2) || 'N/A'}`);
  console.log(`Total Weight: ${pickup.weight || 'N/A'} lbs`);
  console.log(`Category: ${pickup.category || 'N/A'}`);

  if (pickup.receiptImage) {
    console.log(`Receipt Image: ✅ ${pickup.receiptImage}`);
  } else if (pickup.noReceiptReason) {
    console.log(`Receipt: ❌ (Reason: ${pickup.noReceiptReason})`);
  } else {
    console.log('Receipt: ⚠️  No image or reason');
  }

  if (pickup.signatureImage) {
    console.log(`Signature: ✅ ${pickup.signatureImage}`);
  } else if (pickup.noSignatureReason) {
    console.log(`Signature: ❌ (Reason: ${pickup.noSignatureReason})`);
  } else {
    console.log('Signature: ⚠️  No signature or reason');
  }

  return { errors, warnings };
}

/**
 * Main function
 */
async function main() {
  try {
    const pickupId = process.argv[2];
    let pickupData;
    let docId;

    if (pickupId) {
      // Validate specific pickup
      console.log(`🔍 Looking for pickup: ${pickupId}`);
      const docRef = db.collection('pickedup').doc(pickupId);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.error(`❌ Pickup not found: ${pickupId}`);
        process.exit(1);
      }

      pickupData = doc.data();
      docId = pickupId;
    } else {
      // Get most recent pickup
      console.log('🔍 Getting most recent pickup...');
      const snapshot = await db
        .collection('pickedup')
        .orderBy('pickup.date', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.error('❌ No pickups found in "pickedup" collection');
        process.exit(1);
      }

      const doc = snapshot.docs[0];
      pickupData = doc.data();
      docId = doc.id;
    }

    // Validate pickup
    const { errors, warnings } = validatePickup(pickupData, docId);

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('🔍 VALIDATION RESULTS');
    console.log('='.repeat(60));

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All validations passed!');
    } else {
      if (errors.length > 0) {
        console.log(`\n❌ Errors (${errors.length}):`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

      if (warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${warnings.length}):`);
        warnings.forEach((warning, index) => {
          console.log(`  ${index + 1}. ${warning}`);
        });
      }
    }

    console.log('='.repeat(60) + '\n');

    // Exit with appropriate code
    process.exit(errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run validation
main();
