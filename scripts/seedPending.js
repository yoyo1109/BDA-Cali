#!/usr/bin/env node
/**
 * Seeds the Firestore `pending` collection with a couple of sample donations.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json npm run seed:pending
 *
 * The FIREBASE_SERVICE_ACCOUNT env var must point to a Firebase service-account
 * JSON file that has access to the target project.
 */
const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountPath) {
    console.error(
        'Missing FIREBASE_SERVICE_ACCOUNT env var. Set it to the path of a service-account JSON file.'
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

const now = new Date();

const donations = [
    {
        id: 'demo-org-donation',
        data: {
            dateCreated: admin.firestore.Timestamp.fromDate(
                new Date(now.getTime() - 1000 * 60 * 60 * 24)
            ),
            client: {
                type: 'org',
                address: {
                    formatted: '123 Main St, San Jose, CA 95192',
                    lat: 37.3352,
                    lng: -121.8811,
                },
            },
            org: {
                name: 'South Bay Food Collective',
            },
            donation: {
                taxDeduction: true,
                type: 'perish',
                packaging: 'Pallets',
                quantity: '360 lbs produce',
                perishable: {
                    expiration: admin.firestore.Timestamp.fromDate(
                        new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5)
                    ),
                    traits: 'Keep refrigerated',
                },
            },
            pickup: {},
        },
    },
    {
        id: 'demo-indiv-donation',
        data: {
            dateCreated: admin.firestore.Timestamp.fromDate(now),
            client: {
                type: 'indiv',
                address: {
                    formatted: '987 Market St, San Francisco, CA 94103',
                    lat: 37.7823,
                    lng: -122.4103,
                },
            },
            indiv: {
                name: {
                    first: 'Maria',
                    last1: 'Lopez',
                    last2: 'Gonzalez',
                },
            },
            donation: {
                taxDeduction: false,
                type: 'nonperish',
                packaging: 'Boxes',
                quantity: '25 cases of canned beans',
                perishable: null,
            },
            pickup: {},
        },
    },
];

async function seedPending() {
    console.log('Seeding Firestore `pending` collection...');
    const batch = db.batch();
    donations.forEach(({ id, data }) => {
        const docRef = db.collection('pending').doc(id);
        batch.set(docRef, data, { merge: true });
    });
    await batch.commit();
    console.log(`Seeded ${donations.length} pending donations.`);
}

seedPending()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to seed pending donations', error);
        process.exit(1);
    });
