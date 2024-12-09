import { Router } from "express";
import { createSupplier, getSuppliers } from "../controllers/supplier.controller";

const router = Router();

router.route("/create").post(createSupplier);
router.route("/get").get(getSuppliers);


export default router;
