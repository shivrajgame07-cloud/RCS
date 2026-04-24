export interface RobotPose {
  x: number;
  y: number;
  yaw: number;
}

export interface RobotSensors {
  battery: number;
  speed: number;
  temp: number;
  humidity: number;
  voltage: number;
  signal: number;
  wifiFreq: number;
  distanceToTarget: number;
}

export interface RobotState {
  connected: boolean;
  pose: RobotPose;
  sensors: RobotSensors;
  status: string;
  lastUpdate: number;
}

export interface ControlCommand {
  linear: number;
  angular: number;
}

export interface VoiceCommandStep {
  type: 'move' | 'turn';
  value: number;
  unit: 'cm' | 'deg';
}
