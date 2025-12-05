#!/usr/bin/env node

/**
 * Firebase Database and Storage Checker
 * This script connects to your Firebase project and shows what data exists
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getStorage, ref, listAll } = require('firebase/storage');

// Firebase configuration (from src/firebase/config.js)
// Using OLD project with existing data
const firebaseConfig = {
  apiKey: 'AIzaSyAXWhM8kJOHYnMYZ0LYyRetyHexdC-E8JY',
  authDomain: 'cali-food-bank.firebaseapp.com',
  projectId: 'cali-food-bank',
  storageBucket: 'cali-food-bank.appspot.com',
  messagingSenderId: '76021301881',
  appId: '1:76021301881:web:94965765786184e2bf8aa8',
  measurementId: 'G-2EQPLX83Z5',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('🔥 Firebase Connection Test\n');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Storage Bucket:', firebaseConfig.storageBucket);
console.log('\n' + '='.repeat(60) + '\n');

async function checkFirestoreCollections() {
  console.log('📊 FIRESTORE DATABASE COLLECTIONS:\n');

  const collectionsToCheck = ['pending', 'accepted', 'pickedup', 'users'];

  for (const collectionName of collectionsToCheck) {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      if (snapshot.empty) {
        console.log(`❌ ${collectionName}: Collection exists but is EMPTY (0 documents)`);
      } else {
        console.log(`✅ ${collectionName}: ${snapshot.size} document(s) found`);

        // Show first document structure (without sensitive data)
        const firstDoc = snapshot.docs[0];
        const data = firstDoc.data();
        console.log(`   Sample document ID: ${firstDoc.id}`);
        console.log(`   Fields: ${Object.keys(data).join(', ')}`);

        // Special handling for pickup collections
        if (collectionName === 'accepted' || collectionName === 'pickedup') {
          if (data.pickup) {
            console.log(`   Pickup fields: ${Object.keys(data.pickup).join(', ')}`);
            if (data.pickup.items) {
              console.log(`   ├─ Items: ${data.pickup.items.length} item(s)`);
            }
            if (data.pickup.receiptImage) {
              console.log(`   ├─ Receipt: ${data.pickup.receiptImage}`);
            }
            if (data.pickup.signatureImage) {
              console.log(`   └─ Signature: ${data.pickup.signatureImage}`);
            }
          }
        }
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${collectionName}: Collection does NOT exist yet`);
      console.log(`   (Will be created automatically when first document is added)\n`);
    }
  }
}

async function checkStorage() {
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📁 FIREBASE STORAGE:\n');

  const foldersToCheck = ['receipts', 'signatures'];

  for (const folder of foldersToCheck) {
    try {
      const folderRef = ref(storage, folder);
      const result = await listAll(folderRef);

      if (result.items.length === 0) {
        console.log(`❌ ${folder}/: Folder exists but is EMPTY (0 files)`);
      } else {
        console.log(`✅ ${folder}/: ${result.items.length} file(s) found`);
        result.items.forEach((item, index) => {
          const symbol = index === result.items.length - 1 ? '└─' : '├─';
          console.log(`   ${symbol} ${item.name}`);
        });
      }
      console.log('');
    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        console.log(`❌ ${folder}/: Folder does NOT exist yet`);
        console.log(`   (Will be created when first file is uploaded)\n`);
      } else {
        console.log(`❌ ${folder}/: Error checking folder - ${error.message}\n`);
      }
    }
  }
}

async function main() {
  try {
    await checkFirestoreCollections();
    await checkStorage();

    console.log('='.repeat(60) + '\n');
    console.log('✨ Summary:');
    console.log('- Firestore collections are created when first document is added');
    console.log('- Storage folders are created when first file is uploaded');
    console.log('- Complete a pickup in the app to populate pickedup collection\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
