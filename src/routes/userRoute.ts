import express from "express";
import { getNearbyTheatre, getShowByTheatre, loginUser, movieList, registerUser, seatDetails, ticketBoking, toggleSeat } from "../controller/userController";
import { checkLogin } from "../middleware/checkLogin";
import { authorize } from "../authorization/authorize";
const userRoute=express.Router();

userRoute.post("/signup",registerUser);
userRoute.post("/login",loginUser);
userRoute.get("/movie-list",checkLogin,authorize("user"),movieList);
userRoute.get("/movies/:movieId",checkLogin,authorize("user"),getNearbyTheatre);
userRoute.get("/movies/:movieId/detail",checkLogin,authorize("user"),getNearbyTheatre);
userRoute.get("/movies/:movieId/theatres/:theatreId/shows",checkLogin,authorize("user"),getShowByTheatre);
userRoute.get("/shows/:showId/seats",checkLogin,authorize("user"),seatDetails);
userRoute.post("/shows/:showId/toggle-seat",checkLogin,authorize("user"),toggleSeat);
userRoute.post("/booking/confirm",checkLogin,authorize("user"),ticketBoking);

export default userRoute;