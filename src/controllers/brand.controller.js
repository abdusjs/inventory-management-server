import { Brand } from "../models/brand.model.js";
import {
  createBrandService,
  getBrandsService,
  getBrandByIdService,
  updateBrandByIdService,
} from "../services/brand.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createBrand = asyncHandler(async (req, res) => {
  const createdBrand = await createBrandService(req);

  return res
    .status(201)
    .json(new ApiResponse(201, createdBrand, "Brand created successfully"));
});

const getBrands = asyncHandler(async (req, res) => {
  const brands = await getBrandsService();

  return res
    .status(200)
    .json(new ApiResponse(200, brands, "Brands fetched successfully"));
});

const getBrandById = asyncHandler(async () => {
  const brand = await getBrandByIdService(req);

  return res
    .status(200)
    .json(new ApiResponse(200, brand, "Brand fetched successfully"));
});

const updateBrandById = asyncHandler(async (req, res) => {
  const updatedBrand = await updateBrandByIdService(req);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBrand, "Brand updated successfully"));
});

const deleteBrandById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Brand.findByIdAndDelete({_id:id});

  return res
    .status(200)
    .json(new ApiResponse(200, "Brand deleted successfully"));
});

export {
  createBrand,
  getBrands,
  getBrandById,
  updateBrandById,
  deleteBrandById,
};
