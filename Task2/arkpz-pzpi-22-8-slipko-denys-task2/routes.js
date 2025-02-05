const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql } = require("./db");

const router = express.Router();
router.use(express.json());

/**
 * @swagger
 * tags:
 *   - name: Public
 *     description: Доступно без авторизації
 */
/** ---------- 📌 PUBLIC ROUTES (Без авторизації) ---------- **/
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Успішна реєстрація
 */
router.post("/auth/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Усі поля обов'язкові" });
        }

        // Перевіряємо, чи існує користувач
        const existingUser = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: "Користувач вже існує" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await sql.query`
            INSERT INTO Users (username, password_hash, role)
            VALUES (${username}, ${hashedPassword}, 'user')`;

        res.status(201).json({ message: "Користувач зареєстрований" });
    } catch (error) {
        console.error("Помилка реєстрації:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Авторизація користувача
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успішна авторизація
 */
router.post("/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Усі поля обов'язкові" });
        }

        const result = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
        const user = result.recordset[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: "Невірний логін або пароль" });
        }

        res.json({ message: "Авторизація успішна" });
    } catch (error) {
        console.error("Помилка авторизації:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

module.exports = router;
