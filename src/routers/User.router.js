import express from "express";
import UserController from "../controllers/User.controller.js";
import validators from '../common/validators.js';
import Auth from "../common/auth.js";

const router = express.Router();

router.post("/signup", validators.validate("signup"), validators.validationMiddleware, UserController.signupController);
router.post("/signin", validators.validate("signin"), validators.validationMiddleware, UserController.signinController);
router.post("/forgot-password", validators.validate("forgotPassWord"), validators.validationMiddleware, UserController.forgotPassword);
router.post("/reset-password", validators.validate("resetPassWord"), validators.validationMiddleware, UserController.resetPassword);
router.put("/suggestcolor/:id", Auth.validate, UserController.suggestColor);

export default router