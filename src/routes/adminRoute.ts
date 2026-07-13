import express from "express";
import { addMovie, adminDashboard, adminLogin, allBookings, cancelShow, changeShowTime, createShow, createTheatre, getAllMovie, searchMovie, showList, theatreList } from "../controller/adminController";
import { checkLogin } from "../middleware/checkLogin";
import { authorize } from "../authorization/authorize";
import { logout } from "../controller/getMe";
const adminRoute=express.Router();

adminRoute.use("/login",adminLogin);
adminRoute.post("/create-theatre",checkLogin,authorize("admin"),createTheatre);
adminRoute.get("/search-movie",checkLogin,authorize("admin"),searchMovie);
adminRoute.get("/theatre-list",checkLogin,authorize("admin"),theatreList);
adminRoute.post("/add-movie",checkLogin,authorize("admin"),addMovie);
adminRoute.get("/get-movie",checkLogin,authorize("admin"),getAllMovie);
adminRoute.post("/create-show",checkLogin,authorize("admin"),createShow);
adminRoute.get("/show-list",checkLogin,authorize("admin"),showList);
adminRoute.post("/logout",checkLogin,logout);
adminRoute.get("/all-bookings",checkLogin,authorize("admin"),allBookings);
adminRoute.patch("/change-show-time",checkLogin,authorize("admin"),changeShowTime);
adminRoute.patch("/cancel-show",checkLogin,authorize("admin"),cancelShow);
adminRoute.get("/dashboard",checkLogin,authorize("admin"),adminDashboard);

export default adminRoute;