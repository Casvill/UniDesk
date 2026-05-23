import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-slate-900 mb-4 text-center">
        Salón de Estudio Colaborativo
      </h1>
      <p className="text-lg text-slate-600 mb-8 max-w-2xl text-center">
        Un espacio accesible y síncrono para potenciar tu aprendizaje en comunidad.
      </p>
      <div className="flex gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-300 outline-none"
          aria-label="Empezar a estudiar ahora"
        >
          Comenzar
        </button>
        <button 
          className="bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors focus:ring-4 focus:ring-slate-100 outline-none"
          aria-label="Saber más sobre el proyecto"
        >
          Saber más
        </button>
      </div>
    </main>
  );
};

export default LandingPage;
