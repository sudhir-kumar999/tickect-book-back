import express from "express";
import { addMovie, adminLogin, createShow, createTheatre, getAllMovie, searchMovie, showList, theatreList } from "../controller/adminController";
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

export default adminRoute;