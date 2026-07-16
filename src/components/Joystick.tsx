import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { socket } from '../lib/socket';

export default function Joystick() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const MAX_DISTANCE = 50;

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    handleMove(e);
  };

  const lastEmitTime = useRef(0);

  const handleMove = (e: React.MouseEvent | React.TouchEvent | any) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const clampedDistance = Math.min(distance, MAX_DISTANCE);
    const nx = Math.cos(angle) * clampedDistance;
    const ny = Math.sin(angle) * clampedDistance;

    setPosition({ x: nx, y: ny });

    // Throttled socket emission (20Hz)
    const now = Date.now();
    if (now - lastEmitTime.current > 50) {
      const linear = -ny / MAX_DISTANCE; 
      const angular = -nx / MAX_DISTANCE; 
      socket.emit('move', { linear, angular });
      lastEmitTime.current = now;
    }
  };

  const handleEnd = () => {
    isDragging.current = false;
    setPosition({ x: 0, y: 0 });
    socket.emit('move', { linear: 0, angular: 0 });
  };

  useEffect(() => {
    const onGlobalEnd = () => handleEnd();
    window.addEventListener('mouseup', onGlobalEnd);
    window.addEventListener('touchend', onGlobalEnd);
    return () => {
      window.removeEventListener('mouseup', onGlobalEnd);
      window.removeEventListener('touchend', onGlobalEnd);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={containerRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        className="relative w-32 h-32 rounded-full glass-card flex items-center justify-center cursor-grab active:cursor-grabbing border-2"
      >
        {/* Base markers */}
        <div className="absolute w-[1px] h-full bg-white/5" />
        <div className="absolute h-[1px] w-full bg-white/5" />
        
        {/* Directional labels */}
        <div className="absolute top-1 text-[8px] font-bold opacity-20 uppercase tracking-widest">FWD</div>
        <div className="absolute bottom-1 text-[8px] font-bold opacity-20 uppercase tracking-widest">BWD</div>
        
        <motion.div 
          animate={{ x: position.x, y: position.y }}
          className="w-10 h-10 rounded-full bg-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.7)] border border-white/20"
        />
      </div>
      <span className="mt-3 text-[9px] uppercase font-bold text-white/30 tracking-[3px] font-mono">Manual Control</span>
    </div>
  );
}
