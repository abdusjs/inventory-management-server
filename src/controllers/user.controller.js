import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  registerUserService,
  loginUserService,
  refreshAccessTokenService,
  updateUserService,
} from "../services/user.service.js";
import { ApiError } from "../utils/ApiError.js";

const registerUser = asyncHandler(async (req, res) => {
  const createdUser = await registerUserService(req);

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const emailVerification = asyncHandler(async (req, res) => {
  try {
    const { otp } = req.body;

    // Validate required fields
    if (!otp?.trim()) {
      throw new ApiError(400, "OTP is required");
    }

    // Find user by OTP and check expiration
    const user = await User.findOne({ otp });
    if (!user || user.otpExpires < Date.now()) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    // Update user: clear OTP and set status to active
    await User.updateOne(
      { _id: user._id },
      { $set: { otp: null, otpExpires: null, status: "active" } }
    );

    // Fetch the updated user without sensitive fields
    const verifiedUser = await User.findById(user._id).select(
      "-password -otp -otpExpires -refreshToken"
    );

    if (!verifiedUser) {
      throw new ApiError(500, "Failed to fetch the verified user");
    }

    // Return success response
    return res
      .status(200)
      .json(new ApiResponse(200, verifiedUser, "OTP verification successful"));
  } catch (error) {
    console.error("Error during OTP verification:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({
      message: "An unexpected error occurred during OTP verification",
    });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUserService(req);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -otp -otpExpires"
  );

  const option = {
    httpOnly: false,
    secure: false,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { new: true }
  );

  const option = {
    httpOnly: false,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { accessToken, newRefreshToken } = await refreshAccessTokenService(req);

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", newRefreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          newRefreshToken,
        },
        "access token refreshed"
      )
    );
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const userData = await User.findById(user._id).select(
    "-password -refreshToken -otp -otpExpires"
  );

  return res.status(200).json(new ApiResponse(200, userData, "success"));
});

const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await updateUserService(req);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUser,
  emailVerification,
  updateUser,
};
