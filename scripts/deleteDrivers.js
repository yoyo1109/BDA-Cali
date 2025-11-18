#!/usr/bin/env node
/**
 * Deletes driver accounts (Firebase Auth + Firestore profile) filtered by email domain.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json npm run delete:drivers
 *
 * Optional env vars:
 *   DRIVER_EMAIL_DOMAIN=driver.demo.bdacali.com
 */
const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
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

const auth = admin.auth();
const db = admin.firestore();

async function deleteUser(uid, email) {
    await Promise.all([
        auth.deleteUser(uid),
        db.collection('users').doc(uid).delete().catch(() => {}),
    ]);
    console.log(`Deleted driver ${email} (${uid})`);
}

async function deleteDrivers() {
    console.log(`Deleting drivers with domain ${DRIVER_EMAIL_DOMAIN}...`);
    let deleted = 0;
    let pageToken;

    do {
        const result = await auth.listUsers(1000, pageToken);
        const targetUsers = result.users.filter((user) =>
            user.email?.toLowerCase().endsWith(`@${DRIVER_EMAIL_DOMAIN}`)
        );
        for (const user of targetUsers) {
            await deleteUser(user.uid, user.email);
            deleted += 1;
        }
        pageToken = result.pageToken;
    } while (pageToken);

    console.log(`Deleted ${deleted} driver accounts.`);
}

deleteDrivers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to delete drivers', error);
        process.exit(1);
    });
