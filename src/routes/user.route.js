import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUser,
  emailVerification,
} from "../controllers/user.controller.js";

const router = Router();

// User registration rout
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/otp-verification").post(emailVerification)
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// secure route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/profile").post(verifyJWT, getUser);

export default router;
