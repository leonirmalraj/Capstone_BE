import { validationResult, body } from "express-validator";

const validate = (route) => {
  switch (route) {
    case "signup":
      return [
        body("firstName").notEmpty().withMessage("First Name is required"),
        body("lastName").notEmpty().withMessage("Last Name is required"),
        body("email").isEmail().withMessage("Invalid email address"),
        body("password")
          .matches(/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/)
          .withMessage(
            "Password must contain at least one digit, one lowercase and one uppercase letter, and one special character (@#$%^&+=)"
          ),
      ];
    case "signin":
      return [
        body("email").isEmail().withMessage("Invalid email address"),
        body("password").notEmpty().withMessage("Password is required"),
      ];
    case "forgotPassWord":
      return [body("email").isEmail().withMessage("Invalid email address")];
    case "resetPassWord":
      return [
        body("OTP").notEmpty().withMessage("OTP is required"),
        body("password")
          .matches(/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/)
          .withMessage(
            "Password must contain at least one digit, one lowercase and one uppercase letter, and one special character (@#$%^&+=)"
          ),
      ];
    default:
      return [];
  }
};

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export default { validate, validationMiddleware };