/*
  Arduino Uno Rover Controller
  Handles: 4WD (L298N), HC-SR04, Servo Mast
*/

#include <Servo.h>

// MOTOR PINS
const int ENA = 10;
const int IN1 = 9;
const int IN2 = 8;
const int IN3 = 7;
const int IN4 = 6;
const int ENB = 5;

// ULTRASONIC PINS
const int TRIG_PIN = 11;
const int ECHO_PIN = 12;

// SERVO
Servo mastServo;
const int SERVO_PIN = 3;

void setup() {
  Serial.begin(115200); // Higher baud for ESP32 matching
  
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENB, OUTPUT);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  mastServo.attach(SERVO_PIN);
  mastServo.write(90); // Center
  
  stopMotors();
  Serial.println("ROVER_READY");
}

void loop() {
  // 1. Process Serial Commands
  if (Serial.available()) {
    char cmd = Serial.read();
    handleCommand(cmd);
  }
  
  // 2. Continuous Proximity Check
  long distance = getDistance();
  if (distance < 15 && distance > 0) {
    // Immediate stop if obstacle too close
    stopMotors();
    Serial.print("OBSTACLE_DETECTED:");
    Serial.println(distance);
  }
  
  delay(50);
}

void handleCommand(char cmd) {
  switch (cmd) {
    case 'F': moveForward(200); break;
    case 'B': moveBackward(200); break;
    case 'L': turnLeft(200); break;
    case 'R': turnRight(200); break;
    case 'S': stopMotors(); break;
    // Servo angles can be sent as direct values in a production version
    case '1': mastServo.write(45); break;
    case '2': mastServo.write(90); break;
    case '3': mastServo.write(135); break;
  }
}

long getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  long cm = duration * 0.034 / 2;
  return cm;
}

void moveForward(int speed) {
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void moveBackward(int speed) {
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
}

void turnLeft(int speed) {
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void turnRight(int speed) {
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
}

void stopMotors() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 0);
  analogWrite(ENB, 0);
}
