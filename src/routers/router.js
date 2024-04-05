import express from "express";
import UserRoutes from "./User.router.js";
const router = express.Router();

router.use("/user", UserRoutes);

export default router;