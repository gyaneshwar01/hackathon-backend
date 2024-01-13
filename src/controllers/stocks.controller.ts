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

    if (!symbol) {
      return res.status(400).json({ message: "Please provide a stock symbol" });
    }

    if (quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

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
        data: {
          cash: {
            decrement: totalCost,
          },
        },
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

      const totalStocksBought = transactions.reduce((acc, curr) => {
        if (curr.type === "sell") return acc - curr.quantity;
        return acc + curr.quantity;
      }, 0);

      // Update user_stocks table (or create a new record if the user doesn't own any of the stock)
      const userStocks = await prisma.userStock.findMany({
        where: {
          symbol,
          user_id: user.id,
        },
      });

      if (userStocks.length === 0) {
        await prisma.userStock.create({
          data: {
            symbol,
            quantity: totalStocksBought,
            user_id: user.id,
          },
        });
      } else {
        await prisma.userStock.update({
          where: {
            id: userStocks[0].id,
          },
          data: {
            quantity: totalStocksBought,
          },
        });
      }

      return res
        .status(200)
        .json({ success: true, message: "Stock bought successfully" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient funds" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

const sellStocks = async (req: Request, res: Response) => {
  try {
    const { symbol, quantity: sellingQuantity, userId } = req.body;

    if (!symbol) {
      return res.status(400).json({ message: "Please provide a stock symbol" });
    }

    if (sellingQuantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    const stocksData = await readStockDataFromCSV(`./src/assets/${symbol}.csv`);

    if (!stocksData) {
      return res
        .status(404)
        .json({ error: "Stock symbol not found in CSV data" });
    }

    const stockPrice = parseFloat(stocksData[0]["Close"]);

    const userStocks = await prisma.userStock.findMany({
      where: {
        user_id: userId,
        symbol,
      },
    });

    if (userStocks.length === 0) {
      return res
        .status(400)
        .json({ message: "You don't own any of this stock" });
    }

    const userStock = userStocks[0];

    const boughtQuantity = userStock.quantity;

    if (boughtQuantity < sellingQuantity) {
      return res
        .status(400)
        .json({ message: "You don't own enough of this stock" });
    }

    const totalCost = stockPrice * sellingQuantity;

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        cash: {
          increment: totalCost,
        },
      },
    });

    await prisma.transaction.create({
      data: {
        symbol,
        type: "sell",
        price: stockPrice,
        quantity: sellingQuantity,
        user_id: userId,
      },
    });

    const updatedUserStocks = await prisma.userStock.update({
      where: {
        id: userStock.id,
      },
      data: {
        quantity: {
          decrement: sellingQuantity,
        },
      },
    });

    if (updatedUserStocks.quantity === 0) {
      await prisma.userStock.delete({
        where: {
          id: userStock.id,
        },
      });
    }

    return res.status(200).json({ success: true, message: "Stock sold" });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
};
export default { getStockInfo, buyStocks, sellStocks };
