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
  updateUser,
} from "../controllers/user.controller.js";

const router = Router();

// User registration rout
router.route("/register").post(registerUser);
router.route("/otp-verification").post(emailVerification);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// secure route
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
router.route("/user").get(verifyJWT, getUser);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
