#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include "PMS.h"
#include "MQ7.h"
#include "MHZ19.h"
#include <Multichannel_Gas_GMXXX.h>

#define A_PIN 0
#define VOLTAGE 7

#define SEALEVELPRESSURE_HPA (999.00)
float temp;
float hum;
float pressure;
float alt;
float pm1;
float pm25;
float pm10;
float co;

Adafruit_BME280 bme;

PMS pms(Serial2);
PMS::DATA data;

// init MQ7 device
MQ7 mq7(A_PIN, VOLTAGE);

MHZ19 myMHZ19;                                             // Constructor for library
unsigned long getDataTimer = 0;
char CO2String[10];
char outstr[6];

GAS_GMXXX<TwoWire> gas;
static uint8_t recv_cmd[8] = {};

void setup() {
  Serial.begin(9600);
  Serial1.begin(9600);  //MH-Z19B Serial
  myMHZ19.begin(Serial1);                                // *Serial(Stream) refence must be passed to library begin().
  myMHZ19.autoCalibration();                              // Turn auto calibration ON (OFF autoCalibration(false))
  
  Serial2.begin(9600);  //PMS5003 Serial
  Serial.println("Calibrating MQ7");
  mq7.calibrate();    // calculates R0
  Serial.println("MQ7 Calibration done!");
  pms.passiveMode();    // Switch to passive mode
  pms.wakeUp();
  if (!bme.begin(0x76)) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1);
  }
  gas.begin(Wire, 0x08);
}

void loop() {
  //BME280 Readings
  temp = bme.readTemperature();
  hum = bme.readHumidity();
  pressure = bme.readPressure() / 100.0F;
  alt = bme.readAltitude(SEALEVELPRESSURE_HPA);

  //MQ-7 Readings
  co = mq7.readPpm();
  
  //PMS5003 Readings
  //pms.wakeUp();
  //delay(2000);
  pms.requestRead();
  if (pms.readUntil(data))
  {
    pm1 = data.PM_AE_UG_1_0;
    pm25 = data.PM_AE_UG_2_5;
    pm10 = data.PM_AE_UG_10_0;
  }
  //pms.sleep();


  static int CO2=0; 
  if (millis() - getDataTimer >= 2000){
        CO2 = myMHZ19.getCO2();  // Request CO2 (as ppm)                                 
        getDataTimer = millis();
   }

  float no2 = 0;
  float no22 = 0;
  uint32_t voc = 0;

  no2 = gas.measure_NO2();
  no22 = no2 / 1000;
  voc = gas.measure_VOC();
  //Serial Printing Data
  Serial.print(temp);
  Serial.print("x");
  Serial.print(hum);
  Serial.print("x");
  Serial.print(pressure);
  Serial.print("x");
  Serial.print(alt);
  Serial.print("x");
  Serial.print(pm1);
  Serial.print("x");
  Serial.print(pm25);
  Serial.print("x");
  Serial.print(pm10);
  Serial.print("x");
  Serial.print(co);
  Serial.print("x");
  Serial.print(CO2);
  Serial.print("x");
  Serial.print(no22);
  Serial.print("x");
  Serial.println(voc);
  delay(5000);
}
