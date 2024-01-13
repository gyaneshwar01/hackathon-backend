import express from "express";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import stocksRouter from "./routes/stocks.route";
import cors from "cors";
import requireAuth from "./middleware/auth.middleware";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/auth", authRouter);

app.use("/users", userRouter);

app.use("/stocks", requireAuth, stocksRouter);

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`)
);
