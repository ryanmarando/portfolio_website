import express from "express";
import cors from "cors";
import logging from "./middleware/logging.js";
import youtubeURLsRouter from "./routes/youtubeurls.js";
import alertsRouter from "./routes/alerts.js";
import wbgtRouter from "./routes/wbgt.js";
import modelTrender from "./routes/modelTrender.js";

const app = express();
const port = 10000;

const corsOptions = {
    origin: [
        "http://localhost:3000",
        "https://nws-api-active-alerts-test.vercel.app",
    ],
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

app.use("/youtubeURLs", youtubeURLsRouter);
app.use("/alerts", alertsRouter);
app.use("/wbgt", wbgtRouter);
app.use("/modelTrender", modelTrender);

app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on :${port}`);
});
