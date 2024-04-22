import express from "express";
import UserController from "../controllers/User.controller.js";
import validators from '../common/validators.js';
import Auth from "../common/auth.js";

const router = express.Router();

router.post("/signup", validators.validate("signup"), validators.validationMiddleware, UserController.signupController);
router.post("/signin", validators.validate("signin"), validators.validationMiddleware, UserController.signinController);
router.get("/signin/:id", Auth.validate, UserController.getUserById);
router.put("/signin/:id", Auth.validate, UserController.addUserdetailsById);
router.post("/forgot-password", validators.validate("forgotPassWord"), validators.validationMiddleware, UserController.forgotPassword);
router.post("/reset-password", validators.validate("resetPassWord"), validators.validationMiddleware, UserController.resetPassword);
router.put("/suggest-color/:id", Auth.validate, UserController.suggestShirtColor);
router.put("/suggest-watch-color/:id", Auth.validate, UserController.suggestPantColor);
router.put("/suggest-shoe-color/:id", Auth.validate, UserController.suggestShoeColor);


export default router