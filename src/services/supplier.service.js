import { Supplier } from "../models/supplier.model";

const createSupplierService = async (req) => {
  try {
    const data = req.body;

    const supplier = await Supplier.create(data);
    return supplier;
  } catch (error) {
    console.error("Error in create supplier:", error);

    if (error instanceof ApiError) {
      throw error; // Re-throw custom API errors
    } else {
      throw new ApiError(500, "Internal server error");
    }
  }
};

const getSuppliersService = async () => {
  try {
    const suppliers = await Supplier.find({}).populate("brand");
    return suppliers;
  } catch (error) {
    console.error("Error in get suppliers:", error);

    if (error instanceof ApiError) {
      throw error; // Re-throw custom API errors
    } else {
      throw new ApiError(500, "Internal server error");
    }
  }
};

export { createSupplierService, getSuppliersService };
