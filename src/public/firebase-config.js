// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGTJBUmyy6xXw8M4c6BLtnS1lOSvYrt2s",
  authDomain: "calendario-a-promo-2026.firebaseapp.com",
  projectId: "calendario-a-promo-2026",
  storageBucket: "calendario-a-promo-2026.firebasestorage.app",
  messagingSenderId: "330678845187",
  appId: "1:330678845187:web:094576455b3d601fb07336",
  measurementId: "G-H4STG3G2HD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);