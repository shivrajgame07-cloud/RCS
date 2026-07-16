import { Wifi, ArrowRight, Laptop, Bot } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { socket } from '../lib/socket';
import { useRobotStore } from '../store/useRobotStore';

export default function ConnectPanel({ onConnected }: { onConnected: () => void }) {
  const [ip, setIp] = useState('192.168.1.104');
  const [isConnecting, setIsConnecting] = useState(false);
  const setCamUrl = useRobotStore((s) => s.setCamUrl);

  const handleConnect = () => {
    setIsConnecting(true);
    const logMessage = `SYSTEM: INITIALIZING LINK TO ${ip}...`;
    useRobotStore.getState().addLog(logMessage);

    setTimeout(() => {
      socket.emit('connect_robot', { ip });

      let targetCamUrl = ip;
      // If it doesn't start with http or https, assume it's an IP and wrap it
      if (!ip.startsWith('http://') && !ip.startsWith('https://')) {
        // Default to port 443 /stream for ESP32 with HTTPS
        targetCamUrl = ip.includes(':') ? `https://${ip}` : `https://${ip}:443/stream`;
      }
      
      setCamUrl(targetCamUrl);
      
      useRobotStore.getState().addLog(`SYSTEM: LINK ESTABLISHED AT ${ip}`);
      onConnected();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden p-6 relative">
      {/* Background Ambience handled by body, but adding some extra depth */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-10 relative z-10 border-t-4 border-t-cyan-400 neon-glow-blue"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-[32px] bg-cyan-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,242,255,0.4)]">
            <Bot size={48} className="text-black" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tighter text-center neon-text-blue">ROBOTICS OS</h1>
          <p className="text-white/40 text-[10px] mt-2 font-bold uppercase tracking-[4px]">Secure Control Interface</p>
        </div>

        <div className="space-y-6">
          <div className="bg-black/40 rounded-2xl p-6 border border-white/5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-cyan-400">
                <Wifi size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[3px]">Link Address</span>
              </div>
              <span className="text-[8px] text-white/20 font-mono">ESP32-CAM PORT: 443</span>
            </div>
            
            <input 
              type="text" 
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="0.0.0.0"
              className="w-full bg-transparent border-none px-0 py-2 text-white font-mono text-2xl focus:outline-none placeholder:text-white/10"
            />
          </div>

          <div className="px-2">
            <h3 className="text-cyan-400/60 text-[8px] font-bold uppercase tracking-widest mb-2">Network Configuration</h3>
            <p className="text-[9px] text-white/30 leading-relaxed mb-3">
              This cloud interface requires a public or tunneled IP. 
              Use <span className="text-cyan-400/80">ngrok</span> for local development.
            </p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
            disabled={isConnecting}
            className={`w-full bg-cyan-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all uppercase tracking-widest text-sm ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-400'}`}
          >
            {isConnecting ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
              />
            ) : (
              <>
                Initialize System <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </div>

        <div className="mt-10 flex justify-center gap-8 border-t border-white/5 pt-8">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white/5 rounded-2xl text-cyan-400/60 border border-white/5"><Laptop size={20} /></div>
            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Simulator</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-30">
            <div className="p-3 bg-white/5 rounded-2xl text-white/40 border border-white/5"><Bot size={20} /></div>
            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Hardware</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
