#!/usr/bin/env node
/**
 * Seeds test pickups for a specific driver for TODAY
 *
 * Usage: node scripts/seedTestPickups.js
 */
const path = require('path');
const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker');

const serviceAccount = require(path.resolve('./firebase-service-account.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// Driver UID from the logs
const DRIVER_UID = '2ZIs12onUpeHC3Crl85TI9DxgDb2';
const DRIVER_NAME = 'Deborah Schmitt';

// Sample addresses in San Jose area
const addresses = [
    { formatted: '1234 Market St, San Jose, CA 95113', lat: 37.3361, lng: -121.8905 },
    { formatted: '567 First St, San Jose, CA 95112', lat: 37.3479, lng: -121.8947 },
    { formatted: '890 Santa Clara St, San Jose, CA 95113', lat: 37.3394, lng: -121.8864 },
    { formatted: '321 San Carlos St, San Jose, CA 95110', lat: 37.3305, lng: -121.8889 },
    { formatted: '456 Park Ave, San Jose, CA 95110', lat: 37.3315, lng: -121.8906 },
];

// Sample organization names
const orgNames = [
    'Safeway - Market Street',
    'Whole Foods Market',
    'Trader Joe\'s',
    'Local Bakery',
    'Community Kitchen',
];

// Donation types
const donationTypes = [
    { type: 'perishable', packaging: 'Boxes', quantity: '5-10 boxes' },
    { type: 'nonperish', packaging: 'Pallets', quantity: '2 pallets' },
    { type: 'perishable', packaging: 'Bags', quantity: '15 bags' },
    { type: 'nonperish', packaging: 'Boxes', quantity: '20 boxes' },
];

async function createTestPickup(index) {
    const docId = `test-pickup-${Date.now()}-${index}`;

    // Set pickup date to today (various times throughout the day)
    const today = new Date();
    const hours = 8 + (index * 2); // Spread pickups throughout the day
    today.setHours(hours, 0, 0, 0);
    const pickupDate = admin.firestore.Timestamp.fromDate(today);

    const address = addresses[index % addresses.length];
    const orgName = orgNames[index % orgNames.length];
    const donation = donationTypes[index % donationTypes.length];

    const payload = {
        dateCreated: admin.firestore.Timestamp.now(),
        client: {
            type: 'org',
            address: address,
        },
        org: {
            name: orgName,
        },
        donation: {
            taxDeduction: true,
            type: donation.type,
            packaging: donation.packaging,
            quantity: donation.quantity,
            perishable: donation.type === 'perishable' ? 'Yes' : null,
        },
        pickup: {
            driver: DRIVER_UID,
            driverName: DRIVER_NAME,
            driverPlate: '8ABC123',
            date: pickupDate,
        },
    };

    await db.collection('accepted').doc(docId).set(payload);
    console.log(`✓ Created pickup ${index + 1}: ${orgName} at ${hours}:00`);
    return docId;
}

async function seedTestPickups() {
    console.log('🌱 Seeding test pickups for Deborah Schmitt...\n');
    console.log(`Driver UID: ${DRIVER_UID}`);
    console.log(`Driver Name: ${DRIVER_NAME}\n`);

    const pickupIds = [];

    // Create 5 test pickups for today
    for (let i = 0; i < 5; i++) {
        const docId = await createTestPickup(i);
        pickupIds.push(docId);
    }

    console.log(`\n✅ Successfully created ${pickupIds.length} test pickups!`);
    console.log('\n📱 Restart your app and login as:');
    console.log('   Email: deborah.schmitt2@driver.demo.bdacali.com');
    console.log('\n🎉 You should now see 5 pickups in the list!');
}

seedTestPickups()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Failed to seed test pickups:', error);
        process.exit(1);
    });
