require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const setupSwagger = require("./swagger");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const routes = require("./routes");
app.use("/api", routes);

setupSwagger(app);

app.get("/", (req, res) => {
    res.send("✅ API работает! Попробуйте /api/routes или /api-docs");
});

app.listen(PORT, async () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    await connectDB();
});
