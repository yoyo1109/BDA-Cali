#!/usr/bin/env node
/**
 * Sets/updates the `type` field on a document in the `users` collection.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json \
 *     node scripts/setUserType.js <UID> <type>
 *
 * Example:
 *   node scripts/setUserType.js djDAaW... admin
 */
const path = require('path');
const admin = require('firebase-admin');

const [uid, userType] = process.argv.slice(2);

if (!uid || !userType) {
    console.error(
        'Usage: node scripts/setUserType.js <UID> <type>\nAccepted types: admin | warehouse | driver'
    );
    process.exit(1);
}

const allowedTypes = ['admin', 'warehouse', 'driver'];
if (!allowedTypes.includes(userType)) {
    console.error(`Invalid type "${userType}". Use one of: ${allowedTypes.join(', ')}`);
    process.exit(1);
}

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

async function setUserType() {
    const userRef = db.collection('users').doc(uid);
    await userRef.set({ type: userType }, { merge: true });
    const snapshot = await userRef.get();
    console.log('Updated user document:', { id: snapshot.id, data: snapshot.data() });
}

setUserType()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to update user type', error);
        process.exit(1);
    });
