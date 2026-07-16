# Rover Wiring & Hardware Guide

## 1. Power Architecture (CRITICAL)
- **Battery A (7.2V Li-ion):** Connects to the **L298N 12V terminal**. Use the L298N's onboard 5V regulator ONLY if the logic current is low.
- **Buck Converter (7.2V to 5V):** Connect the 7.2V battery to the buck converter input. Set output to **exactly 5.0V**. Connect this to the **5V pin of the ESP32-CAM**. 
  - *Note:* ESP32-CAM is very sensitive to voltage drops during WiFi transmission.
- **Battery B (7.2V LiPo):** Connect directly to the **Arduino Barrel Jack**.
- **Common Ground:** Connect the GND of the ESP32, Arduino, L298N, and both batteries together. **This is mandatory.**

## 2. Arduino <-> ESP32-CAM Serial Interface
This is how the two boards talk to each other.

| ESP32-CAM Pin | Arduino Pin | Logic |
| :--- | :--- | :--- |
| **U0T (GPIO 1)** | **Pin 0 (RX)** | ESP32 Transmit -> Arduino Receive |
| **U0R (GPIO 3)** | **Pin 1 (TX)** | ESP32 Receive <- Arduino Transmit |
| **GND** | **GND** | Common Ground (MUST be connected) |

*Note: Disconnect these two wires whenever you are uploading new code to the Arduino Uno.*

## 3. Master Pin Map (Connections Table)

| Component | ESP32 Pin | Arduino Pin | Driver/Sensor Pin | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Power (Buck)** | 5V / GND | - | - | Exactly 5.0V from Buck Output |
| **L298N (IN1)** | - | D9 | IN1 | Front Left Forward |
| **L298N (IN2)** | - | D8 | IN2 | Front Left Backward |
| **L298N (IN3)** | - | D7 | IN3 | Front Right Forward |
| **L298N (IN4)** | - | D6 | IN4 | Front Right Backward |
| **L298N (ENA)** | - | D10 | EnA (Jumper Off) | Speed PWM |
| **L298N (ENB)** | - | D5 | EnB (Jumper Off) | Speed PWM |
| **Servo Mast** | - | D3 | Signal (Yellow) | Pan Motion |
| **Ultrasonic** | - | D11 | Trig | Trigger Pin |
| **Ultrasonic** | - | D12 | Echo | Return Signal |
| **Serial Link** | U0T (GPIO 1) | Pin 0 (RX) | - | ESP TX -> Arduino RX |
| **Serial Link** | U0R (GPIO 3) | Pin 1 (TX) | - | ESP RX -> Arduino TX |

### 🛑 CRITICAL POWER NOTE
1. **Common Ground:** All GND pins (Buck, Battery, Arduino, ESP32, L298N) **MUST** be connected together. If they aren't, the signals will be "floating" and the motors/servos will jump randomly.
2. **5V Supply:** Feed the 5V from the Buck converter into the **ESP32 5V** and **Arduino 5V** pins (not VIN, as VIN needs 7V+).

## 4. Programming the ESP32-CAM (FTDI - Recommended)
The FTDI method is much more stable than using an Arduino as a bridge.

1. **Set FTDI Voltage:** Ensure your FTDI adapter is set to **5V** (via jumper).
2. **Connections:**
   - **FTDI GND** -> **ESP32 GND**
   - **FTDI 5V** -> **ESP32 5V**
   - **FTDI TX** -> **ESP32 U0R (RX)**
   - **FTDI RX** -> **ESP32 U0T (TX)**
3. **Flash Mode:** Connect **GPIO 0** to **GND** on the ESP32-CAM.
4. **Upload:** Use **115200 baud** in the Arduino IDE.
5. **Post-Upload:** Remove the GPIO 0 wire and press **Reset**.

## 5. Safe Operation Tips
1. **Current Draw:** 4 BO motors can pull significant current. Do not run them from the Arduino's 5V pin.
2. **Servo Jitter:** Servos cause noise. Add a 100uF - 470uF capacitor across the servo power lines if the camera feed flickers when the servo moves.
3. **Heat:** The OV3660 and ESP32 get hot. Ensure the ESP32-CAM is not enclosed in a completely airtight box.
