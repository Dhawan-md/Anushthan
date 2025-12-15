import admin from "firebase-admin";
import serviceAccount from "../../anushthan-test-fcm.json"; // adjust the path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

export default admin;
