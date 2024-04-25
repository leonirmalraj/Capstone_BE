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
/**
 * Fetches a user by their ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the user is fetched successfully or rejects with an error.
 */
const getUserFetchById = async (req, res) => {
  try {
    let user = await userModel.findOne(
      { _id: req.params.id }, // Query criteria
      { firstName: 1, lastName: 1, email: 1 } // Projection: Include only these fields
    );
    if (!user) {
      return res.status(404).send({
        message: "User not found",
      });
    }
    res.status(200).send({
      message: "User fetched successfully",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const userUpadatedById = async (req, res) => {
  const userId = req.params.id; // Extract user ID from request params
  const userData = req.body; // Extract updated user data from request body

  try {
    // Find user by ID and update their profile data
    const updatedUser = await userModel.findByIdAndUpdate(userId, userData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(201).json({ message: 'User profile updated successfully' });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const userPasswordUpadatedById = async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  try {
    // Fetch user from database
    const user = await userModel.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current password is correct
    const isPasswordCorrect = await auth.hashCompare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    // Hash the new password
    const hashedPassword = await auth.hashPassword(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const deleteUserAccount = async (req, res) => {
  const userId = req.params.id;

  try {
    // Find the user by userId
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Perform the deletion
    await userModel.deleteOne({ _id: userId });

    res.status(200).json({ message: "User account deleted successfully." });
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
    console.log(firstName, lastName, email, password);

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
      { password: 0, status: 0, createdAt: 0, email: 0 }
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
        <a href="https://prismatic-chimera-53966a.netlify.app/reset-password">Reset Password</a>
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

const suggestColors = async (req, res) => {
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

      const getRandomColor = (colors) => {
        const parsedColors = parseArrayString(colors);
        const randomIndex = Math.floor(Math.random() * parsedColors.length);
        return parsedColors[randomIndex];
      };

      const addValueFieldAndUpdateRecentColors = async (colorsKey, recentColorsKey) => {
        let selectedColor;
        let recentColorsArray = parseArrayString(user[recentColorsKey]);
        const availableColors = parseArrayString(user[colorsKey]).filter(
          (color) => !recentColorsArray.includes(color)
        );

        if (recentColorsArray.length >= 3 && availableColors.length > 0) {
          selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        } else {
          selectedColor = getRandomColor(user[colorsKey]);
        }

        user.value = selectedColor;

        recentColorsArray.unshift(selectedColor);
        if (recentColorsArray.length > 7) {
          recentColorsArray.pop();
        }

        user[recentColorsKey] = recentColorsArray;

        await user.save();

        return selectedColor;
      };

      const selectedShirtColor = await addValueFieldAndUpdateRecentColors('shirtColors', 'recentShirtColors');
      const selectedPantColor = await addValueFieldAndUpdateRecentColors('pantColors', 'recentPantColors');
      const selectedShoeColor = await addValueFieldAndUpdateRecentColors('shoeColors', 'recentShoeColors');

      return res.status(200).json({
        message: "Color values saved successfully",
        selectedShirtColor,
        selectedPantColor,
        selectedShoeColor,
        user,
      });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export default {
  signupController,
  signinController,
  getUserById,
  getUserFetchById,
  userUpadatedById,
  userPasswordUpadatedById,
  deleteUserAccount,
  resetPassword,
  forgotPassword,
  addUserdetailsById, 
  suggestColors

};