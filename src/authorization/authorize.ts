import { NextFunction, Request, Response } from "express";
interface payloadData{
id:string
name:string
email:string
role:string
}
interface RequestWithUser extends Request{
    user?:payloadData
}
export const authorize = (...roles: string[]) => {
    return (req: RequestWithUser, res: Response, next: NextFunction) => {
        const user=req.user;
        // console.log(user)
        if(!user){
            return res.status(401).json({
                success:false,
                message:"no user found"
            });
        }
        if (!roles.includes(user.role)) {
            res.status(403).json({
                success: false,
                message: "You are not allowed to access this restricted content.",
            });
            return;
        }
        next();
    };
};
