import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  collection, 
  addDoc, 
  getDocs,
  query,
  limit
} from "firebase/firestore";
import { getAuth, connectAuthEmulator, signInAnonymously, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "fake-api-key",
  projectId: "uni-desk-six-seven"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

connectFirestoreEmulator(db, 'localhost', 8080);
connectAuthEmulator(auth, "http://localhost:9099");

async function runSecurityTests() {
  console.log("--- Iniciando pruebas de seguridad Firestore (Lectura/Escritura) ---");
  
  const messagesRef = collection(db, "messages");

  // 1. Prueba: Lectura SIN autenticación
  console.log("\n[Test 1] Lectura sin autenticación:");
  try {
    await getDocs(query(messagesRef, limit(1)));
    console.error("❌ FAILED: Se permitió leer sin autenticación.");
  } catch (e) {
    console.log("✅ PASSED: Lectura denegada correctamente.");
  }

  // 2. Prueba: Escritura SIN autenticación
  console.log("\n[Test 2] Escritura sin autenticación:");
  try {
    await addDoc(messagesRef, { content: "test", senderUid: "hacker" });
    console.error("❌ FAILED: Se permitió escribir sin autenticación.");
  } catch (e) {
    console.log("✅ PASSED: Escritura denegada correctamente.");
  }

  // Autenticar para pruebas de usuario autorizado
  await signInAnonymously(auth);
  const user = auth.currentUser;
  console.log(`\n[Info] Usuario autenticado con UID: ${user.uid}`);

  // 3. Prueba: Lectura CON autenticación
  console.log("\n[Test 3] Lectura con autenticación:");
  try {
    await getDocs(query(messagesRef, limit(1)));
    console.log("✅ PASSED: Lectura permitida correctamente.");
  } catch (e) {
    console.error("❌ FAILED: Lectura denegada injustamente.", e.message);
  }

  // 4. Prueba: Escritura CON autenticación
  console.log("\n[Test 4] Escritura con autenticación:");
  try {
    await addDoc(messagesRef, { content: "test", senderUid: user.uid });
    console.log("✅ PASSED: Escritura permitida correctamente.");
  } catch (e) {
    console.error("❌ FAILED: Escritura denegada injustamente.", e.message);
  }

  console.log("\n--- Todas las pruebas finalizadas ---");
  process.exit(0);
}

runSecurityTests();
