// Import the functions you need from the SDKs you need
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//     apiKey: 'AIzaSyAXWhM8kJOHYnMYZ0LYyRetyHexdC-E8JY',
//     authDomain: 'cali-food-bank.firebaseapp.com',
//     projectId: 'cali-food-bank',
//     storageBucket: 'cali-food-bank.appspot.com',
//     messagingSenderId: '76021301881',
//     appId: '1:76021301881:web:94965765786184e2bf8aa8',
//     measurementId: 'G-2EQPLX83Z5',
// };

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const auth = getAuth(app);
const db = getFirestore();

export { app, auth, db };
