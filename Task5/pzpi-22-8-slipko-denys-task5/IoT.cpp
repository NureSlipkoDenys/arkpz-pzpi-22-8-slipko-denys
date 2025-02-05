#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Wi-Fi налаштування
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT налаштування
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "esp32/gps";
WiFiClient espClient;
PubSubClient client(espClient);

// Налаштування HTTP сервера
const char* serverUrl = "http://localhost:5000/api/vehicle-locations"; 

// Піни ультразвукового датчика
#define TRIG_PIN 5
#define ECHO_PIN 18

// Базові координати
float baseLatitude = 50.4501;
float baseLongitude = 30.5234;
int vehicle_id = 1;  

void setupWiFi() {
    Serial.println("🔄 Підключення до WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\n✅ WiFi підключено!");
}

void reconnectMQTT() {
    while (!client.connected()) {
        Serial.println("🔄 Підключення до MQTT...");
        if (client.connect("ESP32Client")) {
            Serial.println("✅ MQTT підключено!");
        } else {
            Serial.print("❌ Помилка підключення. Код: ");
            Serial.println(client.state());
            delay(5000);
        }
    }
}

float getDistance() {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    float duration = pulseIn(ECHO_PIN, HIGH);
    return duration * 0.034 / 2; // Відстань у см
}

void sendGPSData() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("❌ WiFi не підключено");
        return;
    }

    float distance = getDistance();

    // Симуляція GPS-зміни
    float latitude = baseLatitude + (distance * 0.0001);
    float longitude = baseLongitude + (distance * 0.0001);

    StaticJsonDocument<200> jsonDoc;
    jsonDoc["vehicle_id"] = vehicle_id;
    jsonDoc["latitude"] = latitude;
    jsonDoc["longitude"] = longitude;

    char jsonBuffer[200];
    serializeJson(jsonDoc, jsonBuffer);

    // Відправка через MQTT
    client.publish(mqtt_topic, jsonBuffer);
    Serial.println("📡 GPS-дані відправлені через MQTT");

    // Відправка через HTTP
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonBuffer);
    
    if (httpResponseCode > 0) {
        Serial.print("✅ HTTP Відповідь сервера: ");
        Serial.println(httpResponseCode);
    } else {
        Serial.print("❌ Помилка HTTP-запиту: ");
        Serial.println(httpResponseCode);
    }

    http.end();
}

void setup() {
    Serial.begin(115200);
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    setupWiFi();
    client.setServer(mqtt_server, mqtt_port);
}

void loop() {
    if (!client.connected()) {
        reconnectMQTT();
    }
    client.loop();
    sendGPSData();
    delay(5000);
}
