const jwt = require("jsonwebtoken");

// 📌 Проверка авторизации (наличие токена)
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log("❌ Токен отсутствует");
        return res.status(401).json({ error: "Требуется авторизация" });
    }

    const token = authHeader.split(" ")[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
        console.log("✅ Токен принят:", req.user);
        next();
    } catch (error) {
        console.log("❌ Ошибка валидации токена:", error.message);
        res.status(401).json({ error: "Неверный токен" });
    }
}

// 📌 Проверка, является ли пользователь обычным юзером или админом
function isUser(req, res, next) {
    if (!req.user || (req.user.role !== "user" && req.user.role !== "admin")) {
        console.log("❌ Доступ запрещен: требуется роль user или admin");
        return res.status(403).json({ error: "Доступ запрещён" });
    }
    console.log("✅ Доступ разрешен: пользователь", req.user.username);
    next();
}

// 📌 Проверка, является ли пользователь админом
function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        console.log("❌ Доступ запрещен: требуется роль admin");
        return res.status(403).json({ error: "Доступ запрещён" });
    }
    console.log("✅ Доступ разрешен: админ", req.user.username);
    next();
}

module.exports = { authMiddleware, isUser, isAdmin };
