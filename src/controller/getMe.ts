import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";

interface payloadData{
id:string
name:string
email:string
role:string
}
interface RequestWithUser extends Request{
    user?:payloadData
}
const userRepo=AppDataSource.getRepository(User);
export const getMe=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No login user found"
            });
        }

        const userData=await userRepo.findOne({
            where:{
                id:req.user.id
            }
        });

        if(!userData){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }

        return res.status(200).json({
            success:true,
            message:"Profile fetched",
            data:{
                id:userData.id,
                name:userData.name,
                email:userData.email,
                role:userData.role
            }
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: error.message || "internal server error",
            });
        }
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            sameSite: "none",
            secure: true, 
            path: "/",
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }};