import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRobotStore } from '../store/useRobotStore';
import { Battery, Thermometer, Wind, Zap, Gauge, MapPin, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';

export default function Telemetry() {
  const sensors = useRobotStore((s) => s.state.sensors);

  // Mock historical data for the chart
  const chartData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      time: i,
      velocity: 0.5 + Math.random() * 0.5,
      temp: 24 + Math.random() * 0.2,
      v: 12 + Math.random() * 0.5,
    }));
  }, [sensors.lastUpdate]); // Regenerate periodically for demo effect

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <SensorCard 
          icon={<Battery size={16} />} 
          label="Power" 
          value={`${sensors.battery}%`} 
          color="text-green-400" 
          subValue={sensors.voltage.toFixed(1) + "V"} 
          borderClass="border-l-green-500 shadow-[inset_10px_0_15px_-10px_rgba(34,197,94,0.2)]"
        />
        <SensorCard 
          icon={<Thermometer size={16} />} 
          label="Temp" 
          value={`${sensors.temp.toFixed(1)}°C`} 
          color="text-cyan-400" 
          borderClass="border-l-cyan-500 shadow-[inset_10px_0_15px_-10px_rgba(0,242,255,0.2)]"
        />
        <SensorCard icon={<Gauge size={16} />} label="Velocity" value={`${sensors.speed.toFixed(2)} m/s`} color="text-white" />
        <SensorCard icon={<MapPin size={16} />} label="Obstacles" value="04" color="text-white" />
      </div>

      <div className="flex-1 glass-card p-4 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest uppercase">Telemetry Stream</span>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[8px] text-white/40 font-bold uppercase">SPD</span>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(5, 7, 10, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ fontSize: '10px' }}
              />
              <Line type="monotone" dataKey="velocity" stroke="#00f2ff" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="v" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SensorCard({ icon, label, value, color, subValue, borderClass }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`glass-card p-3 flex flex-col justify-between h-24 hover:border-white/20 transition-all border-l-2 ${borderClass || 'border-l-white/10'}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-white/30">{icon}</div>
        {subValue && <span className="text-[8px] text-white/20 font-mono">{subValue}</span>}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest">{label}</span>
        <span className={`text-2xl font-light tracking-tight ${color}`}>{value}</span>
      </div>
    </motion.div>
  );
}
