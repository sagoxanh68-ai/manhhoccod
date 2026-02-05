// Firebase Configuration
// Copy-pasted from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAxiEdYY5cMi0dSpU5qvFkZjaCIg3d_RxQ",
    authDomain: "sago-xanh.firebaseapp.com",
    projectId: "sago-xanh",
    storageBucket: "sago-xanh.firebasestorage.app",
    messagingSenderId: "998626792697",
    appId: "1:998626792697:web:30dbb8eb5988f38c467e28",
    measurementId: "G-PJXWXPX511"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Expose to window to ensure global access
window.db = db;
window.storage = storage;

console.log("Firebase Connected!");
