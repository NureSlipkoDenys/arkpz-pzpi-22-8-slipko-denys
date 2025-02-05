require("dotenv").config({ path: "./backend/.env" });

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const setupSwagger = require("./swagger"); // Подключаем Swagger

// Инициализация приложения
const app = express();
const PORT = process.env.PORT || 5000;

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
