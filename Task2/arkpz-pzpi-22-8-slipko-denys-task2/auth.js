const express = require("express");
const bcrypt = require("bcryptjs");
const { sql } = require("./db"); // Подключение к БД

const router = express.Router();

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

        res.json({ message: "Авторизация успешна" });
    } catch (error) {
        console.error("Ошибка авторизации:", error.message);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

module.exports = router;
