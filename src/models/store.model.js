import mongoose, { Schema } from "mongoose";

const { ObjectId } = Schema.Types; // Destructuring ObjectId from Schema.Types

// Store schema model
const storeSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide a store name"],
      unique: true,
      lowercase: true,
    },
    description: String,
    status: {
      type: String,
      enum: {
        values: ["Open", "Closed"],
        message: "Status must be either 'Open' or 'Closed'", // Added custom error message
      },
      default: "Open",
    },
    manager: {
      name: String,
      contactNumber: String,
      id: {
        type: ObjectId,
        ref: "User", // Reference to the User model
        required: true,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Store = mongoose.model("Store", storeSchema);
