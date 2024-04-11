import userModel from "../models/User.models.js";
import auth from "../common/auth.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Fetches a user by their ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the user is fetched successfully or rejects with an error.
 */
const getUserById = async (req, res) => {
  try {
    let user = await userModel.findOne({ _id: req.params.id });
    res.status(200).send({
      message: "User Fetched Successfully",
      user,
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const signupController = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    console.log(firstName,lastName,email,password);

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await auth.hashPassword(password);
    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const signinController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await auth.hashCompare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Assuming expiresIn is set in seconds, you can adjust it accordingly
    const token = await auth.createToken({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    }, '15d'); // Example: Token expires in 15 days
    let userData = await userModel.findOne(
      { email: req.body.email },
      {  password: 0, status: 0, createdAt: 0, email: 0 }
    );

    res.status(200).json({ message: "Signin successful", token, userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    let user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const generateOTP = () => {
      const characters = "0123456789";
      return Array.from(
        { length: 6 },
        () => characters[Math.floor(Math.random() * characters.length)]
      ).join("");
    };

    const OTP = generateOTP();
    user.resetPasswordOtp = OTP;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_MAILER,
        pass: process.env.PASS_MAILER
        
      },
    });
    

    const mailOptions = {
      from: "eyegamers1234@gmail.com",
      to: user.email,
      subject: "Password Reset",
      html: `
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>We received a request to reset your password. Here is your One-Time Password (OTP): <strong>${OTP}</strong></p>
        <p>Please click the following link to reset your password:</p>
        <a href="http://localhost:5173/reset-password">Reset Password</a>
        <p>If you did not make this request, please ignore this email.</p>
        <p>Thank you</p>
        <p>From Validation</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { OTP, password } = req.body;

    const user = await userModel.findOne({
      resetPasswordOtp: OTP,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      const message = user ? "OTP has expired" : "Invalid OTP";
      return res.status(404).json({ message });
    }

    const hashedPassword = await auth.hashPassword(password);
    user.password = hashedPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const suggestColor = async (req, res) => {
  try {
    const userId = req.params.id;
    // Assuming userModel is imported and correctly defined
    let user = await userModel.findOne({ _id: userId });

    if (user) {
      // Define parseArrayString and getRandomDressColor functions outside to improve readability
      const parseArrayString = (arrayString) => {
        try {
          if (typeof arrayString === "string") {
            return JSON.parse(arrayString.replace(/'/g, '"'));
          } else if (Array.isArray(arrayString)) {
            return arrayString;
          } else {
            console.error(`Invalid arrayString format: ${arrayString}`);
            return [];
          }
        } catch (error) {
          console.error(`Error parsing array string: ${arrayString}`);
          console.error(error);
          return [];
        }
      };

      const getRandomDressColor = () => {
        const dressColors = parseArrayString(user.dresscolor);
        const randomIndex = Math.floor(Math.random() * dressColors.length);
        return dressColors[randomIndex];
      };

      const addValueField = async () => {
        let selectedColor;
        let recentColorsArray = parseArrayString(user.recentColors);
        const dressColors = parseArrayString(user.dresscolor);

        const availableDressColors = dressColors.filter(
          (color) => !recentColorsArray.includes(color)
        );

        const lastThreeColors = recentColorsArray.slice(-3);

        // Simplify the logic for selecting a color
        if (recentColorsArray.length >= 3 && availableDressColors.length > 0) {
          // If recentColorsArray has three or more colors and available colors, select randomly from available
          const randomIndex = Math.floor(Math.random() * availableDressColors.length);
          selectedColor = availableDressColors[randomIndex];
        } else {
          // If recentColorsArray has less than three colors or no available colors, select randomly from dressColors
          selectedColor = getRandomDressColor();
        }

        user.value = selectedColor;

        recentColorsArray.push(selectedColor);

        if (recentColorsArray.length > 7) {
          recentColorsArray.shift();
        }

        user.recentColors = recentColorsArray;

        await user.save();

        return selectedColor;
      };

      const selectedColor = await addValueField();
      res.status(200).send({
        message: "Color value saved successfully",
        selectedColor,
        user,
      });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const suggestWatchColor = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userModel.findOne({ _id: userId });

    if (user) {
      const parseArrayString = (arrayString) => {
        try {
          if (typeof arrayString === "string") {
            return JSON.parse(arrayString.replace(/'/g, '"'));
          } else if (Array.isArray(arrayString)) {
            return arrayString;
          } else {
            console.error(`Invalid arrayString format: ${arrayString}`);
            return [];
          }
        } catch (error) {
          console.error(`Error parsing array string: ${arrayString}`);
          console.error(error);
          return [];
        }
      };

      const getRandomWatchColor = () => {
        const watchColors = parseArrayString(user.watchColor);
        const randomIndex = Math.floor(Math.random() * watchColors.length);
        return watchColors[randomIndex];
      };

      const addValueField = async () => {
        let selectedWatchColor;
        let recentWatchColorsArray = parseArrayString(user.recentWatchColors);
        const watchColors = parseArrayString(user.watchcolor);

        const availableWatchColors = watchColors.filter(
          (color) => !recentWatchColorsArray.includes(color)
        );

        if (availableWatchColors.length > 0) {
          selectedWatchColor = availableWatchColors[Math.floor(Math.random() * availableWatchColors.length)];
        } else {
          selectedWatchColor = getRandomWatchColor();
        }

        // Update recent watch colors
        recentWatchColorsArray.unshift(selectedWatchColor);
        if (recentWatchColorsArray.length > 7) {
          recentWatchColorsArray.pop();
        }

        user.recentWatchColors = recentWatchColorsArray; // Update the user document with recent watch colors

        await user.save(); // Save the updated user document

        return selectedWatchColor;
      };


      const selectedWatchColor = await addValueField();
      res.status(200).send({
        message: "Watch color value saved successfully",
        selectedWatchColor,
        user,
      });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const addUserdetailsById = async (req, res) => {
  try {
    let user = await userModel.findOne({ _id: req.params.id });
    if (user) {
      await userModel.updateOne(
        { _id: req.params.id },
        {
          $set: req.body,
        }
      );
      res.status(200).send({
        message: "User Details added",
      });
    } else {
      res.status(400).send({ message: "Invalid User" });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export default {
  signupController,
  signinController,
  getUserById,
  resetPassword,
  forgotPassword,  
  addUserdetailsById,
  suggestColor,
  suggestWatchColor
};