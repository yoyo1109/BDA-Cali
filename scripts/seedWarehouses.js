#!/usr/bin/env node
/**
 * Creates dummy warehouse users (Firebase Auth + Firestore profile).
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json npm run seed:warehouses
 *
 * Optional env vars:
 *   WAREHOUSE_COUNT=5
 *   WAREHOUSE_EMAIL_DOMAIN=warehouse.demo.bdacali.com
 */
const path = require('path');
const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const WAREHOUSE_COUNT = parseInt(process.env.WAREHOUSE_COUNT ?? '5', 10);
const WAREHOUSE_EMAIL_DOMAIN =
    process.env.WAREHOUSE_EMAIL_DOMAIN ?? 'warehouse.demo.bdacali.com';

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

async function createWarehouse(idx) {
    const firstName = faker.person.firstName();
    const last1 = faker.person.lastName();
    const last2 = faker.person.lastName();
    const email = `${firstName.toLowerCase()}.${last1.toLowerCase()}${idx}@${WAREHOUSE_EMAIL_DOMAIN}`;
    const password = generatePassword(firstName, last1, last2);

    const userRecord = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${last1}`,
    });

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
            type: 'warehouse',
            initialPassword: password,
        });

    return { email, password, uid: userRecord.uid, name: `${firstName} ${last1}` };
}

async function seedWarehouses() {
    console.log(`Creating ${WAREHOUSE_COUNT} warehouse accounts...`);
    const results = [];
    for (let i = 0; i < WAREHOUSE_COUNT; i += 1) {
        try {
            const warehouse = await createWarehouse(i + 1);
            results.push(warehouse);
            console.log(
                `Created warehouse ${warehouse.email} (uid=${warehouse.uid}, password=${warehouse.password})`
            );
        } catch (error) {
            console.error(`Failed to create warehouse ${i + 1}`, error);
        }
    }
    console.log(
        '\nWarehouse accounts created:\n',
        JSON.stringify(results, null, 2)
    );
}

seedWarehouses()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to seed warehouses', error);
        process.exit(1);
    });
