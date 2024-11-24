//  LIBRARY-Blynk
//====================================================
#define BLYNK_PRINT Serial
#include <ESP8266_Lib.h> // insert this library 
#include <BlynkSimpleShieldEsp8266.h>
//====================================================

//  Initialitation
//====================================================
char auth[] = "2626aXgFo0b3_bDAQURC_FE66OsAG-8A";
char ssid[] = "haha";
char pass[] = "cumakamu";
#define EspSerial Serial3
#define ESP8266_BAUD 115200
ESP8266 wifi(&EspSerial);

//====================================================
// write data from blynk on virtual 2
BLYNK_WRITE(V2) {
  if (param.asInt()) {
    digitalWrite(13, HIGH);
    //turn led on arduino mega wifi
  }
  else {
    digitalWrite(13, LOW);
    //turn led off arduino mega wifi
  }

}
//====================================================


void setup()
{
  pinMode(13, OUTPUT);
  Serial.begin(115200);
  Serial3.begin(115200);

  delay(10);
  EspSerial.begin(ESP8266_BAUD);
  delay(10);

 // Blynk.begin(auth, wifi, ssid, pass);                          //Reguler server
  Blynk.begin(auth, wifi, ssid, pass,"blynk-cloud.com", 8080);    //Local server
}

void loop()
{
  Blynk.run();
  if ( Serial3.available() )   {
    Serial.write( Serial3.read() );
  }
  if ( Serial.available() )       {
    Serial3.write( Serial.read() );
  }

}
