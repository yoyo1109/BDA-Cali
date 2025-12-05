#!/usr/bin/env node
/**
 * Add Access Notes to Deborah's Pickups
 *
 * This script adds dock codes and loading tips to existing pickup records
 * in the Firestore database to help drivers navigate to locations.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json npm run add:access-notes
 */

const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountPath) {
  console.error(
    'Missing FIREBASE_SERVICE_ACCOUNT env var. Set it to the path of a service-account JSON file.'
  );
  console.error('Usage: FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json npm run add:access-notes');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = require(path.resolve(serviceAccountPath));
} catch (err) {
  console.error(`Failed to load service account from ${serviceAccountPath}:`, err.message);
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Access notes data for Deborah's pickups
const accessNotes = [
  {
    pickupId: 'seed-2ZIs12onUpeHC3Crl85TI9DxgDb2-1764971448940-1',
    dockCode: 'Loading Dock B',
    loadingTips: 'Commercial bakery - use rear entrance off Williamson View. Ring bell at service door. Pallets will be ready on loading dock. Bring hand truck. Contact: Maria (Manager) - available 8am-10am.'
  },
  {
    pickupId: 'seed-2ZIs12onUpeHC3Crl85TI9DxgDb2-1764971449160-2',
    dockCode: 'Gate 3 (South Side)',
    loadingTips: 'Large warehouse facility. Enter through main gate, show ID to security. Drive to Gate 3 on south side of building. Donation will be staged in refrigerated area. Ask for Juan at receiving desk. Note: Gate closes at 4pm.'
  },
  {
    pickupId: 'seed-2ZIs12onUpeHC3Crl85TI9DxgDb2-1764971449332-3',
    dockCode: 'Rear Alley Access',
    loadingTips: 'Restaurant location - park in alley behind building. Kitchen staff will bring items to back door. Mostly bagged goods and produce. Call ahead 15 mins before arrival: (555) 123-4567. Ask for Chef Roberto.'
  },
  {
    pickupId: 'seed-2ZIs12onUpeHC3Crl85TI9DxgDb2-1764971449473-4',
    dockCode: 'Service Entrance A',
    loadingTips: 'Grocery store - use Service Entrance A on east side of building (near employee parking). Enter code #2468 at door. Items will be in carts by dairy cooler. Store manager Carlos will assist. Best to arrive before 10am to avoid delivery trucks.'
  },
  {
    pickupId: 'seed-2ZIs12onUpeHC3Crl85TI9DxgDb2-1764971449623-5',
    dockCode: 'Front Loading Zone',
    loadingTips: 'Downtown location - limited parking. Use 15-min loading zone in front of building. Donation is pre-boxed and stored in ground floor storage room. Ring apartment buzzer #101. Contact: Sarah Chen. Elevator available for large items.'
  },
  {
    pickupId: 'seed-2ZIs12onUpeHC3Crl85TI9DxgDb2-1764971449786-6',
    dockCode: 'Bay 7 (West Wing)',
    loadingTips: 'Distribution center - enter main entrance, take visitor badge at reception. Proceed to West Wing, Bay 7. Donation includes palletized canned goods. Forklift assistance available. Contact: Operations Manager Lisa - ext. 345. Requires hard hat (provided at reception).'
  }
];

async function addAccessNotesToPickups() {
  console.log('🚀 Starting to add access notes to pickups...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const note of accessNotes) {
    try {
      const { pickupId, dockCode, loadingTips } = note;

      console.log(`📍 Processing pickup: ${pickupId}`);

      // Check if pickup exists in 'accepted' collection
      const acceptedRef = db.collection('accepted').doc(pickupId);
      const acceptedDoc = await acceptedRef.get();

      if (acceptedDoc.exists) {
        // Update the pickup.dockCode and pickup.loadingTips fields
        await acceptedRef.update({
          'pickup.dockCode': dockCode,
          'pickup.loadingTips': loadingTips
        });

        console.log(`✅ Added access notes to pickup ${pickupId}`);
        console.log(`   Dock Code: ${dockCode}`);
        console.log(`   Loading Tips: ${loadingTips.substring(0, 50)}...\n`);
        successCount++;
      } else {
        console.log(`⚠️  Pickup ${pickupId} not found in 'accepted' collection\n`);
        errorCount++;
      }

    } catch (error) {
      console.error(`❌ Error processing pickup ${note.pickupId}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Successfully updated: ${successCount} pickups`);
  console.log(`   ❌ Errors/Not found: ${errorCount} pickups`);
  console.log('='.repeat(60));

  // Exit
  process.exit(0);
}

// Run the script
addAccessNotesToPickups().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
