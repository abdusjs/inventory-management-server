import mongoose, { Schema } from "mongoose";
import validator from "validator";

const { ObjectId } = Schema.Types; // Destructuring ObjectId from Schema.Types

const supplierSchema = new Schema(
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
      validate: [validator.isEmail, "Provide a valid Email"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    brand: {
      name: {
        type: String,
        trim: true,
        required: true,
      },
      id: {
        type: ObjectId,
        required: true,
        ref: "Brand",
      },
    },
    contactNumber: {
      type: String, // Changed from array to a single string
      required: [true, "Please provide a contact number"],
      validate: {
        validator: (value) => {
          return validator.isMobilePhone(value);
        },
        message: "Please provide a valid phone number",
      },
    },
    emergencyContactNumber: {
      type: String,
      required: [true, "Please provide an emergency contact number"],
      validate: {
        validator: (value) => {
          return validator.isMobilePhone(value);
        },
        message: "Please provide a valid phone number",
      },
    },
    tradeLicenceNumber: {
      type: String, // Changed from Number to String to allow alphanumeric values
      required: [true, "Please provide your trade licence number"],
    },
    presentAddress: {
      type: String,
      required: [true, "Please provide your present address"],
    },
    permanentAddress: {
      type: String,
      required: [true, "Please provide your permanent address"], // Updated message to match permanent address
    },
    location: {
      type: String,
      required: true,
      lowercase: true,
      enum: {
        values: [
          "dhaka",
          "rajshahi",
          "chattogram",
          "sylhet",
          "khulna",
          "barishal",
          "rangpur",
          "mymensingh",
        ],
        message: "{VALUE} is not a valid division!", // Fixed message formatting
      },
    },
    imageURL: {
      type: String,
      validate: [validator.isURL, "Please provide a valid URL"],
    },
    nationalIdImageURL: {
      type: String,
      required: true,
      validate: [validator.isURL, "Please provide a valid URL"],
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    versionKey: false, // Disable __v field
  }
);

export const Supplier = mongoose.model("Supplier", supplierSchema);
