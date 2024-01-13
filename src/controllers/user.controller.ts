import prisma from "../db";
import { Request, Response } from "express";

const getUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        user_stocks: true,
        transactions: true,
      },
    });

    delete user.password;

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

export default { getUser };
