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

// ↓↓↓ REPLACE THIS WHOLE OBJECT with the one from the Firebase console ↓↓↓
const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
// ↑↑↑ REPLACE ABOVE ↑↑↑

export const isConfigured = !String(firebaseConfig.apiKey).startsWith('PASTE');

let app = null, db = null, auth = null;
if (isConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}
export { app, db, auth };
