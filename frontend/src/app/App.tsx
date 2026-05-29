import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { auth, db } from '../shared/services/firebase';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
