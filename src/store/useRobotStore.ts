import { create } from 'zustand';
import { RobotState, RobotPose, RobotSensors } from '../types';

interface RobotStore {
  state: RobotState;
  isDemoMode: boolean;
  camUrl: string;
  setTelemetry: (state: Partial<RobotState>) => void;
  setDemoMode: (enabled: boolean) => void;
  setCamUrl: (url: string) => void;
  addLog: (message: string) => void;
  logs: { timestamp: string; message: string }[];
}

export const useRobotStore = create<RobotStore>((set) => ({
  state: {
    connected: false,
    pose: { x: 0, y: 0, yaw: 0 },
    sensors: {
      battery: 0,
      speed: 0,
      temp: 0,
      humidity: 0,
      voltage: 0,
      signal: 0,
      wifiFreq: 0,
      distanceToTarget: 0
    },
    status: 'Disconnected',
    lastUpdate: Date.now()
  },
  isDemoMode: true,
  camUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800', // Default placeholder
  logs: [],
  setTelemetry: (newState) => set((s) => ({
    state: { ...s.state, ...newState }
  })),
  setDemoMode: (enabled) => set({ isDemoMode: enabled }),
  setCamUrl: (url) => set({ camUrl: url }),
  addLog: (message) => set((s) => ({
    logs: [{ timestamp: new Date().toLocaleTimeString(), message }, ...s.logs].slice(0, 50)
  }))
}));
