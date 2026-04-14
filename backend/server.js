import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
	try {
		await connectDB();
		next();
	} catch (error) {
		console.error(error.message);
		return res.status(500).json({ success: false, message: "Database connection failed" });
	}
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/api/health", (req, res) => {
	res.status(200).json({ success: true, message: "TaskFlow API running" });
});

const startServer = async () => {
	await connectDB();
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
};

if (!process.env.VERCEL) {
	startServer();
}

export default app;