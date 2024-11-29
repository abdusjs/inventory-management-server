import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Ensure Cloudinary configuration is valid
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error("Cloudinary configuration is missing");
    }

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Log the secure URL of the uploaded file
    // console.log(
    //   "File uploaded successfully to Cloudinary: ",
    //   response.secure_url
    // );

    // Delete the local file asynchronously
    await fs.unlink(localFilePath);

    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary: ", error);

    // Attempt to delete the local file even if there's an error
    try {
      await fs.unlink(localFilePath);
    } catch (unlinkError) {
      console.error("Error deleting local file: ", unlinkError);
    }

    return null;
  }
};

export { uploadOnCloudinary };
