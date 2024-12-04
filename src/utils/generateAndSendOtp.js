import { User } from "../models/user.model.js";
import EmailSend from "./EmailHelper.js";

const generateAndSendOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No user exists with this email");
  }

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  const subject = "Email Verification";
  const text = `Here is your OTP: ${otp} for email verification. It expires in 5 minutes.`;
  await EmailSend(email, subject, text);

  return otp; // Useful if needed for further processing
};

export { generateAndSendOtp };
