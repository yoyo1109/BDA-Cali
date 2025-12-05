#!/usr/bin/env node
const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const driverEmail = process.env.DRIVER_EMAIL;
const PICKUP_COUNT = parseInt(process.env.PICKUP_COUNT ?? '5', 10);

async function main() {
    const { faker } = await import('@faker-js/faker');

    if (!serviceAccountPath) {
        console.error(
            'Missing FIREBASE_SERVICE_ACCOUNT env var. Set it to the path of a service-account JSON file.'
        );
        process.exit(1);
    }
    if (!driverEmail) {
        console.error('Missing DRIVER_EMAIL env var. Provide the driver\'s email.');
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

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
    }

    const db = admin.firestore();
    const auth = admin.auth();

    const buildPickupDate = (index) => {
        const now = new Date();
        const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (index % 2 === 1) {
            base.setDate(base.getDate() + 1); // tomorrow
        }
        base.setHours(9 + (index % 3) * 2, 0, 0, 0); // 9am,11am,1pm rotations
        return admin.firestore.Timestamp.fromDate(base);
    };

    const buildAddress = () => {
        const latitude = 37.25 + Math.random() * 0.5;
        const longitude = -121.95 + Math.random() * 0.5;
        return {
            formatted: `${faker.location.streetAddress()}, ${faker.location.city()}, CA ${faker.location.zipCode({ format: '95###' })}`,
            lat: Number(latitude.toFixed(6)),
            lng: Number(longitude.toFixed(6)),
        };
    };

    const buildDonation = () => {
        const perish = faker.datatype.boolean();
        return {
            taxDeduction: faker.datatype.boolean(),
            type: perish ? 'perish' : 'nonperish',
            packaging: faker.helpers.arrayElement(['Pallets', 'Boxes', 'Crates']),
            quantity: `${faker.number.int({ min: 20, max: 300 })} ${faker.helpers.arrayElement(['lbs', 'cases'])}`,
            perishable: perish
                ? {
                      expiration: admin.firestore.Timestamp.fromDate(
                          faker.date.soon({ days: 10 })
                      ),
                      traits: faker.commerce.productAdjective(),
                  }
                : null,
        };
    };

    const userRecord = await auth.getUserByEmail(driverEmail);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data() || {};
    const driverName = userData.name
        ? `${userData.name.first} ${userData.name.last1}${
              userData.name.last2 ? ` ${userData.name.last2}` : ''
          }`
        : userRecord.displayName || driverEmail;
    const driverPlate = userData.plate || faker.vehicle.vrm();

    console.log(`Creating ${PICKUP_COUNT} pickups for ${driverEmail}...`);

    for (let i = 0; i < PICKUP_COUNT; i += 1) {
        const docId = `seed-${userRecord.uid}-${Date.now()}-${i + 1}`;
        const pickupDate = buildPickupDate(i);
        const address = buildAddress();
        const donation = buildDonation();
        const orgName = faker.company.name();

        await db
            .collection('accepted')
            .doc(docId)
            .set({
                dateCreated: admin.firestore.Timestamp.now(),
                client: {
                    type: 'org',
                    address,
                },
                org: {
                    name: orgName,
                },
                donation,
                pickup: {
                    driver: userRecord.uid,
                    driverName,
                    driverPlate,
                    date: pickupDate,
                    status: 'scheduled',
                },
            });

        console.log(
            `  • pickup ${docId} on ${pickupDate.toDate().toLocaleString('en-US')} @ ${address.formatted}`
        );
    }

    console.log('Done. Open the driver app to see the new pickups.');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to seed pickups', error);
        process.exit(1);
    });
