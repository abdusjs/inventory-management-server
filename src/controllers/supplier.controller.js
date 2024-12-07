import { Supplier } from "../models/supplier.model";
import {
  createSupplierService,
  getSuppliersService,
} from "../services/supplier.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createSupplier = asyncHandler(async (req, res) => {
  const createdSupplier = await createSupplierService(req);

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdSupplier, "Supplier created successfully")
    );
});

const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await getSuppliersService();

  return res
    .status(200)
    .json(new ApiResponse(200, suppliers, "Suppliers fetched successfully"));
});

export { createSupplier, getSuppliers };
