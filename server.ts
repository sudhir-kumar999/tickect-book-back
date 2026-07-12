import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { AppDataSource } from "./src/config/data-source";
import adminRoute from "./src/routes/adminRoute";
import userRoute from "./src/routes/userRoute";
import meRoute from "./src/routes/meRoute";
const app = express();

dotenv.config();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.use(express.json());
app.use(cookieParser());

app.use("/admin",adminRoute);
app.use("/user",userRoute);
app.use("/get",meRoute);

const PORT = process.env.PORT;
AppDataSource.initialize()
    .then(() => {
        console.log("Database Connected");
        app.listen(PORT, () => {
            console.log(`server is running at on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("DB ERROR",err);
    });
