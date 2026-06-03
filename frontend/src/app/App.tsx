import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { auth, db } from '../shared/services/firebase';
import { AuthProvider } from '../context/AuthContext';
import { CardTransitionProvider } from '@/context/CardTransitionContext';

export default function App() {
  return (
    <AuthProvider>
      <CardTransitionProvider>
        <RouterProvider router={router} />
      </CardTransitionProvider>
    </AuthProvider>
  );
}
