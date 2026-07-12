import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { payloadData } from "./types";
dotenv.config();

export const generateAccessToken=(payload:payloadData)=>{
    const SECRET:string=process.env.JWT_SECRET!;
    const token =jwt.sign(payload,SECRET,{ expiresIn: "7d" });
    return token;
};