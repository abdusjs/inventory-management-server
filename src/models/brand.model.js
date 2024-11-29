import mongoose, { Schema } from "mongoose";
import validator from "validator";

const { ObjectId } = Schema.Types; // Destructuring ObjectId from Schema.Types

const brandSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxLength: 100,
      required: [true, "Please provide a valid brand name"],
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxLength: 1000, // Optional, customize as needed
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Please provide a valid Email"],
    },
    website: {
      type: String,
      validate: [validator.isURL, "Please provide a valid URL"],
    },
    location: String,
    products: [
      {
        type: ObjectId, // Using destructured ObjectId
        ref: "Product",
      },
    ],
    suppliers: [
      {
        name: {
          type: String,
          required: [true, "Supplier name is required"],
          trim: true,
        },
        contactNumber: {
          type: String,
          validate: {
            validator: function (v) {
              return /^\+?[1-9]\d{1,14}$/.test(v); // E.164 format
            },
            message: (props) => `${props.value} is not a valid phone number!`,
          },
        },
        id: {
          type: ObjectId, // Using destructured ObjectId
          ref: "Supplier",
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for faster queries
brandSchema.index({ name: 1 });
brandSchema.index({ status: 1 });

export const Brand = mongoose.model("brand", brandSchema);
