/*
 * Arduino Uno R3 - Motor & Telemetry Control
 * -----------------------------------------
 * Hardware: L298N Motor Driver, DHT11 (Optional), Voltage Divider (Battery)
 */

#include <SoftwareSerial.h>

// Motor Pins (L298N)
const int ENA = 5;  // PWM
const int IN1 = 7;
const int IN2 = 8;
const int IN3 = 9;
const int IN4 = 10;
const int ENB = 6;  // PWM

// Telemetry Variables
float batteryVoltage = 12.4;
float temperature = 24.5;

void setup() {
  Serial.begin(115200); // Communication with ESP32-CAM
  
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENB, OUTPUT);
  
  stopMotors();
}

void loop() {
  // Listen for commands from ESP32
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    processCommand(cmd);
  }

  // Send Telemetry every 1 second
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 1000) {
    sendTelemetry();
    lastUpdate = millis();
  }
}

void processCommand(String cmd) {
  cmd.trim();
  if (cmd.startsWith("MOVE")) {
    // Expected format: "MOVE:linear,angular" (e.g. "MOVE:1.0,0.5")
    int commaIndex = cmd.indexOf(',');
    float linear = cmd.substring(5, commaIndex).toFloat();
    float angular = cmd.substring(commaIndex + 1).toFloat();
    drive(linear, angular);
  } 
  else if (cmd == "STOP") {
    stopMotors();
  }
}

void drive(float linear, float angular) {
  // Simple Differential Drive Logic
  int leftSpeed = (linear - angular * 0.5) * 255;
  int rightSpeed = (linear + angular * 0.5) * 255;

  // Constrain speeds
  leftSpeed = constrain(leftSpeed, -255, 255);
  rightSpeed = constrain(rightSpeed, -255, 255);

  controlMotor(IN1, IN2, ENA, leftSpeed);
  controlMotor(IN3, IN4, ENB, rightSpeed);
}

void controlMotor(int in1, int in2, int en, int speed) {
  if (speed > 0) {
    digitalWrite(in1, HIGH);
    digitalWrite(in2, LOW);
  } else if (speed < 0) {
    digitalWrite(in1, LOW);
    digitalWrite(in2, HIGH);
  } else {
    digitalWrite(in1, LOW);
    digitalWrite(in2, LOW);
  }
  analogWrite(en, abs(speed));
}

void stopMotors() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 0);
  analogWrite(ENB, 0);
}

void sendTelemetry() {
  // Send formatted data back to ESP32: "T:batt,temp,status"
  Serial.print("T:");
  Serial.print(batteryVoltage);
  Serial.print(",");
  Serial.print(temperature);
  Serial.println(",OK");
}
