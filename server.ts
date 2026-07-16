import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import https from "https";
import http from "http";

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
      acceleration: 0,
      temp: 24,
      humidity: 45,
      voltage: 12.4,
      signal: -45,
      wifiFreq: 2.4,
      distanceToTarget: 0,
      proximity: 200,
      servoAngle: 90
    },
    status: "Idle",
    lastUpdate: Date.now()
  };

  let targetSpeed = 0;
  let targetTurnRate = 0;

  // Simulation Logic
  const SIM_INTERVAL = 50; // Faster update for smoothness
  setInterval(() => {
    // Smooth speed interpolation (simple acceleration model)
    const prevSpeed = robotState.sensors.speed;
    robotState.sensors.speed += (targetSpeed - robotState.sensors.speed) * 0.1;
    robotState.sensors.acceleration = (robotState.sensors.speed - prevSpeed) / (SIM_INTERVAL / 1000);
    
    // Smooth yaw change
    robotState.pose.yaw += targetTurnRate * 0.05;

    if (Math.abs(robotState.sensors.speed) > 0.01) {
      robotState.pose.x += Math.cos(robotState.pose.yaw) * robotState.sensors.speed * 0.1;
      // Subtract sin for Z because Z- is North (CCW from X+)
      robotState.pose.y -= Math.sin(robotState.pose.yaw) * robotState.sensors.speed * 0.1;
      
      // Slight sensor jitter
      robotState.sensors.voltage = 12.4 + (Math.random() - 0.5) * 0.05;
    }
    
    // Only simulate if not connected to a real robot, or if just testing
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
      targetSpeed = command.linear;
      targetTurnRate = command.angular;
      robotState.status = command.linear !== 0 || command.angular !== 0 ? "Moving" : "Idle";
      
      // Update proxy proximity for simulation if in demo mode
      if (Math.abs(targetSpeed) > 0) {
        robotState.sensors.proximity = Math.max(10, 200 - (Math.random() * 50));
      } else {
        robotState.sensors.proximity = 200 + (Math.random() * 10);
      }

      // Broadcast to physical robot
      io.emit("robot_move", command);
    });

    socket.on("servo_move", (data) => {
      // data: { angle: number }
      if (data && data.angle !== undefined) {
        robotState.sensors.servoAngle = data.angle;
        io.emit("robot_servo", data);
      }
    });

    socket.on("phone_telemetry", (data) => {
      // Data from Android app (Battery, Temp, Humidity)
      if (!data) return;
      if (data.battery !== undefined) robotState.sensors.battery = data.battery;
      if (data.temp !== undefined) robotState.sensors.temp = data.temp;
      if (data.humidity !== undefined) robotState.sensors.humidity = data.humidity;
      io.emit("status_change", { status: "Phone Linked", connected: true });
    });

    socket.on("voice_command", async (command) => {
      console.log("Voice command received:", command);
      io.emit("command_ack", { text: `Processing sequence: ${command.raw}`, steps: command.steps });
      
      if (command.raw.toLowerCase().includes("stop")) {
        io.emit("emergency_stop");
        return;
      }

      // Execute steps sequentially
      for (const step of command.steps) {
        if (step.type === 'move') {
          // Approximate speed/duration for simulation
          targetSpeed = step.value > 0 ? 1 : -1;
          const duration = Math.abs(step.value) * 10; // 10ms per cm approx
          await new Promise(resolve => setTimeout(resolve, duration));
          targetSpeed = 0;
        } else if (step.type === 'turn') {
          targetTurnRate = step.value > 0 ? 1 : -1;
          const duration = Math.abs(step.value) * 5; // 5ms per degree approx
          await new Promise(resolve => setTimeout(resolve, duration));
          targetTurnRate = 0;
        }
        await new Promise(resolve => setTimeout(resolve, 200)); // Pause between steps
      }

      io.emit("command_ack", { text: "Sequence completed." });
    });

    socket.on("emergency_stop", () => {
      robotState.sensors.speed = 0;
      robotState.status = "EMERGENCY STOP";
      io.emit("status_change", { status: "EMERGENCY STOP", connected: true });
      io.emit("robot_stop"); // Force physical robot to stop
    });

    // Handle info from physical robot when it connects
    socket.on("robot_connect_info", (info) => {
      console.log("Robot Info Received:", info);
      robotState.connected = true;
      robotState.status = "Robot Online";
      io.emit("status_change", { status: "Robot Online", connected: true });
      
      // Tell system where the camera is (local IP + port 443 HTTPS)
      io.emit("camera_url_update", `https://${info.ip}:443/stream`);
    });

    // Handle telemetry from physical robot
    socket.on("telemetry_update", (update) => {
      if (update && typeof update === 'object') {
        robotState.sensors = { ...robotState.sensors, ...update };
      }
      robotState.lastUpdate = Date.now();
      robotState.connected = true;
    });
  });

  // API routes
  app.get("/api/proxy", (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).send("No URL provided");
    
    try {
      const url = new URL(targetUrl);
      const isHttps = url.protocol === "https:";
      const client = isHttps ? https : http;

      const proxyReq = client.request(targetUrl, {
        timeout: 10000,
        rejectUnauthorized: false, // Allow self-signed certs for hobbyist devices
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }, (proxyRes) => {
        // Set headers from the target
        res.writeHead(proxyRes.statusCode || 200, {
          ...proxyRes.headers,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        
        proxyRes.pipe(res, { end: true });
      });

      proxyReq.on("error", (err) => {
        console.error("Proxy error:", err);
        if (!res.headersSent) {
          res.status(500).send("Proxy error: " + err.message);
        }
      });

      proxyReq.on("timeout", () => {
        proxyReq.destroy();
        if (!res.headersSent) {
          res.status(504).send("Proxy timeout");
        }
      });

      req.on('close', () => {
        proxyReq.destroy();
      });

      req.pipe(proxyReq, { end: true });
    } catch (e) {
      res.status(400).send("Invalid URL");
    }
  });

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
