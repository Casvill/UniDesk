import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { status, isLoading } = useAuth();

  if (isLoading) {
    // Puedes reemplazar esto con un spinner o pantalla de carga real
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg animate-pulse">Cargando sesión...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
