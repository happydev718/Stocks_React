import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

const config = firebase.initializeApp({
  apiKey: "AIzaSyAEXYg2O-UfDGsbbzJZHYrIP8qIjPpi5qo",
  authDomain: "stocksfc-auth.firebaseapp.com",
  databaseURL: "https://stocksfc-auth-default-rtdb.firebaseio.com",
  projectId: "stocksfc-auth",
  storageBucket: "stocksfc-auth.appspot.com",
  messagingSenderId: "701392533362",
  appId: "1:701392533362:web:f23d7c3a7743e0ba1a0feb",
  measurementId: "G-Y0CBPRL2LQ"
});
const db = config.firestore();
export { db };

//asdfQWER1234!@#$
export const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
export const OAuthProvider = firebase.auth.OAuthProvider;


export const auth = config.auth();
export const auth_profile = config.auth();
export default config;
