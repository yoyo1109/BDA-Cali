#!/usr/bin/env node

/**
 * Seed Test Data to Firebase
 * Populates bda-cali project with sample pickups for testing
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Firebase configuration - bda-cali project
const firebaseConfig = {
  apiKey: "AIzaSyArIzmfwOvFTSnZyyaZ3O9fevEo_sIbcv8",
  authDomain: "bda-cali.firebaseapp.com",
  projectId: "bda-cali",
  storageBucket: "bda-cali.firebasestorage.app",
  messagingSenderId: "309306930236",
  appId: "1:309306930236:web:6fcd36e7612cf278c6ff39",
  measurementId: "G-Y345JV752L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🌱 Seeding Test Data to Firebase\n');
console.log('Project:', firebaseConfig.projectId);
console.log('\n' + '='.repeat(60) + '\n');

// Sample test data
const testPickups = [
  {
    id: 'test-pickup-001',
    collection: 'accepted',
    data: {
      client: {
        type: 'individual',
        address: {
          formatted: '123 Main St, Cali, Colombia',
          street: '123 Main St',
          city: 'Cali',
          state: 'Valle del Cauca',
          zip: '760001'
        }
      },
      indiv: {
        name: {
          first: 'Juan',
          last1: 'García',
          last2: 'Rodríguez'
        },
        email: 'juan.garcia@example.com',
        phone: '+57 300 123 4567'
      },
      pickup: {
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '10:00 AM - 12:00 PM',
        dockCode: 'A-5',
        loadingTips: 'Ring doorbell, use side entrance',
        status: 'accepted',
        acceptedBy: 'test-driver-001',
        acceptedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 'test-pickup-002',
    collection: 'accepted',
    data: {
      client: {
        type: 'organization',
        address: {
          formatted: '456 Business Ave, Cali, Colombia',
          street: '456 Business Ave',
          city: 'Cali',
          state: 'Valle del Cauca',
          zip: '760002'
        }
      },
      org: {
        name: 'Restaurante El Sabor',
        contactName: 'María López',
        email: 'maria@elsabor.com',
        phone: '+57 300 987 6543'
      },
      pickup: {
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '2:00 PM - 4:00 PM',
        dockCode: 'B-12',
        loadingTips: 'Loading dock at rear, call when arrived',
        status: 'accepted',
        acceptedBy: 'test-driver-001',
        acceptedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 'test-pickup-003',
    collection: 'pending',
    data: {
      client: {
        type: 'individual',
        address: {
          formatted: '789 Food Street, Cali, Colombia',
          street: '789 Food Street',
          city: 'Cali',
          state: 'Valle del Cauca',
          zip: '760003'
        }
      },
      indiv: {
        name: {
          first: 'Carlos',
          last1: 'Martínez',
          last2: 'Sánchez'
        },
        email: 'carlos.martinez@example.com',
        phone: '+57 300 555 1234'
      },
      pickup: {
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '9:00 AM - 11:00 AM',
        dockCode: 'C-3',
        loadingTips: 'Apartment 301, take elevator',
        status: 'pending'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
];

// Sample user data
const testUsers = [
  {
    id: 'test-driver-001',
    data: {
      email: 'driver@test.com',
      displayName: 'Test Driver',
      role: 'driver',
      active: true,
      createdAt: new Date().toISOString()
    }
  }
];

async function seedData() {
  try {
    console.log('📝 Creating test pickups...\n');

    // Seed pickups
    for (const pickup of testPickups) {
      const docRef = doc(db, pickup.collection, pickup.id);
      await setDoc(docRef, pickup.data);
      console.log(`✅ Created ${pickup.collection}/${pickup.id}`);

      if (pickup.data.indiv) {
        console.log(`   Donor: ${pickup.data.indiv.name.first} ${pickup.data.indiv.name.last1}`);
      } else if (pickup.data.org) {
        console.log(`   Donor: ${pickup.data.org.name}`);
      }
      console.log(`   Address: ${pickup.data.client.address.formatted}`);
      console.log(`   Time: ${pickup.data.pickup.scheduledTime}\n`);
    }

    console.log('👤 Creating test users...\n');

    // Seed users
    for (const user of testUsers) {
      const docRef = doc(db, 'users', user.id);
      await setDoc(docRef, user.data);
      console.log(`✅ Created users/${user.id}`);
      console.log(`   Name: ${user.data.displayName}`);
      console.log(`   Role: ${user.data.role}\n`);
    }

    console.log('='.repeat(60));
    console.log('\n✨ Test data seeded successfully!\n');
    console.log('Summary:');
    console.log(`- ${testPickups.filter(p => p.collection === 'accepted').length} pickup(s) in 'accepted' collection`);
    console.log(`- ${testPickups.filter(p => p.collection === 'pending').length} pickup(s) in 'pending' collection`);
    console.log(`- ${testUsers.length} user(s) in 'users' collection`);
    console.log('\nYou can now:');
    console.log('1. Reload your app (Cmd+R in simulator)');
    console.log('2. View pickups in the app');
    console.log('3. Complete a pickup to test the full flow');
    console.log('4. Check Firebase Console: https://console.firebase.google.com/project/bda-cali/firestore\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
