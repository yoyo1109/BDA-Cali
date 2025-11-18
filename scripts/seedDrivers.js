#!/usr/bin/env node
/**
 * Creates dummy driver users (Firebase Auth + Firestore profile).
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json npm run seed:drivers
 *
 * Optional env vars:
 *   DRIVER_COUNT=10         # number of drivers to create (default 10)
 *   DRIVER_EMAIL_DOMAIN=example.com
 */
const path = require('path');
const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const DRIVER_COUNT = parseInt(process.env.DRIVER_COUNT ?? '5', 10);
const DRIVER_EMAIL_DOMAIN =
    process.env.DRIVER_EMAIL_DOMAIN ?? 'driver.demo.bdacali.com';

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
const auth = admin.auth();

const generatePassword = (first, last1, last2) => {
    const safeSlice = (value, length) =>
        (value ?? '').toLowerCase().substring(0, length);
    let password = safeSlice(first, 3);
    password += safeSlice(last1, 4);
    if (last2 && last2.length > 0) {
        password += safeSlice(last2, 4);
    }
    return password;
};

async function createDriver(idx) {
    const firstName = faker.person.firstName();
    const last1 = faker.person.lastName();
    const last2 = faker.person.lastName();
    const email = `${firstName.toLowerCase()}.${last1.toLowerCase()}${idx}@${DRIVER_EMAIL_DOMAIN}`;
    const password = generatePassword(firstName, last1, last2);

    const userRecord = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${last1}`,
    });

    const plate = `${faker.string.alpha({ length: 1 }).toUpperCase()}${faker
        .string.alpha({ length: 2 })
        .toUpperCase()}${faker.number.int({ min: 1000, max: 9999 })}`;

    await db
        .collection('users')
        .doc(userRecord.uid)
        .set({
            email,
            name: {
                first: firstName,
            last1,
            last2,
        },
        type: 'driver',
        plate,
        initialPassword: password,
    });

    return { email, password, uid: userRecord.uid, name: `${firstName} ${last1}` };
}

async function seedDrivers() {
    console.log(`Creating ${DRIVER_COUNT} driver accounts...`);
    const results = [];
    for (let i = 0; i < DRIVER_COUNT; i += 1) {
        try {
            const driver = await createDriver(i + 1);
            results.push(driver);
            console.log(
                `Created driver ${driver.email} (uid=${driver.uid}, password=${driver.password})`
            );
        } catch (error) {
            console.error(`Failed to create driver ${i + 1}`, error);
        }
    }
    console.log('\nDriver accounts created:\n', JSON.stringify(results, null, 2));
}

seedDrivers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to seed drivers', error);
        process.exit(1);
    });
