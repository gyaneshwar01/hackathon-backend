import { Request, Response } from "express";

const getUser = (req: Request, res: Response) => {
  const user = req.body.user;

  return res.status(200).json({ user });
};

export default { getUser };
