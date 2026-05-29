import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { auth, db } from '../shared/services/firebase';

export default function App() {
  useEffect(() => {
    console.log("Firebase initialized:", { auth, db });

    // verificar si las instancias cargaron correctamente en memoria
    if (auth && db) {
      console.log("✅ SDK de Firebase inicializado correctamente.");
      console.log("Configuración de Auth:", auth.config);
      console.log("Configuración de Firestore:", db.type);
    } else {
      console.error("❌ Error: Las instancias de Firebase son undefined.");
    }
  }, []);

  return <RouterProvider router={router} />;
}
