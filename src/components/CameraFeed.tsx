import { Camera, Maximize2, RefreshCw, Signal, Moon, Sun, Layers, Settings2, ShieldAlert, ExternalLink } from 'lucide-react';
import { useRobotStore } from '../store/useRobotStore';
import { socket } from '../lib/socket';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export default function CameraFeed() {
  const camUrl = useRobotStore((s) => s.camUrl);
  const connected = useRobotStore((s) => s.state.connected);
  
  const [quality, setQuality] = useState('High');
  const [nightVision, setNightVision] = useState(false);
  const [showScanlines, setShowScanlines] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const isLocalIp = (url: string) => {
    return url.includes('192.168.') || url.includes('10.') || url.includes('127.0.0.1') || url.includes('localhost') || url.includes('172.16.');
  };

  const finalCamUrl = useProxy && camUrl && camUrl !== 'NO FEED' 
    ? `/api/proxy?url=${encodeURIComponent(camUrl)}` 
    : camUrl;

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Feed Container */}
      <div className="relative flex-[7] bg-slate-950 rounded-xl overflow-hidden border border-white/5 group shadow-inner">
        {/* MJPEG Stream Overlay */}
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        
        <img 
          src={finalCamUrl} 
          alt="Live Feed" 
          onError={(e) => {
            if (camUrl && camUrl !== 'NO FEED') {
              console.warn("Camera feed failed to load. This is likely due to SSL Certificate restrictions or Mixed Content blocks. Check the on-screen instructions.");
              // Set a small delay before showing troubleshooter to avoid flickering
              setTimeout(() => setShowTroubleshooter(true), 1500);
            }
          }}
          className={`w-full h-full object-cover transition-all duration-700 
            ${connected ? 'opacity-90' : 'opacity-20 grayscale'}
            ${nightVision ? 'brightness-[1.2] contrast-[1.2] sepia-[1] hue-rotate-[70deg] saturate-[2]' : ''}
          `}
          style={{ 
            imageRendering: quality === 'Low' ? 'pixelated' : 'auto'
          }}
          referrerPolicy="no-referrer"
        />

        {/* Connection Failure Hint */}
        {connected && camUrl && camUrl !== 'NO FEED' && showTroubleshooter && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-slate-950/95 backdrop-blur-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
              <ShieldAlert size={32} className="text-red-500 animate-pulse" />
            </div>
            
            <h3 className="text-white font-bold text-2xl mb-1 tracking-tight">Stream Blocked</h3>
            <p className="text-[10px] text-red-400 font-bold mb-6 uppercase tracking-[0.2em]">Security Protocol: Connection Interrupted</p>
            
            <div className="flex flex-col gap-3 w-full max-w-[400px]">
              {/* Intelligent diagnostic */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-1 text-left">
                <span className="text-[9px] uppercase font-bold text-white/40 block mb-1">Diagnostic Report</span>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Target: <span className="text-cyan-400 font-bold">{camUrl?.startsWith('https') ? 'Secure (HTTPS)' : 'Insecure (HTTP)'}</span> protocol on <span className="text-cyan-400 font-bold">{isLocalIp(camUrl || '') ? 'Local Area Network' : 'Public Network'}</span>.
                </p>
              </div>

              {/* Fix A: HTTPS / Trust Cert */}
              {camUrl?.startsWith('https') && (
                <div className="flex items-start gap-4 p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-left hover:bg-cyan-500/20 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                  <div className="w-8 h-8 bg-cyan-500 text-black rounded-lg flex items-center justify-center shrink-0 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)]">FIX A</div>
                  <div className="flex flex-col gap-1 pr-2">
                    <span className="text-[12px] font-bold text-white uppercase tracking-wider">Trust Local Certificate</span>
                    <div className="text-[10px] text-white/50 leading-relaxed space-y-1 mt-1">
                      <p>Your device uses a self-signed cert. You must manually trust it.</p>
                      <a 
                        href={camUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-black text-[11px] font-black px-5 py-2.5 rounded-xl transition-all shadow-lg"
                      >
                        <ExternalLink size={14} /> AUTHORIZE CONNECTION
                      </a>
                      <p className="text-[9px] text-cyan-400 mt-2">Next tab: Click "Advanced" → "Proceed to [IP] (unsafe)"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fix B: HTTP / Mixed Content */}
              {!camUrl?.startsWith('https') && (
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-left hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 bg-cyan-500 text-black rounded-lg flex items-center justify-center shrink-0 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)]">FIX B</div>
                  <div className="flex flex-col gap-1 pr-2">
                    <span className="text-[12px] font-bold text-white/80 uppercase tracking-wider">Browser Security Policy</span>
                    <p className="text-[9px] text-white/40 leading-tight">Secure sites cannot load insecure assets. You must override this.</p>
                    <div className="text-[9px] text-white/60 space-y-1 mt-2 font-medium">
                      <p>1. Click the <span className="text-white font-bold inline-flex items-center gap-1">Lock Icon <ExternalLink size={8}/></span> next to the URL</p>
                      <p>2. Select <span className="text-white font-bold">Site Settings</span></p>
                      <p>3. Set <span className="text-cyan-400 font-bold uppercase">Insecure Content</span> to <span className="text-cyan-400 font-bold uppercase tracking-tighter">Allow</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fix C: Proxy */}
              {!isLocalIp(camUrl || '') && !useProxy && (
                <div className="flex items-start gap-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 text-left hover:bg-purple-500/10 transition-colors">
                  <div className="w-8 h-8 bg-white/10 text-white rounded-lg flex items-center justify-center shrink-0">
                    <Layers size={18} />
                  </div>
                  <div className="flex flex-col gap-1 pr-2">
                    <span className="text-[12px] font-bold text-white/80">Public IP Tunneling</span>
                    <p className="text-[9px] text-white/40 mb-2 leading-tight">Run the stream through our secure cloud relay to bypass local browser blocks.</p>
                    <button 
                      onClick={() => {
                        setUseProxy(true);
                        setShowTroubleshooter(false);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white text-[9px] font-black px-4 py-1.5 rounded-lg transition-all border border-white/5"
                    >
                      ACTIVATE RELAY
                    </button>
                  </div>
                </div>
              )}

              {/* Technical Cert info for the user */}
              <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-left">
                <p className="text-[8px] text-white/30 font-mono uppercase tracking-widest mb-1">Host Diagnostics</p>
                <div className="font-mono text-[7px] text-white/20 break-all bg-black/40 p-2 rounded">
                  CN=ESP32-Rover, O=Antigravity Tech, Validity=10Y
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button 
                  onClick={() => {
                    setShowTroubleshooter(false);
                    setUseProxy(false);
                    const currentUrl = camUrl.split('?')[0];
                    useRobotStore.getState().setCamUrl(`${currentUrl}?t=${Date.now()}`);
                  }}
                  className="flex-1 bg-white hover:bg-slate-200 text-black text-[11px] font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  <RefreshCw size={14} /> RELOAD FEED
                </button>
                
                <button 
                  onClick={() => setShowTroubleshooter(false)}
                  className="px-6 bg-white/5 hover:bg-white/10 text-white/30 text-[10px] font-bold rounded-xl transition-all border border-white/5"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scan line effect */}
        {showScanlines && <div className="scanline absolute inset-0 animate-scanline"></div>}

        {/* HUD Overlays */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded px-2 py-0.5 border border-white/10">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                <span className="text-[9px] text-white/80 font-bold tracking-widest uppercase">ESP32-CAM / {nightVision ? 'NV-MODE' : 'LIVE'}</span>
              </div>
            </div>
            
            <div className="flex gap-2 pointer-events-auto">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 backdrop-blur-md rounded border transition-all ${showSettings ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]' : 'bg-black/40 border-white/10 text-white/50 hover:text-white'}`}
              >
                <Settings2 size={14} />
              </button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10 text-white/50 hover:text-white"
              >
                <Maximize2 size={14} />
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-12 right-3 w-32 glass-card p-2 pointer-events-auto flex flex-col gap-2 z-20 border border-white/10 bg-black/80 shadow-2xl"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] uppercase font-bold text-white/30 tracking-widest pl-1">Image Filter</span>
                  <button 
                    onClick={() => setNightVision(!nightVision)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-[10px] transition-colors ${nightVision ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5 text-white/60'}`}
                  >
                    {nightVision ? <Sun size={10} /> : <Moon size={10} />}
                    {nightVision ? 'Day Mode' : 'Night Vision'}
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[8px] uppercase font-bold text-white/30 tracking-widest pl-1">Overlay</span>
                  <button 
                    onClick={() => setShowScanlines(!showScanlines)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-[10px] transition-colors ${showScanlines ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5 text-white/60'}`}
                  >
                    <Layers size={10} />
                    Scanlines
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[8px] uppercase font-bold text-white/30 tracking-widest pl-1">Quality</span>
                  <div className="flex gap-1 p-1 bg-white/5 rounded">
                    {['L', 'M', 'H'].map((q) => (
                      <button 
                        key={q}
                        onClick={() => setQuality(q === 'L' ? 'Low' : q === 'M' ? 'Med' : 'High')}
                        className={`flex-1 py-1 rounded text-[8px] font-bold transition-all ${quality.startsWith(q) ? 'bg-cyan-500 text-black' : 'text-white/40 hover:text-white'}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-end">
            <div className="text-[9px] font-mono text-white/30 bg-black/20 px-1 rounded truncate max-w-[150px]">
              {camUrl && camUrl.includes('http') ? camUrl.replace('http://', '').split('/')[0] : 'NO FEED'}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const url = prompt('Enter Camera Stream URL (e.g., http://192.168.1.50:81):', camUrl);
                  if (url) useRobotStore.getState().setCamUrl(url);
                }}
                className="p-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10 pointer-events-auto text-white/50 hover:text-white"
              >
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

        {/* Servo Control */}
        <div className="mt-2 px-1 flex flex-col gap-1">
          <div className="flex justify-between items-center">
             <span className="text-[8px] uppercase font-bold text-white/30 tracking-widest pl-1">Servo Pan ({useRobotStore.getState().state.sensors.servoAngle}°)</span>
             <button 
               onClick={() => socket.emit('servo_move', { angle: 90 })}
               className="text-[8px] text-cyan-400 hover:text-cyan-300 uppercase font-bold"
             >
               Recenter
             </button>
          </div>
          <input 
            type="range" 
            min="0" 
            max="180" 
            value={useRobotStore((s) => s.state.sensors.servoAngle) || 90}
            onChange={(e) => {
               const angle = parseInt(e.target.value);
               socket.emit('servo_move', { angle });
            }}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[7px] text-white/20 font-mono">
             <span>0° L</span>
             <span>180° R</span>
          </div>
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
