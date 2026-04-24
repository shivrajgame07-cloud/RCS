import { Camera, Maximize2, RefreshCw, Signal } from 'lucide-react';
import { useRobotStore } from '../store/useRobotStore';
import { motion } from 'motion/react';

export default function CameraFeed() {
  const camUrl = useRobotStore((s) => s.camUrl);
  const connected = useRobotStore((s) => s.state.connected);

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Feed Container */}
      <div className="relative flex-[7] bg-slate-950 rounded-lg overflow-hidden border border-white/5 group">
        {/* MJPEG Stream Overlay */}
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        
        <img 
          src={camUrl} 
          alt="Live Feed" 
          className={`w-full h-full object-cover transition-opacity duration-700 ${connected ? 'opacity-90' : 'opacity-20 grayscale'}`}
          referrerPolicy="no-referrer"
        />

        {/* Scan line effect */}
        <div className="scanline absolute inset-0 animate-scanline"></div>

        {/* HUD Overlays */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded px-2 py-0.5 border border-white/10">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                <span className="text-[9px] text-white/80 font-bold tracking-widest uppercase">ESP32-CAM / LIVE</span>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10 pointer-events-auto text-white/50 hover:text-white"
            >
              <Maximize2 size={14} />
            </motion.button>
          </div>

          <div className="flex justify-between items-end">
            <div className="text-[9px] font-mono text-white/30 bg-black/20 px-1 rounded">
              IP: 192.168.1.104
            </div>
            <div className="flex gap-2">
              <button className="p-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10 pointer-events-auto text-white/50 hover:text-white">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Stats (Bottom 25% part) */}
      <div className="flex-[3] flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] uppercase tracking-widest opacity-40 font-bold">Signal Link</span>
          <span className="text-[9px] text-green-400 font-mono">STABLE</span>
        </div>
        
        <div className="flex gap-1 h-10 items-end px-1">
          {[0.4, 0.2, 0.6, 0.3, 0.8, 0.5, 0.9, 0.7, 1.0].map((h, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-sm transition-all duration-500 ${i === 8 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.5)]' : 'bg-cyan-400/20'}`} 
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>

        <div className="flex justify-between items-center px-1 text-[9px] font-mono opacity-50">
          <span>FPS: 30.2</span>
          <span>LAT: 14ms</span>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl p-3 flex flex-col justify-between">
      <div className="flex items-center gap-2 text-white/40 uppercase text-[8px] font-bold tracking-widest">
        {icon} {label}
      </div>
      <div className={`text-sm font-mono font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
}
