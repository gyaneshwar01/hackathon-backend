import { Request, Response } from "express";
import prisma from "../db";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

const signupUser = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      message: "Please provide all required fields",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, "auth-secret", {
      expiresIn: "3d",
    });

    return res.status(201).json({ message: "User created", token });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(400).json({ message: "User already exists" });
      }
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide all required fields",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ userId: user.id }, "auth-secret", {
      expiresIn: "3d",
    });

    return res.status(200).json({ message: "User logged in", token });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(400).json({ message: "User does not exist" });
      }
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export default { signupUser, loginUser };
