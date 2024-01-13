import stocksController from "../controllers/stocks.controller";
import express from "express";

const router = express.Router();

router.get("/buy", stocksController.buyStocks);

router.get("/:symbol", stocksController.getStockInfo);

export default router;
