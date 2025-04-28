import express from "express";
import userRouter from "./routes/user.js";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome To Ryan Marando's Portfolio");
});

app.use("/user", userRouter);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://localhost:${port}`);
});
