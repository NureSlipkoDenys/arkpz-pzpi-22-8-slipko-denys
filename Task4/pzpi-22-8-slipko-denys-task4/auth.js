const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql } = require("./db"); // Подключение к БД

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// 📌 Middleware для проверки JWT
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Требуется авторизация" });

    const token = authHeader.split(" ")[1];
    try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch (error) {
        res.status(401).json({ error: "Неверный токен" });
    }
}

// 📌 Регистрация пользователя
router.post("/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Все поля обязательны" });
        }

        // Защита от некорректных ролей
        const validRoles = ["user", "admin"];
        const userRole = validRoles.includes(role) ? role : "user";

        const hashedPassword = await bcrypt.hash(password, 10);
        await sql.query`INSERT INTO Users (username, password_hash, role) VALUES (${username}, ${hashedPassword}, ${userRole})`;

        res.status(201).json({ message: "Пользователь зарегистрирован", role: userRole });
    } catch (error) {
        console.error("Ошибка регистрации:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// 📌 Авторизация пользователя
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Все поля обязательны" });
        }

        // Проверяем пользователя в БД
        const result = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
        const user = result.recordset[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: "Неверный логин или пароль" });
        }

        console.log("🔹 Генерация токена с ключом:", SECRET_KEY);
        // Генерируем токен
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
        );

        res.json({ token });
    } catch (error) {
        console.error("Ошибка авторизации:", error.message);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// 📌 Получение текущего пользователя
router.get("/me", authMiddleware, (req, res) => {
    res.json(req.user);
});

module.exports = router;
