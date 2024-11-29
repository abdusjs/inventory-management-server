import mongoose, { Schema } from "mongoose";
import validator from "validator";

const { ObjectId } = Schema.Types; // Destructuring ObjectId from Schema.Types

// Stock model schema
const stockSchema = new Schema(
  {
    productId: {
      type: ObjectId,
      required: true,
      ref: "Product", // Make sure the reference is capitalized
    },
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide a stock name"],
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrls: {
      type: [String], // Changed from String to Array of Strings
      required: true,
      validate: {
        validator: (value) => {
          return value.every((url) => validator.isURL(url)); // Ensure all URLs are valid
        },
        message: "Please provide valid image URLs",
      },
    },
    unit: {
      type: String,
      required: true,
      enum: {
        values: ["kg", "litre", "pcs", "bag"],
        message: "Unit value can't be {VALUE}. Must be kg/litre/pcs/bag.",
      },
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price can't be 0"],
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Product quantity can't be 0"],
    },
    category: [
      {
        name: {
          type: String,
          required: true,
        },
        _id: ObjectId, // Use destructured ObjectId
      },
    ],
    brand: {
      name: {
        type: String,
        required: true,
      },
      id: {
        type: ObjectId, // Use destructured ObjectId
        ref: "Brand",
        required: true,
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["in-stock", "out-of-stock", "discontinued"],
        message: "Status can't be {VALUE}.",
      },
    },
    store: {
      name: {
        type: String,
        trim: true,
        required: [true, "Please provide a store name"],
        unique: true,
        lowercase: true,
      },
      id: {
        type: ObjectId,
        required: true,
        ref: "Store",
      },
    },
    suppliedBy: {
      name: {
        type: String,
        trim: true,
        required: [true, "Please provide a supplier name"],
        unique: true,
        lowercase: true,
      },
      id: {
        type: ObjectId,
        ref: "Supplier",
        required: true, // Assuming the supplier ID is always required
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Stock = mongoose.model("Stock", stockSchema);
