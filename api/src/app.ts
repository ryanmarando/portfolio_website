import express from "express";
import cors from "cors";
import logging from "./middleware/logging.js";
import userRouter from "./routes/user.js";
import alertsRouter from "./routes/alerts.js";
import wbgtRouter from "./routes/wbgt.js";

const app = express();
const port = 3001;

const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(logging.logRequest);

app.get("/", (req, res) => {
  res.send("Welcome To Ryan Marando's Portfolio");
});

app.use("/user", userRouter);
app.use("/alerts", alertsRouter);
app.use("/wbgt", wbgtRouter);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://localhost:${port}`);
});
