import mongoose, { Schema } from "mongoose";
import validator from "validator";

const { ObjectId } = Schema.Types; // Destructuring ObjectId from Schema.Types

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for this product"],
      trim: true,
      lowercase: true,
      unique: [true, "Name must be unique"],
      minLength: [3, "Name must be at least 3 characters"],
      maxLength: [20],
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price can't be negative"],
    },
    unit: {
      type: String,
      required: true,
      enum: {
        values: ["kg", "litre", "pcs", "bag"],
        message: "Unit value can't be {VALUE}. Must be kg/litre/pcs/bag.",
      },
    },
    imageUrls: {
      type: [String], // Changed from String to Array of Strings
      required: true,
      validate: {
        validator: (value) => {
          return value.every((url) => validator.isURL(url)); // Check if all URLs are valid
        },
        message: "Please provide valid image URLs",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity can't be 0"],
      validate: {
        validator: (value) => {
          return Number.isInteger(value); // Validate if quantity is an integer
        },
        message: "Quantity must be an integer",
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
    supplier: {
      type: ObjectId, // Using destructured ObjectId
      ref: "Supplier",
    },
    category: [
      {
        name: {
          type: String,
          required: true,
        },
        id: {
          type: ObjectId, // Using destructured ObjectId
          ref: "Category",
          required: true,
        },
      },
    ],
    brand: [
      {
        name: {
          type: String,
          required: true,
        },
        id: {
          type: ObjectId, // Using destructured ObjectId
          ref: "Brand",
          required: true,
        },
      },
    ], // Changed brand to an array to allow multiple brands
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Schema model
export const Product = mongoose.model("Product", productSchema);
