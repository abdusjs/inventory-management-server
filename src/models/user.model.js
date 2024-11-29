import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
    },
    avatar: {
      type: String,
      required: false,
      default: "https://example.com/default-avatar.png",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value
          );
        },
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      },
    },
    role: {
      type: String,
      enum: ["buyer", "store-manager", "admin"],
      default: "buyer",
    },
    contactNumber: {
      type: String,
      validate: [
        validator.isMobilePhone,
        "Please provide a valid contact number",
      ],
    },
    shippingAddress: {
      type: String,
    },
    imageURL: {
      type: String,
      validate: [validator.isURL, "Please provide a valid URL"],
    },
    status: {
      type: String,
      default: "inactive",
      enum: ["active", "inactive", "blocked"],
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    confirmationToken: {
      type: String,
    },
    confirmationTokenExpires: {
      type: Date,
    },
    passwordChangeAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Generate otp and set time 5 minutes
userSchema.methods.generateOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.otp = otp;
  this.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes
  return otp;
};

// Validate otp
userSchema.methods.verifyOtp = function (enteredOtp) {
  if (this.otp !== enteredOtp) {
    return { success: false, message: "Invalid OTP" };
  }
  if (this.otpExpires < Date.now()) {
    return { success: false, message: "OTP has expired" };
  }
  return { success: true, message: "OTP is valid" };
};

// Convert role to lower case if it is in camel case
userSchema.pre("save", function (next) {
  if (this.role) {
    this.role = this.role.toLowerCase(); // Convert to lowercase
  }
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(new Error("Error hashing password, please try again."));
  }
});

// Check password validity
userSchema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

// Verify refresh token
userSchema.methods.verifyRefreshToken = function (token) {
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    return decoded._id === this._id.toString();
  } catch (error) {
    return false;
  }
};

export const User = mongoose.model("User", userSchema);
