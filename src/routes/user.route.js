import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// User registration rout
router.route("/register").post(registerUser);
router.route("/otp-verification").post(emailVerification);
router.route("/resend-otp/:email").post(resendOtp);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forget-password").post(forgetPassword);
router.route("/reset-password/:email").post(resetPassword);

// secure route
router.route("/profile").get(verifyJWT, getUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/change-email").post(verifyJWT, changeEmail);
router.route("/delete-account/:id").delete(verifyJWT, deleteUser);
router.route("/update-profile").patch(
  verifyJWT,
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateUser
);

export default router;
