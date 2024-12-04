import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import EmailSend from "../utils/EmailHelper.js";
import { generateTokens } from "../utils/generateTokens.js";

const registerUserService = async (req) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes

    // Validate required fields
    if (
      [firstName, lastName, email, password].some(
        (field) => !field?.trim() // Ensure the field exists and isn't just whitespace
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    // Check for existing user by email (case-insensitive)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    // Create the user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password, // Ensure password is hashed before saving
      otp,
      otpExpires,
    });

    // Fetch the created user without sensitive fields
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -otp -otpExpires"
    );

    if (!createdUser) {
      throw new ApiError(500, "Failed to create user");
    }

    // Send email
    const subject = "Email Verification";
    const text = `Your email verification code is: ${otp}. It will expire in 5 minutes.`;
    await EmailSend(email, subject, text);

    return createdUser;
  } catch (error) {
    console.error("Error in registerUserService:", error);

    if (error instanceof ApiError) {
      throw error; // Re-throw custom API errors
    } else {
      throw new ApiError(500, "Internal server error");
    }
  }
};

const loginUserService = async (req) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Check if user is active
  if (user.status !== "active") {
    if (user.status === "inactive") {
      throw new ApiError(
        403,
        "Your account is inactive. Please activate your account."
      );
    }
    if (user.status === "blocked") {
      throw new ApiError(
        403,
        "Your account is blocked. Contact support for assistance."
      );
    }
  }

  // Validate password
  const isPasswordValid = await user.isValidPassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate tokens for active users
  const tokens = await generateTokens(user._id);
  const { accessToken, refreshToken } = tokens;

  return { user, accessToken, refreshToken };
};

const updateUserService = async (req) => {
  try {
    const { firstName, lastName, contactNumber, shippingAddress } = req.body;

    const avatarFile = req.files?.avatar?.[0]?.path;

    // Find user by ID
    const user = await User.findById(req?.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Update other fields if provided
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (contactNumber) user.contactNumber = contactNumber.trim();
    if (shippingAddress) user.shippingAddress = shippingAddress.trim();

    // Handle avatar upload
    if (avatarFile) {
      const avatarUpload = await uploadOnCloudinary(avatarFile);
      if (!avatarUpload) {
        throw new ApiError(500, "Avatar upload failed");
      }
      user.avatar = avatarUpload.url;
    }

    // Save the updated user
    await user.save({ validateBeforeSave: false });

    // Fetch the updated user without sensitive fields
    const updatedUser = await User.findById(user._id).select(
      "-password -refreshToken -otp -otpExpires"
    );

    return updatedUser;
  } catch (error) {
    console.error("Error in updateUserService:", error);

    if (error instanceof ApiError) {
      throw error; // Re-throw custom API errors
    } else {
      throw new ApiError(500, "Internal server error");
    }
  }
};

const refreshAccessTokenService = async (req) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user?._id
    );

    return { accessToken, newRefreshToken };
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
};

export {
  loginUserService,
  refreshAccessTokenService,
  registerUserService,
  updateUserService,
};
