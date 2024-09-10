// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth";
import {getStorage} from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-6zT9mRmk_8htbDxVzv7y6qnBgj2aD2g",
  authDomain: "saya-c1df2.firebaseapp.com",
  projectId: "saya-c1df2",
  storageBucket: "saya-c1df2.appspot.com",
  messagingSenderId: "886076926720",
  appId: "1:886076926720:web:e6261f3841ad5fde0d21e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore,storage };