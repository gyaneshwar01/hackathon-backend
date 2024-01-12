import prisma from "../db";
import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // get the bearer token from the request header
  const bearerToken = req.headers.authorization;
  // if there is no token, return an error
  if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = bearerToken.split(" ")[1].trim();

  try {
    // verify the token
    const decodedToken = jwt.verify(token, "auth-secret");

    // if the token is invalid, return an error
    if (!decodedToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { userId } = decodedToken as { userId: number };
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    delete user.password;

    // if the token is valid, proceed
    req.body.user = user;

    next();
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong", err });
  }
};

export default requireAuth;
