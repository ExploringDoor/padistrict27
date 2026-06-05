// ─────────────────────────────────────────────────────────────────────
// D27 Firebase init — shared by the editor + (later) the public pages.
//
// ⚠️  PASTE YOUR firebaseConfig BELOW (from Firebase console → Web app).
//     Until you do, isConfigured stays false and pages fall back to the
//     static data/schedule-data.json so nothing breaks.
// ─────────────────────────────────────────────────────────────────────
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBu_Qd5AUWVSUB6vHP39-zzZgTpbC7s0Fs",
  authDomain: "d27-schedules.firebaseapp.com",
  projectId: "d27-schedules",
  storageBucket: "d27-schedules.firebasestorage.app",
  messagingSenderId: "160177355434",
  appId: "1:160177355434:web:00446604832ad1563d2ed3"
};

export const isConfigured = !String(firebaseConfig.apiKey).startsWith('PASTE');

let app = null, db = null, auth = null;
if (isConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}
export { app, db, auth };
