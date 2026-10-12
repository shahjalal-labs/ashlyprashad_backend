import admin from "firebase-admin";
import serviceAccount from "../config/serviceAccountKey.json";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
  } catch (error) {
    console.warn("Firebase Admin initialized with fallback or placeholder credentials.");
  }
}

export default admin;
