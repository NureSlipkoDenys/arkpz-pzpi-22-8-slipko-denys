require("dotenv").config({ path: "./backend/.env" });

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const setupSwagger = require("./swagger"); // Подключаем Swagger
const mqtt = require("mqtt");
const { sql } = require("./db");

// Инициализация приложения
const app = express();
const PORT = process.env.PORT || 5000;
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");

// Middleware
app.use(cors());
app.use(express.json());

// Подключаем маршруты
const authRoutes = require("./auth");
const routes = require("./routes");

app.use("/auth", authRoutes);
app.use("/api", routes); // ✅ Все API теперь доступны по `/api/...`

// Подключаем Swagger
setupSwagger(app);

// Проверка работы API
app.get("/", (req, res) => {
    res.send("✅ API работает! Попробуйте /api/routes или /api-docs");
});

// Запуск сервера и подключение к базе данных
app.listen(PORT, async () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    await connectDB();

    
});

mqttClient.on("connect", () => {
    console.log("✅ Підключено до MQTT-брокера!");
    mqttClient.subscribe("esp32/gps", (err) => {
        if (!err) {
            console.log("📡 Підписано на топік esp32/gps");
        }
    });
});

mqttClient.on("message", async (topic, message) => {
    if (topic === "esp32/gps") {
        try {
            const data = JSON.parse(message.toString());
            const { latitude, longitude } = data;

            // Оновлюємо запис, якщо він є
            const result = await sql.query`
                UPDATE Vehicle_Locations
                SET latitude = ${latitude}, longitude = ${longitude}, timestamp = GETDATE()
                WHERE vehicle_id = 1`;

            // Якщо жоден рядок не оновлено (немає запису), тоді вставляємо новий
            if (result.rowsAffected[0] === 0) {
                await sql.query`
                    INSERT INTO Vehicle_Locations (vehicle_id, latitude, longitude, timestamp)
                    VALUES (1, ${latitude}, ${longitude}, GETDATE())`;
                console.log("📍 Новий запис додано:", latitude, longitude);
            } else {
                console.log("📡 Дані оновлено:", latitude, longitude);
            }

        } catch (error) {
            console.error("❌ Помилка збереження в БД:", error);
        }
    }
});
