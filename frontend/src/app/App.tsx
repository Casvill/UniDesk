import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { auth, db } from '../services/firebase';

export default function App() {
  useEffect(() => {
    console.log("Firebase initialized:", { auth, db });
  }, []);

  return <RouterProvider router={router} />;
}