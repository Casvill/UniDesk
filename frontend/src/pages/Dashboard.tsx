import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Video, 
  MonitorUp, 
  Settings, 
  LogOut,
  PlusCircle,
  VideoOff,
  Mic,
  MicOff
} from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar - T1: Gestión de Identidad y Salas */}
      <nav 
        className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col p-4 gap-6"
        aria-label="Menú principal y salas"
      >
        <div className="flex items-center gap-2 text-white font-bold text-xl px-2">
          <Users className="w-8 h-8 text-blue-400" aria-hidden="true" />
          <span>UniDiscord</span>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">Mis Salas</h2>
          <button className="flex items-center gap-2 w-full p-2 rounded hover:bg-slate-800 transition-colors text-left focus:ring-2 focus:ring-blue-500 outline-none">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Sala de Algoritmos</span>
          </button>
          <button className="flex items-center gap-2 w-full p-2 rounded hover:bg-slate-800 transition-colors text-left focus:ring-2 focus:ring-blue-500 outline-none">
            <div className="w-2 h-2 rounded-full bg-slate-600" />
            <span>Cálculo III</span>
          </button>
          <button 
            className="flex items-center gap-2 w-full p-2 rounded border border-dashed border-slate-700 hover:border-blue-500 hover:text-blue-400 transition-all mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label="Crear nueva sala"
          >
            <PlusCircle size={18} />
            <span>Nueva Sala</span>
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-800 pt-4">
          <button className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded transition-colors focus:ring-2 focus:ring-blue-500 outline-none">
            <Settings size={18} />
            <span>Perfil</span>
          </button>
          <button className="flex items-center gap-2 p-2 hover:bg-red-900/20 hover:text-red-400 rounded transition-colors focus:ring-2 focus:ring-red-500 outline-none">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - Estado de la sala */}
        <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Sala de Algoritmos</h1>
            <p className="text-sm text-slate-500">4 estudiantes conectados</p>
          </div>
          <div className="flex gap-2">
            {/* T4: Compartición de pantalla */}
            <button 
              className="p-2 rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 outline-none"
              aria-label="Compartir pantalla"
            >
              <MonitorUp size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* T3: Interacción AV (Video Area) */}
          <section 
            className="flex-1 bg-slate-900 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto"
            aria-label="Zona de videollamada"
          >
            {/* Mockup de videos de usuarios */}
            <div className="relative aspect-video bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-blue-500/30">
              <span className="text-slate-400 font-medium">Tú (Cámara activa)</span>
              <div className="absolute bottom-3 left-3 flex gap-2">
                 <div className="bg-slate-900/80 p-1.5 rounded-full"><Mic size={14} className="text-white" /></div>
              </div>
            </div>
            <div className="relative aspect-video bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
              <span className="text-slate-400 font-medium">Estudiante 2</span>
              <div className="absolute bottom-3 left-3 flex gap-2">
                 <div className="bg-red-500/80 p-1.5 rounded-full"><MicOff size={14} className="text-white" /></div>
              </div>
            </div>
            <div className="relative aspect-video bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
              <span className="text-slate-400 font-medium">Estudiante 3</span>
              <div className="absolute bottom-3 left-3 flex gap-2">
                 <div className="bg-slate-900/80 p-1.5 rounded-full"><Mic size={14} className="text-white" /></div>
              </div>
            </div>
            <div className="relative aspect-video bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                E4
              </div>
              <div className="absolute bottom-3 left-3 flex gap-2">
                 <div className="bg-red-500/80 p-1.5 rounded-full"><VideoOff size={14} className="text-white" /></div>
              </div>
            </div>

            {/* AV Controls Floating */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 lg:left-[calc(50%+128px)] flex gap-4 bg-slate-900/90 backdrop-blur p-4 rounded-2xl shadow-2xl border border-slate-700">
              <button className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors focus:ring-2 focus:ring-blue-500 outline-none" aria-label="Silenciar micrófono">
                <Mic size={24} />
              </button>
              <button className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors focus:ring-2 focus:ring-blue-500 outline-none" aria-label="Apagar cámara">
                <Video size={24} />
              </button>
              <button className="p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors focus:ring-2 focus:ring-red-500 outline-none" aria-label="Salir de la sala">
                <LogOut size={24} />
              </button>
            </div>
          </section>

          {/* T2: Chat en tiempo real e historial */}
          <aside 
            className="w-full lg:w-80 bg-white border-l flex flex-col"
            aria-label="Chat de la sala"
          >
            <div className="p-4 border-b bg-slate-50 flex items-center gap-2 font-semibold">
              <MessageSquare size={18} className="text-blue-600" />
              <span>Chat en tiempo real</span>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500">Estudiante 2 • 10:30 AM</span>
                <p className="bg-slate-100 p-2 rounded-lg text-sm text-slate-700">¿Alguien entiende la complejidad de este algoritmo?</p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-xs font-bold text-blue-600">Tú • 10:32 AM</span>
                <p className="bg-blue-600 p-2 rounded-lg text-sm text-white max-w-[90%]">¡Sí! Es O(n log n). Puedo explicarlo si quieres.</p>
              </div>
            </div>

            <div className="p-4 border-t">
              <form 
                className="flex gap-2"
                onSubmit={(e) => e.preventDefault()}
              >
                <label htmlFor="chat-input" className="sr-only">Escribir mensaje</label>
                <input 
                  id="chat-input"
                  type="text" 
                  placeholder="Enviar mensaje..."
                  className="flex-1 bg-slate-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  type="submit"
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 outline-none"
                  aria-label="Enviar"
                >
                  <MessageSquare size={18} />
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
