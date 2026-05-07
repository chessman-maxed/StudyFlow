import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWm4s24hFeCN_GNC9RRsz7jzm4-0RZbgI",
  authDomain: "smart-learning-planner1.firebaseapp.com",
  projectId: "smart-learning-planner1",
  storageBucket: "smart-learning-planner1.firebasestorage.app",
  messagingSenderId: "704749613324",
  appId: "1:704749613324:web:bdf4778de32d0cffe7d929"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* 🔐 FORCE SESSION PERSISTENCE */
setPersistence(auth, browserLocalPersistence);

function googleAuth() {
  signInWithPopup(auth, provider)
    .then(() => {
      window.location.href = "planner.html";
    })
    .catch(error => {
      alert(error.message);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector(".google-auth-btn")
    ?.addEventListener("click", googleAuth);
});
