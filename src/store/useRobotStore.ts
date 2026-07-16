import { create } from 'zustand';
import * as THREE from 'three';
import { RobotState, RobotPose, RobotSensors } from '../types';

interface RobotStore {
  state: RobotState;
  isDemoMode: boolean;
  camUrl: string;
  target: { x: number; y: number } | null;
  path: THREE.Vector3[];
  followCamera: boolean;
  setTelemetry: (state: Partial<RobotState>) => void;
  setDemoMode: (enabled: boolean) => void;
  setCamUrl: (url: string) => void;
  setTarget: (target: { x: number; y: number }) => void;
  setFollowCamera: (follow: boolean) => void;
  addLog: (message: string) => void;
  logs: { timestamp: string; message: string }[];
}

export const useRobotStore = create<RobotStore>((set, get) => ({
  state: {
    connected: false,
    pose: { x: 0, y: 0, yaw: 0 },
    sensors: {
      battery: 0,
      speed: 0,
      acceleration: 0,
      temp: 0,
      humidity: 0,
      voltage: 0,
      signal: 0,
      wifiFreq: 0,
      distanceToTarget: 0,
      proximity: 0,
      servoAngle: 90
    },
    status: 'Disconnected',
    lastUpdate: Date.now()
  },
  isDemoMode: true,
  camUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800', 
  target: null,
  path: [],
  followCamera: true,
  logs: [],
  setTelemetry: (newState) => set((s) => {
    if (!newState) return s;
    return {
      state: { ...s.state, ...newState }
    };
  }),
  setDemoMode: (enabled) => set({ isDemoMode: enabled }),
  setCamUrl: (url) => set({ camUrl: url }),
  setTarget: (target) => {
    import('../lib/pathfinding').then(({ aStar }) => {
      const pose = get().state.pose;
      const start = new THREE.Vector3(pose.x, 0.05, pose.y);
      const end = new THREE.Vector3(target.x, 0.05, target.y);
      const calculatedPath = aStar(start, end);
      set({ target, path: calculatedPath });
    });
  },
  setFollowCamera: (follow) => set({ followCamera: follow }),
  addLog: (message) => set((s) => ({
    logs: [{ timestamp: new Date().toLocaleTimeString(), message }, ...s.logs].slice(0, 50)
  }))
}));
