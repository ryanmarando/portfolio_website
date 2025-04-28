import express from "express";
import logging from "./middleware/logging.js";
import userRouter from "./routes/user.js";
import alertsRouter from "./routes/alerts.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(logging.logRequest);

app.get("/", (req, res) => {
  res.send("Welcome To Ryan Marando's Portfolio");
});

app.use("/user", userRouter);
app.use("/alerts", alertsRouter);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://localhost:${port}`);
});
