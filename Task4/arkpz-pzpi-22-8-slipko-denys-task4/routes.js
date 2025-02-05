const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql } = require("./db");
const { authMiddleware, isUser, isAdmin } = require("./authMiddleware");

const router = express.Router();
router.use(express.json());

/**
 * @swagger
 * tags:
 *   - name: VehiclesLoc
 *     description: Оновлення
 *   - name: Public
 *     description: Доступно без авторизації
 *   - name: User
 *     description: Звичайний користувач
 *   - name: Admin
 *     description: Адміністратор
 */
/** ---------- 📌 PUBLIC ROUTES (Без авторизації) ---------- **/
/**
 * 
 * 
/**
 * @swagger
 * /api/vehicle-location:
 *   post:
 *     summary: Оновлення GPS-координат транспорту
 *     tags: [VehiclesLoc]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_id:
 *                 type: integer
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Дані успішно оновлені
 *       201:
 *         description: Новий запис створено
 *       400:
 *         description: Некоректні дані
 *       500:
 *         description: Внутрішня помилка сервера
 */
router.post("/vehicle-locations", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { vehicle_id, latitude, longitude } = req.body;

        // Перевірка наявності обов'язкових полів
        if (!vehicle_id || !latitude || !longitude) {
            return res.status(400).json({ error: "Усі поля обов'язкові" });
        }

        // Оновлення існуючого запису
        const result = await sql.query`
            UPDATE Vehicle_Locations
            SET latitude = ${latitude}, longitude = ${longitude}
            WHERE vehicle_id = ${vehicle_id}`;

        // Перевірка, чи був оновлений хоча б один рядок
        if (result.rowsAffected[0] > 0) {
            return res.status(200).json({ message: "Дані локації успішно оновлено" });
        } else {
            return res.status(404).json({ error: "Локація для цього транспорту не знайдена" });
        }
    } catch (error) {
        console.error("Помилка оновлення локації:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});
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
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
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
            VALUES (${username}, ${hashedPassword}, ${role})`;

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

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });

        res.json({ token });
    } catch (error) {
        console.error("Помилка авторизації:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});


/** ---------- 📌 USER ROUTES (Потрібна авторизація) ---------- **/

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Отримання інформації про поточного користувача
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Інформація про користувача
 *       401:
 *         description: Потрібна авторизація
 */
router.get("/auth/me", authMiddleware, isUser, async (req, res) => {
    try {
        res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
    } catch (error) {
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/**
 * @swagger
 * /routes:
 *   get:
 *     summary: Отримати список маршрутів
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Список маршрутів
 *       500:
 *         description: Помилка сервера
 */
router.get("/routes", authMiddleware, isUser, async (req, res) => {
    try {
        const result = await sql.query`SELECT id, name, start_point, end_point, load_factor FROM Routes`;
        res.json(result.recordset);
    } catch (error) {
        console.error("Помилка отримання маршрутів:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/**
 * @swagger
 * /stops:
 *   get:
 *     summary: Отримати список зупинок
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Список зупинок
 *       500:
 *         description: Помилка сервера
 */
router.get("/stops", authMiddleware, isUser, async (req, res) => {
    try {
        const result = await sql.query("SELECT id, route_id, name, latitude, longitude, order_index FROM Stops");
        res.json(result.recordset);
    } catch (error) {
        console.error("Помилка отримання зупинок:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/**
 * @swagger
 * /sensor-data:
 *   post:
 *     summary: Надіслати дані з IoT датчиків
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_id:
 *                 type: integer
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               speed:
 *                 type: number
 *     responses:
 *       201:
 *         description: Дані успішно збережені
 *       500:
 *         description: Помилка сервера
 */
router.post("/sensor-data", authMiddleware, isUser, async (req, res) => {
    try {
        const { vehicle_id, latitude, longitude, speed } = req.body;
        if (!vehicle_id || !latitude || !longitude || !speed) {
            return res.status(400).json({ error: "Усі поля обов'язкові" });
        }

        await sql.query`
            INSERT INTO SensorData (vehicle_id, latitude, longitude, speed, timestamp)
            VALUES (${vehicle_id}, ${latitude}, ${longitude}, ${speed}, GETDATE())`;

        res.status(201).json({ message: "Дані успішно збережені" });
    } catch (error) {
        console.error("Помилка збереження даних:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});



/**
 * @swagger
 * /routes:
 *   post:
 *     summary: Додати новий маршрут (тільки для адмінів)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               start_point:
 *                 type: string
 *               end_point:
 *                 type: string
 *     responses:
 *       201:
 *         description: Маршрут успішно доданий
 */
router.post("/routes", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { name, start_point, end_point } = req.body;
        if (!name || !start_point || !end_point) {
            return res.status(400).json({ error: "Усі поля обов'язкові" });
        }

        await sql.query`
            INSERT INTO Routes (name, start_point, end_point, load_factor)
            VALUES (${name}, ${start_point}, ${end_point}, 0)`;

        res.status(201).json({ message: "Маршрут успішно доданий", load_factor: 0 });
    } catch (error) {
        console.error("Помилка додавання маршруту:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/**
 * @swagger
 * /routes/{id}:
 *   delete:
 *     summary: Видалити маршрут (тільки для адмінів)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Маршрут видалено
 */
router.delete("/routes/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await sql.query`DELETE FROM Routes WHERE id = ${id}`;
        res.status(200).json({ message: "Маршрут видалено" });
    } catch (error) {
        console.error("Помилка видалення маршруту:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});



/**
 * @swagger
 * /stops:
 *   post:
 *     summary: Додати нову зупинку (ручне введення)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               route_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 example: 50.4601
 *               longitude:
 *                 type: number
 *                 example: 30.523
 *               order_index:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Зупинка успішно додана
 *       400:
 *         description: Помилка валідації даних
 *       500:
 *         description: Помилка сервера
 */
router.post("/stops",  authMiddleware, isAdmin, async (req, res) => {
    try {
        const { route_id, name, latitude, longitude, order_index } = req.body;

        // Перевіряємо, що всі поля введені
        if (!route_id || !name || !latitude || !longitude || !order_index) {
            return res.status(400).json({ error: "Усі поля обов'язкові" });
        }

        // Додаємо зупинку до БД
        await sql.query`
            INSERT INTO Stops (route_id, name, latitude, longitude, order_index)
            VALUES (${route_id}, ${name}, ${latitude}, ${longitude}, ${order_index})`;

        res.status(201).json({ message: "Зупинка успішно додана" });
    } catch (error) {
        console.error("❌ Помилка додавання зупинки:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/**
 * @swagger
 * /stops/{id}:
 *   delete:
 *     summary: Видалити зупинку по ID
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Зупинку видалено
 *       404:
 *         description: Зупинку не знайдено
 *       500:
 *         description: Помилка сервера
 */
router.delete("/stops/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql.query`DELETE FROM Stops WHERE id = ${id}`;
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Зупинку не знайдено" });
        }

        res.status(200).json({ message: "Зупинку видалено" });
    } catch (error) {
        console.error("❌ Помилка видалення зупинки:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/** ---------- 📌 USERS (Користувачі) ---------- **/

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Отримати список користувачів (тільки для адмінів)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Список користувачів
 */
router.get("/users", authMiddleware, isAdmin, async (req, res) => {
    try {
        const result = await sql.query`SELECT id, username, role FROM Users`;
        res.json(result.recordset);
    } catch (error) {
        console.error("Помилка отримання користувачів:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Видалити користувача (тільки для адмінів)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Користувач видалено
 */
router.delete("/users/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await sql.query`DELETE FROM Users WHERE id = ${id}`;
        res.status(200).json({ message: "Користувач видалено" });
    } catch (error) {
        console.error("Помилка видалення користувача:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/** ---------- 📌 VEHICLES (Транспорт) ---------- **/

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Отримати список транспорту (тільки для адмінів)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Список транспортних засобів
 */
router.get("/vehicles", authMiddleware, isAdmin, async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Vehicles`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: "Помилка сервера" });
    }
});

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Додати новий транспортний засіб (тільки для адмінів)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               route_id:
 *                 type: integer
 *               type:
 *                 type: string
 *               number:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Транспорт успішно доданий
 */
router.post("/vehicles", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { route_id, type, number, status } = req.body;
        if (!route_id || !type || !number || !status) {
            return res.status(400).json({ error: "Усі поля обов'язкові" });
        }

        await sql.query`
            INSERT INTO Vehicles (route_id, type, number, status)
            VALUES (${route_id}, ${type}, ${number}, ${status})`;

        res.status(201).json({ message: "Транспорт успішно доданий" });
    } catch (error) {
        console.error("Помилка додавання транспорту:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});


/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Видалити транспортний засіб (тільки для адмінів)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Транспорт видалено
 */
router.delete("/vehicles/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await sql.query`DELETE FROM Vehicles WHERE id = ${id}`;
        res.status(200).json({ message: "Транспорт видалено" });
    } catch (error) {
        console.error("Помилка видалення транспорту:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});



module.exports = router;
