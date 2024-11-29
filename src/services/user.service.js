import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { generateTokens } from "../utils/generateTokens.js";
import jwt from "jsonwebtoken";
import EmailSend from "../utils/EmailHelper.js";

const registerUserService = async (req) => {
  try {
    const { firstName, lastName, email, password } = req.body;

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
    });

    // Generate OTP and set expiration (using the method from the model)
    const otp = user.generateOtp(); // This will generate OTP and set otpExpires

    // Update the user with OTP and expiration using updateOne
    await User.updateOne(
      { _id: user._id }, // Filter by user ID
      { otp, otpExpires: user.otpExpires } // Update OTP and otpExpires fields
    );

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
    // Centralize error handling for debugging and user feedback
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

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isValidPassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const tokens = await generateTokens(user._id);
  const { accessToken, refreshToken } = tokens;

  return { user, accessToken, refreshToken };
};

const updateUserService = async (req) => {
  const { firstName, lastName, email, password } = req.body;

  // Validate required fields
  if (
    [firstName, lastName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check for existing user by email
  const existedUser = await User.findOne({ email: email.toLowerCase() });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // Get file paths
  // const avatarLocalPath = req.files?.avatar?.[0]?.path;

  // Upload avatar
  // let avatar;
  // if (avatarLocalPath) {
  //   avatar = await uploadOnCloudinary(avatarLocalPath);
  //   if (!avatar) {
  //     throw new ApiError(400, "Avatar upload failed");
  //   }
  // } else {
  //   throw new ApiError(400, "Avatar file is required");
  // }

  // Create the user
  const user = await User.create({
    firstName,
    lastName,
    // avatar: avatar.url,
    email: email.toLowerCase(),
    password,
  });

  // Fetch the created user without sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong when registering the user");
  }

  return createdUser;
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
  registerUserService,
  loginUserService,
  refreshAccessTokenService,
  updateUserService,
};
