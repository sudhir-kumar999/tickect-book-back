import express from "express";
import { checkLogin } from "../middleware/checkLogin";
import { getMe } from "../controller/getMe";
const meRoute=express.Router();

meRoute.get("/me",checkLogin,getMe);
export default meRoute;