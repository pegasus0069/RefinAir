# Arduino Code

This folder contains the main Arduino sketch(s) used to read sensors and print/send measurements.

Quick flash & run instructions

1. Install the Arduino IDE (or PlatformIO).
2. Connect your board (this sketch expects an Arduino Mega-compatible board because it uses `Serial2`).
3. Open `Arduino_Code.ino` in the Arduino IDE.
4. Select: `Tools > Board > Arduino/Genuino Mega or Mega 2560` and the correct `Tools > Port` for your device.

Required libraries

- `Adafruit_BME280` (and its dependency `Adafruit_Sensor`)
- `PMS` (PMS5003 library for particulate sensor)
- `MHZ19` (for MH-Z19 CO2 sensor)
- `Multichannel_Gas_GMXXX` (for multi-channel gas sensor)
- `MQ7` (MQ7 CO sensor helper)

Install libraries

- Use `Sketch > Include Library > Manage Libraries...` in the Arduino IDE and search for the above libraries, or copy the folders from `Arduino Mega Wifi/libraries/` into your Arduino libraries directory.

Flash

1. Click `Verify` to compile.
2. Click `Upload` to flash the board.
3. Open `Tools > Serial Monitor` at `9600` baud to view sensor output (the sketch prints a set of values separated by `x`).

Power and wiring notes

- Make sure sensors are powered by the correct voltages.
- If using WiFi/ESP modules, flash them with the provided tools in `Arduino Mega Wifi/` or use the Arduino IDE's upload flow for those modules.
