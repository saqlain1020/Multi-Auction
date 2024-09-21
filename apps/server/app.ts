import express from "express";
import rateLimit from "express-rate-limit"; //for brute force attack
import mongoSanitize from "express-mongo-sanitize"; //for noSql query injections
import helmet from "helmet"; //Protects from various attacks eg xss etc
import cors from "cors";
import morgan from "morgan";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // limit each IP to x-amount requests
  message: "you've exceed the number of requests",
});

const app = express();

//implementing cors
app.use(cors({ origin: true, credentials: true }));

//middlewares
app.use(limiter);

app.use(express.json());

app.use(mongoSanitize());
app.use(helmet());
app.use(morgan(":method :url :status :response-time ms - :date[web]"));

//routers
app.use("/ping", (req, res) => {
  res.status(200).json({ status: true });
});

app.use("/", (req, res) => {
  res.status(200).send("Welcome.");
});

export default app;
