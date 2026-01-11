Arduino Mega Wifi
=================

Overview
- This folder contains sketches and resources for an Arduino Mega board with
  WiFi connectivity (ESP8266/ESP32-based module or WiFi shield) used in the
  RefinAir project. It complements the `Arduino_Code` folder (sensor-only
  Mega sketches) and may contain board-specific flashing tools and libraries.

What to expect inside
- Sketch files (.ino) tailored for Mega + WiFi.
- Possible helper scripts for flashing (esp8266/esp32 flasher utilities).
- A `libraries/` folder or notes listing required Arduino libraries.

Required Arduino libraries (typical)
- `Adafruit_BME280` (BME280 temperature/pressure/humidity)
- `Adafruit_Sensor` (sensor base classes)
- `PMS` or `PMS5003` (Plantower PMS particulate sensor)
- `MHZ19` (CO2 sensor) or similar
- `WiFi` or `ESP8266WiFi` / `WiFi.h` depending on the WiFi module
- `PubSubClient` (if using MQTT), or `HTTPClient`/`WiFiClient` for direct HTTP

Flashing / upload
- For Arduino Mega + ESP8266 WiFi module:
  - If the WiFi module is separate (ESP8266 as AT-module), upload the sketch
    to the Mega using the Arduino IDE with board `Arduino Mega 2560`.
  - If using an ESP32/ESP8266 as the main MCU (completely replacing the Mega),
    select the correct board in the Arduino IDE (e.g., `ESP32 Dev Module`).
- If the folder contains an ESP flasher tool, use the provided instructions or
  the official `esptool.py` / ESP flasher GUI included in that folder.

Serial monitor / data format
- The main `Arduino_Code.ino` prints CSV-like lines containing timestamp and
  sensor values (PM1.0, PM2.5, PM10, temperature, humidity, CO2, etc.).
- Typical Serial settings: `115200` baud, `Newline` line ending. Check the
  top of the sketch for the exact `Serial.begin(<baud>)` value.

Wiring hints
- BME280: connect via I2C (SDA, SCL) + 3.3V and GND.
- PMS5003: uses UART (TX/RX) — match the Mega's serial pins or a software
  serial port.
- MH-Z19 CO2: UART or PWM depending on model. Use a separate serial port to
  avoid conflicts with the USB-Serial connection.

Notes and caveats
- Many sensor libraries require 3.3V logic; ensure level shifting when using
  5V Arduino signals with 3.3V devices.
- If you want, I can inspect specific sketch files in this folder and produce
  a detailed README listing exact library versions, wiring diagrams, and
  commands to flash each board.
