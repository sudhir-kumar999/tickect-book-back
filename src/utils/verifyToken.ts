import jwt from "jsonwebtoken";
export const verifyToken=(token:string)=>{
    const SECRET=process.env.JWT_SECRET!;
    return jwt.verify(token,SECRET);
};