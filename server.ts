import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Robot State
  let robotState = {
    connected: false,
    pose: { x: 0, y: 0, yaw: 0 },
    sensors: {
      battery: 85,
      speed: 0,
      temp: 24,
      humidity: 45,
      voltage: 12.4,
      signal: -45,
      wifiFreq: 2.4,
      distanceToTarget: 0
    },
    status: "Idle",
    lastUpdate: Date.now()
  };

  // Simulation Logic
  const SIM_INTERVAL = 100;
  setInterval(() => {
    if (robotState.sensors.speed > 0 || robotState.sensors.speed < 0) {
      robotState.pose.x += Math.cos(robotState.pose.yaw) * robotState.sensors.speed * 0.1;
      robotState.pose.y += Math.sin(robotState.pose.yaw) * robotState.sensors.speed * 0.1;
      
      // Slight sensor jitter
      robotState.sensors.voltage = 12.4 + (Math.random() - 0.5) * 0.1;
      robotState.sensors.temp = 24 + (Math.random() - 0.5) * 0.2;
    }
    
    if (robotState.connected) {
      io.emit("telemetry", robotState);
    }
  }, SIM_INTERVAL);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    socket.emit("telemetry", robotState);

    socket.on("connect_robot", (config) => {
      console.log("Connecting to robot:", config.ip);
      robotState.connected = true;
      robotState.status = "Connected";
      io.emit("status_change", { status: "Connected", connected: true });
    });

    socket.on("disconnect_robot", () => {
      robotState.connected = false;
      robotState.status = "Disconnected";
      io.emit("status_change", { status: "Disconnected", connected: false });
    });

    socket.on("move", (command) => {
      // command: { linear: number, angular: number }
      robotState.sensors.speed = command.linear;
      robotState.pose.yaw += command.angular * 0.05;
      robotState.status = command.linear !== 0 ? "Moving" : "Idle";
      console.log("Move command:", command);
    });

    socket.on("voice_command", (command) => {
      console.log("Voice command received:", command);
      // Logic for parsing complex voice commands would go here
      // For now, relay back an acknowledgment
      io.emit("command_ack", { text: `Executing: ${command.raw}`, steps: command.steps });
    });

    socket.on("emergency_stop", () => {
      robotState.sensors.speed = 0;
      robotState.status = "EMERGENCY STOP";
      io.emit("status_change", { status: "EMERGENCY STOP", connected: true });
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
