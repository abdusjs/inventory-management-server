import { User } from "../models/user.model.js";
import {
  loginUserService,
  refreshAccessTokenService,
  registerUserService,
  updateUserService,
} from "../services/user.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import EmailSend from "../utils/EmailHelper.js";
import { generateAndSendOtp } from "../utils/generateAndSendOtp.js";

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
    httpOnly: false,
    secure: false,
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

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Validate input
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords are required");
  }

  // Fetch authenticated user
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Validate old password
  const isPasswordValid = await user.isValidPassword(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Old password did not match");
  }

  // Check if new password is different from the old password
  if (oldPassword === newPassword) {
    throw new ApiError(
      400,
      "New password must be different from the old password"
    );
  }

  // Update and hash new password
  user.password = newPassword;
  await user.save();

  // Return success response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const changeEmail = asyncHandler(async (req, res) => {
  const { newEmail, otp, step } = req.body; // Step determines old email or new email verification

  // Fetch authenticated user
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Step 1: Verify old email by sending OTP
  if (step === "verify-old-email") {
    const oldEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = oldEmailOtp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    const subject = "Verify Your Old Email";
    const text = `Your verification code for your old email is: ${oldEmailOtp}. It will expire in 5 minutes.`;
    await EmailSend(user.email, subject, text);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "OTP sent to your old email"));
  }

  // Step 2: Validate OTP for old email
  if (step === "validate-old-email-otp") {
    if (!user.otp || user.otpExpires < new Date() || user.otp !== otp) {
      throw new ApiError(400, "Invalid or expired OTP for old email");
    }

    // Clear old OTP after successful validation
    user.otp = null;
    user.otpExpires = null;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Old email verified successfully"));
  }

  // Step 3: Verify new email by sending OTP
  if (step === "verify-new-email") {
    if (!newEmail || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(newEmail)) {
      throw new ApiError(400, "Invalid new email format");
    }

    // Check if the new email is already in use
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, "Email is already in use");
    }

    const newEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = newEmailOtp;
    user.otpExpires = otpExpires;
    user.tempNewEmail = newEmail.toLowerCase(); // Temporarily store new email
    await user.save({ validateBeforeSave: false });

    const subject = "Verify Your New Email";
    const text = `Your verification code for your new email is: ${newEmailOtp}. It will expire in 5 minutes.`;
    await EmailSend(newEmail, subject, text);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "OTP sent to your new email"));
  }

  // Step 4: Validate OTP for new email and update email
  if (step === "validate-new-email-otp") {
    if (!user.otp || user.otpExpires < new Date() || user.otp !== otp) {
      throw new ApiError(400, "Invalid or expired OTP for new email");
    }

    // Update email and clear temporary fields
    user.email = user.tempNewEmail;
    user.tempNewEmail = null;
    user.otp = null;
    user.otpExpires = null;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Email updated successfully"));
  }

  // Handle invalid step
  throw new ApiError(400, "Invalid step");
});

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  await generateAndSendOtp(email);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset OTP sent successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const { newPassword, otp } = req.body;

  // Validate email format early
  if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Fetch user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No user exists with this email");
  }

  // Verify OTP
  if (!otp || otp !== user.otp || user.otpExpires < new Date()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // Update password
  user.password = newPassword; // This triggers schema-level validation and hashing
  user.otp = null; // Clear OTP after successful reset
  user.otpExpires = null;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id || !User.isIdValid(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Fetch user from the database
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Authorization check: allow only self-deletion or admin-level access
  const isAuthorized =
    req.user?._id.toString() === id || req.user?.role === "admin";
  if (!isAuthorized) {
    throw new ApiError(403, "You are not authorized to delete this user");
  }

  // Log user data before deletion for auditing
  // console.log(`Deleting user: ${user._id}, Email: ${user.email}`);

  // Perform user deletion
  await user.deleteOne();

  // Optional cleanup: remove related resources
  // await Post.deleteMany({ userId: id });
  // await Comment.deleteMany({ userId: id });

  // Send success response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully"));
});

const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  await generateAndSendOtp(email);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP sent successfully"));
});

export {
  changeEmail,
  changePassword,
  deleteUser,
  emailVerification,
  forgetPassword,
  getUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendOtp,
  resetPassword,
  updateUser,
};
