import { Router } from "express";
import {
  createBrand,
  getBrandById,
  getBrands,
  updateBrandById,
} from "../controllers/brand.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/create").post(verifyJWT, createBrand);
router.route("/get").get(verifyJWT, getBrands);
router.route("/get/:id").get(verifyJWT, getBrandById);
router.route("/update/:id").patch(verifyJWT, updateBrandById);
router.route("/delete/:id").delete(verifyJWT, updateBrandById);

export default router;
