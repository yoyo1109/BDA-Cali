#!/usr/bin/env node
/**
 * Seeds the Firestore `accepted` collection with a sample pickup assigned to a driver.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json \
 *   DRIVER_UID=<driverUid> npm run seed:accepted
 *
 * The DRIVER_UID should be the uid of an existing driver user document.
 */
const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const driverUid = process.env.DRIVER_UID;

if (!serviceAccountPath) {
    console.error(
        'Missing FIREBASE_SERVICE_ACCOUNT env var. Set it to the path of a service-account JSON file.'
    );
    process.exit(1);
}

if (!driverUid) {
    console.error(
        'Missing DRIVER_UID env var. Set it to the UID of the driver to assign the pickup to.'
    );
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = require(path.resolve(serviceAccountPath));
} catch (error) {
    console.error(
        `Unable to read service account JSON at ${serviceAccountPath}`,
        error
    );
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function seedAccepted() {
    const docId = `sample-accepted-${Date.now()}`;
    const now = admin.firestore.Timestamp.now();

    const payload = {
        dateCreated: now,
        client: {
            type: 'org',
            address: {
                formatted: '42 Airport Pkwy, San Jose, CA 95110',
                lat: 37.3657,
                lng: -121.922,
            },
        },
        org: {
            name: 'Bay Area Food Hub',
        },
        donation: {
            taxDeduction: true,
            type: 'nonperish',
            packaging: 'Pallets',
            quantity: '120 cases',
            perishable: null,
        },
        pickup: {
            driver: driverUid,
            driverName: 'Sample Driver',
            driverPlate: '8ABC123',
            date: now,
        },
    };

    await db.collection('accepted').doc(docId).set(payload);
    console.log(
        `Created accepted/${docId} assigned to driver ${driverUid}. Launch the driver app to see the record under Pickups.`
    );
}

seedAccepted()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to seed accepted collection', error);
        process.exit(1);
    });
