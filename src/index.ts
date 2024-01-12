import express from "express";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";

const app = express();

app.use(express.json());

app.use("/auth", authRouter);

app.use("/users", userRouter);

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`)
);
