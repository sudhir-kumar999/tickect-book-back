import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/verifyToken";
interface payloadData{
id:string
name:string
email:string
role:string
}
interface RequestWithUser extends Request{
    user?:payloadData
}

export const checkLogin=async(req:RequestWithUser,res:Response,next:NextFunction)=>{
    try {
        const token=req.cookies.accessToken;
        if(!token){
            return res.status(401).json({
                success:false,
                message:"No token found, Login First"
            });
        }

        const decoded=verifyToken(token);
        if(!decoded){
            return res.status(401).json({
                success:false,
                message:"Invalid Token Provided"
            });
        }

        req.user=decoded as payloadData;
        next();
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: error.message || "internal server error",
            });
        }
    }
};