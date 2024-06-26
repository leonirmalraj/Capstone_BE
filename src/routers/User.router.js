import express from "express";
import UserController from "../controllers/User.controller.js";
import validators from '../common/validators.js';
import Auth from "../common/auth.js";

const router = express.Router();

router.post("/signup", validators.validate("signup"), validators.validationMiddleware, UserController.signupController);
router.post("/signin", validators.validate("signin"), validators.validationMiddleware, UserController.signinController);
router.get("/signin/:id", Auth.validate, UserController.getUserById);
router.get("/details/:id", Auth.validate, UserController.getUserFetchById);
router.put("/details/:id", Auth.validate, UserController.userUpadatedById);
router.put("/change-password/:id", Auth.validate, UserController.userPasswordUpadatedById);
router.put("/delete-account/:id", Auth.validate, UserController.deleteUserAccount);
router.put("/signin/:id", Auth.validate, UserController.addUserdetailsById);
router.post("/forgot-password", validators.validate("forgotPassWord"), validators.validationMiddleware, UserController.forgotPassword);
router.post("/reset-password", validators.validate("resetPassWord"), validators.validationMiddleware, UserController.resetPassword);
router.put("/suggest-colors/:id", Auth.validate, UserController.suggestColors);



export default router