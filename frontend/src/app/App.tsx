import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { auth, db } from '../shared/services/firebase';
import { AuthProvider } from '../context/AuthContext';
import { CardTransitionProvider } from '@/context/CardTransitionContext';
import { AppToastRegion } from '@/shared/components/ui/toast';

export default function App() {
  return (
    <AuthProvider>
      <CardTransitionProvider>
        <RouterProvider router={router} />
        <AppToastRegion />
      </CardTransitionProvider>
    </AuthProvider>
  );
}
