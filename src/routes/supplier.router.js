import { Router } from "express";
import { createSupplier } from "../controllers/supplier.controller";

const router = Router();

router.route("/create").post(createSupplier);


export default router;
