import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import mongoose from "mongoose";
import { MONGO_STRING, PORT } from "./constants";
import { startListeners } from "./libs/eventListeners";

mongoose.connect(MONGO_STRING).then((con) => {
  console.log("connected to mongodb");
  startListeners();
});

app.listen(PORT, () => {
  console.log("server running on port", PORT);
});
