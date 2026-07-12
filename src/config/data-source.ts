import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { Theatre } from "../entity/Theatre";
import { Seat } from "../entity/Seat";
import { Movie } from "../entity/Movie";
import { Show } from "../entity/Show";
import { Booking } from "../entity/Booking";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL!,
    synchronize: true,
    logging: false,
    entities:[User,Theatre,Seat,Movie,Show,Booking]
});
