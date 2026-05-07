import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

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
