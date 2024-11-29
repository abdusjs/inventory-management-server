import mongoose, { Schema } from "mongoose";
import validator from "validator";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide a category name."],
      lowercase: true,
      unique: true,
      set: (value) => value.toLowerCase(), // Normalize input
    },
    description: {
      type: String,
      maxLength: 500, // Optional constraint for length
    },
    imageUrl: {
      type: String,
      validate: {
        validator: validator.isURL,
        message: "Image URL must be valid.",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Add indexes
categorySchema.index({ name: 1 });
categorySchema.index({ createdAt: -1 }); // Optional: For sorting by creation date

export const Category = mongoose.model("Category", categorySchema);
