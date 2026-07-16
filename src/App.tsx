import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRobotStore } from './store/useRobotStore';
import { socket } from './lib/socket';
import CameraFeed from './components/CameraFeed';
import RobotScene from './components/RobotScene';
import Telemetry from './components/Telemetry';
import Joystick from './components/Joystick';
import VoiceControl from './components/VoiceControl';
import ConnectPanel from './components/ConnectPanel';
import { Activity, ShieldAlert, Cpu, Power, Settings, MessageSquare } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'connect' | 'dashboard'>('connect');
  const { state, setTelemetry, logs, addLog } = useRobotStore();

  useEffect(() => {
    socket.on('telemetry', (data) => {
      if (data) setTelemetry(data);
    });

    socket.on('status_change', (data) => {
      if (data && data.status) {
        setTelemetry({ status: data.status, connected: data.connected ?? false });
        addLog(`SYSTEM: ${String(data.status).toUpperCase()}`);
      }
    });

    socket.on('command_ack', (data) => {
      if (data && data.text) {
        addLog(`ROBOT: ${data.text}`);
      }
    });

    socket.on('camera_url_update', (url) => {
      if (url) {
        useRobotStore.getState().setCamUrl(url);
        addLog(`SYSTEM: CAMERA FEED SYNCED`);
      }
    });

    return () => {
      socket.off('telemetry');
      socket.off('status_change');
      socket.off('command_ack');
      socket.off('camera_url_update');
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w') socket.emit('move', { linear: 1, angular: 0 });
      if (key === 's') socket.emit('move', { linear: -1, angular: 0 });
      if (key === 'a') socket.emit('move', { linear: 0, angular: 1 });
      if (key === 'd') socket.emit('move', { linear: 0, angular: -1 });
      if (key === ' ') {
        e.preventDefault();
        socket.emit('emergency_stop');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd'].includes(key)) {
        socket.emit('move', { linear: 0, angular: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden text-white font-sans selection:bg-cyan-500/30">
      <AnimatePresence mode="wait">
        {view === 'connect' ? (
          <motion.div 
            key="connect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <ConnectPanel onConnected={() => setView('dashboard')} />
          </motion.div>
        ) : (
          <motion.main 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col p-4 gap-4"
          >
            {/* Header */}
            <header className="flex items-center justify-between glass-card px-6 py-4 border-t-2 border-t-cyan-400 neon-glow-blue">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.5)]">
                    <Cpu size={18} className="text-black" />
                  </div>
                  <span className="font-bold text-xl tracking-tight neon-text-blue">Robotics Control System</span>
                </div>
                
                <div className="h-6 w-[1px] bg-white/10" />
                
                <div className="flex items-center gap-4 text-xs font-mono font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-white/40 uppercase tracking-widest">System Status:</span>
                    <span className="text-green-400 uppercase">Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-cyan-400" />
                    <span className="text-white/40 uppercase tracking-widest">Link:</span>
                    <span className="text-cyan-400">14ms Optimal</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                  <Settings size={20} className="text-white/60" />
                </button>
                <button 
                  onClick={() => socket.emit('emergency_stop')}
                  className="px-6 py-2.5 rounded-xl bg-red-900/40 hover:bg-red-900/60 text-red-100 border border-red-500/50 font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                  <ShieldAlert size={18} /> E-STOP
                </button>
                <div className="h-6 w-[1px] bg-white/10 mx-2" />
                <button 
                  onClick={() => window.location.reload()}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <Power size={20} />
                </button>
              </div>
            </header>

            {/* Main Grid Layout */}
            <div className="flex-1 grid grid-cols-[22%_53%_25%] gap-4 min-h-0">
              {/* LEFT PANEL */}
              <aside className="flex flex-col gap-4 min-h-0">
                <section className="flex-1 glass-card p-4 overflow-hidden relative border-t-2 border-t-cyan-400 neon-glow-blue">
                  <CameraFeed />
                </section>
              </aside>

              {/* CENTER PANEL */}
              <section className="flex flex-col gap-4 min-h-0">
                <div className="flex-[7] glass-card overflow-hidden relative border-purple-500/20">
                  <RobotScene />
                </div>

                <div className="flex-[1.5] glass-card p-5 flex flex-col overflow-hidden">
                  <div className="flex justify-between border-b border-white/5 pb-1 mb-2">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <MessageSquare size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Command Log</span>
                    </div>
                    <span className="text-[9px] opacity-30 font-mono tracking-tighter">v2.4.0-Stable</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 font-mono">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-3 text-[10px] tracking-tight leading-relaxed group">
                        <span className="text-white/20 whitespace-nowrap">[{log.timestamp}]</span>
                        <span className={log.message.startsWith('AI') ? 'text-purple-400' : log.message.startsWith('SYSTEM') ? 'text-cyan-400' : 'text-white/70'}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-[1.5] glass-card overflow-hidden">
                  <VoiceControl />
                </div>
              </section>

              {/* RIGHT PANEL */}
              <aside className="flex flex-col gap-4 min-h-0">
                <section className="flex-[6] flex flex-col gap-4 min-h-0">
                   <Telemetry />
                </section>

                <section className="flex-[4] glass-card p-6 flex flex-col items-center justify-between">
                  <Joystick />
                  <div className="w-full flex gap-2 mt-4">
                    <ControlBtn label="Patrol" />
                    <ControlBtn label="Return" />
                    <ControlBtn label="E-Stop" isDanger />
                  </div>
                </section>
              </aside>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControlBtn({ label, isDanger }: { label: string; isDanger?: boolean }) {
  return (
    <button className={`flex-1 py-3 glass-card text-[10px] uppercase font-bold hover:bg-white/5 transition-all
      ${isDanger ? 'bg-red-900/40 border-red-500/50 text-red-100 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}`}>
      {label}
    </button>
  );
}
