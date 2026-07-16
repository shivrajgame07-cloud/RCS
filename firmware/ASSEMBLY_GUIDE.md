# Step-by-Step Assembly & Execution Guide

Follow these steps in order to ensure a safe and working rover.

## Phase 1: Uploading the Firmware
**Do this BEFORE physical assembly to ensure boards are working.**

### Step 1: Program the Arduino Uno
1. Disconnect everything from the Arduino.
2. Connect Arduino to PC via USB.
3. Open `arduino_uno_rover.ino` in Arduino IDE.
4. Select **Board: Arduino Uno** and **Port**.
5. Click **Upload**.
6. Once "Done uploading" appears, unplug the USB.

### Step 2: Program the ESP32-CAM (The "Flashing" Mode)
**Method A: FTDI Adapter (Best Success Rate)**
1. Connect FTDI 5V/GND/TX/RX to ESP32 (TX to RX, RX to TX).
2. Connect **GPIO 0 to GND**.
3. In IDE: Board "AI Thinker ESP32-CAM", Upload Speed **115200**.
4. Upload `esp32_cam_ov3660.ino`.

**Method B: Arduino Bridge (Fallback)**
1. Connect Arduino **RESET to GND**.
2. Connect ESP32 **GPIO 0 to GND**.
3. Connect ESP32 U0R -> Arduino Pin 0; U0T -> Arduino Pin 1.
4. Upload `esp32_cam_ov3660.ino`.

**After Upload (Crucial):** 
- **Disconnect GPIO 0 from GND.**
- Press the **Reset button** on the ESP32-CAM.
- Open Serial Monitor (115200 baud) to find the IP Address.

---

## Phase 2: Physical Assembly

### Step 3: Chassis and Motors
1. Mount the 4 BO Motors to your chassis.
2. Solder wires to each motor.
3. Connect Left motors in parallel (Left Front + Left Rear).
4. Connect Right motors in parallel (Right Front + Right Rear).

### Step 4: Motor Driver (L298N)
1. **Power:** Connect your **7.2V - 12V Battery** directly to the L298N terminals marked **12V** (Positive) and **GND** (Negative).
2. **Logic Pins:** Connect these to the Arduino:
   - **ENA** (Jumper removed) -> Arduino **D10**
   - **IN1** -> Arduino **D9**
   - **IN2** -> Arduino **D8**
   - **IN3** -> Arduino **D7**
   - **IN4** -> Arduino **D6**
   - **ENB** (Jumper removed) -> Arduino **D5**
3. **Motors:** Connect the pair of left motors to **OUT1/OUT2** and the pair of right motors to **OUT3/OUT4**.

### Step 5: Ultrasonic Sensor (HC-SR04)
1. Mount the sensor at the front of the rover.
2. **Wiring:**
   - **VCC** -> Arduino **5V** pin.
   - **GND** -> Arduino **GND** pin.
   - **Trig** -> Arduino **D11**.
   - **Echo** -> Arduino **D12**.

### Step 6: Servo Motor (Camera Mast)
1. **Wiring:**
   - **Red (VCC)** -> Arduino **5V** (or Buck Converter 5V if the Servo jitters).
   - **Black/Brown (GND)** -> Common **GND**.
   - **Yellow/Orange (Signal)** -> Arduino **D3**.

### Step 7: Power Integration (Buck Converter & Common Ground)
1. **Buck Converter Output:** 
   - **(Out +)** -> ESP32 **5V** pin AND Arduino **5V** pin (This keeps signals consistent).
   - **(Out -)** -> ESP32 **GND** pin AND Arduino **GND** pin.
2. **CRITICAL:** Ensure the GND terminal of the L298N is also connected to this same GND line. Without a "Common Ground," the code will not control the motors correctly.

---

## Phase 4: Troubleshooting & UI Sync

### ❌ No Camera Feed? (Check these 3 things)
1. **The Ribbon Cable:** Ensure the small golden strip on the camera ribbon is facing **UP** towards the ESP32 board and is pushed all the way into the connector before locking it.
2. **Port Mismatch:** The code now uses **HTTPS on port 443**. When you enter the IP in the dashboard, it should look like `192.168.1.150` (the app will add `https://` and `:443` automatically).
3. **Browser Security (HTTPS Block) - MANDATORY STEP:**
   - Because your ESP32 uses a "Self-Signed" certificate (it's not from a big company like Google), your browser will show a warning.
   - **YOU MUST:** Open `https://<YOUR_IP>/stream` in a new browser tab first.
   - You will see a "Your connection is not private" screen.
   - Click **Advanced** and then **Proceed to <IP> (unsafe)**.
   - Once the camera image loads in that tab, it will now load in this Dashboard too!

### 🔴 Arduino Communication Check
If you can see the camera but the motors don't move:
1. Check the **Baud Rate**. Both `arduino_uno_rover.ino` and `esp32_cam_ov3660.ino` must be set to **115200**.
2. **TX/RX Swapping:** If you connected ESP U0T -> Arduino Pin 0 and it doesn't work, try swapping them (U0T -> Pin 1). *Note: Pin 0 and 1 on the Uno is sometimes tricky when USB is plugged in.*

### 🛠️ Hardware Safety
- **OV3660 Heat:** The camera module will get warm. This is normal.
- **Motor Jitter:** If the motors twitch when the camera starts, your battery is weak or the buck converter cannot handle the surge. Use a high-quality 2S LiPo battery.

### Phase 4: Troubleshooting Upload Errors

#### 🔴 CRITICAL FIX: "The chip stopped responding" / "StopIteration"
Your error log shows the IDE is trying to upload at **460800** baud. The Arduino Uno cannot handle this speed as a bridge.
1. **In Arduino IDE:** Go to **Tools** > **Upload Speed**.
2. **Change it to 115200**. (If that fails, try **57600**).
3. **Try uploading again.**

#### 🛠️ Arduino Bridge Checklist (Double Check These!)
If the chip still stops responding, verify these physical connections:
1. **Arduino RESET pin** MUST be connected directly to **Arduino GND**. This "silences" the Arduino so it doesn't fight the ESP32 for the serial line.
2. **ESP32 GPIO 0** MUST be connected to **ESP32 GND** *before* you plug in the USB.
3. **Serial Crossover:**
   - ESP32 **U0R** -> Arduino **Pin 0 (RX)**
   - ESP32 **U0T** -> Arduino **Pin 1 (TX)**
   - *Wait!* If you are using Reset-to-GND method, you connect **RX to RX** and **TX to TX** because you are using the Arduino's USB chip directly. Try swapping Pin 0 and Pin 1 if it fails to connect.
4. **Power:** The ESP32-CAM is power-hungry. If the lights on the Arduino dim when you try to upload, the USB port might not be providing enough current. Try using a powered USB hub.

#### 🔄 Manual Reset Trick
If it hangs at `Connecting.......`:
1. Hold the **Reset button** on the ESP32-CAM.
2. Click **Upload** in the IDE.
3. As soon as you see the first `.` (Connecting...), **release** the Reset button.
