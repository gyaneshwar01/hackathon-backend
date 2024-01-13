import { Request, Response } from "express";
import { readStockDataFromCSV } from "../utils/csv_reader";
import prisma from "../db";

const getStockInfo = async (req: Request, res: Response) => {
  const { symbol } = req.params;
  if (!symbol) {
    return res.status(400).json({
      message: "Please provide a stock symbol",
    });
  }
  const stockData = await readStockDataFromCSV(`./src/assets/${symbol}.csv`);
  return res.status(200).json({ stockData });
};

const buyStocks = async (req: Request, res: Response) => {
  try {
    const { symbol, quantity, userId } = req.body;

    const stockInfo = await readStockDataFromCSV(`./src/assets/${symbol}.csv`);

    if (!stockInfo) {
      return res
        .status(404)
        .json({ error: "Stock symbol not found in CSV data" });
    }

    const stockPrice = parseFloat(stockInfo[0]["Close"]);

    const totalCost = stockPrice * quantity;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user.cash >= totalCost) {
      await prisma.user.update({
        where: { id: user.id },
        data: { cash: user.cash - totalCost },
      });

      await prisma.transaction.create({
        data: {
          symbol: symbol,
          type: "buy",
          price: stockPrice,
          quantity: quantity,
          user_id: user.id,
        },
      });

      const transactions = await prisma.transaction.findMany({
        where: {
          user_id: user.id,
          symbol,
        },
      });

      const totalStocksBought = transactions.reduce(
        (acc, curr) => acc + curr.quantity,
        0
      );

      // Update user_stocks table (or create a new record if the user doesn't own any of the stock)
      await prisma.userStock.upsert({
        where: { symbol },
        update: { quantity: totalStocksBought },
        create: {
          symbol,
          quantity: quantity,
          user: { connect: { id: userId } },
        },
      });

      return res
        .status(200)
        .json({ success: true, message: "Stock bought successfully" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient funds" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

const sellStocks = async (req: Request, res: Response) => {};
export default { getStockInfo, buyStocks, sellStocks };
