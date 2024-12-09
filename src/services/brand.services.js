import { Brand } from "../models/brand.model";
import { asyncHandler } from "../utils/asyncHandler";

const createBrandService = asyncHandler(async (req) => {
  const data = req.body;
  const brand = await Brand.create(data);
  return brand;
});

const getBrandsService = asyncHandler(async () => {
  const brands = await Brand.find({}).populate("products");
  return brands;
});

const getBrandByIdService = asyncHandler(async (req) => {
  const id = req.params;
  const brands = await Brand.find({ _id: id });
  return brands;
});

const updateBrandByIdService = asyncHandler(async (req) => {
  const { id } = req.params;
  const data = req.body;
  const updatedBrand = await Brand.findByIdAndUpdate({ _id: id }, data);

  return updatedBrand;
});

export {
  getBrandsService,
  getBrandByIdService,
  createBrandService,
  updateBrandByIdService,
};
