import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils/generateToken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { Show } from "../entity/Show";
import { Movie } from "../entity/Movie";
import { In, LessThan, MoreThanOrEqual } from "typeorm";
import { getDistance } from "../utils/getDistance";
import { Theatre } from "../entity/Theatre";
import { Booking } from "../entity/Booking";
import { Seat } from "../entity/Seat";
interface payloadData{
id:string
name:string
email:string
role:string
}
interface RequestWithUser extends Request{
    user?:payloadData
}
const stringRegex = /^[A-Za-z ]+$/;
const passRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userRepo=AppDataSource.getRepository(User);
const showRepo=AppDataSource.getRepository(Show);
const movieRepo=AppDataSource.getRepository(Movie);
const theatreRepo=AppDataSource.getRepository(Theatre);
const bookingRepo=AppDataSource.getRepository(Booking);
const seatRepo=AppDataSource.getRepository(Seat);

export const registerUser = async (req: Request, res: Response) => {
    try {
        const bodyData = req.body;
        let { email,name } = bodyData;
        const { password}=bodyData;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "every field is required for register",
            });
        }
        if (!passRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: "password contains at least one digit a uppercase letter a lowercase letter and special character and min length 8",
            });
        }
        name = name?.trim();

        if (!stringRegex.test(name)) {
            return res.status(400).json({
                success: false,
                message: "only letter are allowed in names",
            });
        }
        email = email?.trim().toLowerCase();
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "email is not valid enter valid email",
            });
        }
        bodyData.email = email;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "name is required it cannot be empty",
            });
        }
        const strPassword = password.toString();
        const hashed = await bcrypt.hash(strPassword, 10);
        bodyData.password = hashed;
        const check = await userRepo.findOne({
            where: {
                email,
            },
        });
        if (check) {
            return res.status(409).json({
                success: false,
                message: "user already exists",
            });
        }
        await userRepo.save(bodyData);

        return res.status(200).json({
            success: true,
            message: "user registered successfully",
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: error.message || "internal server error",
            });
        }
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        let { email,password } = req.body;
        // const {password}=req.body;
        if (!email || !password) {
            return res.status(401).json({
                success: false,
                message: "email and password is required for login",
            });
        }
        email = email.trim().toLowerCase();
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "email is not valid enter valid email",
            });
        }
        password = password.trim();
        const userExist = await userRepo.findOne({
            where: {
                email,
            },
        });
        if (!userExist) {
            return res.status(404).json({
                success: false,
                message: "user not register sign up first",
            });
        }
        const verifyPass = await bcrypt.compare(password, userExist.password);
        if (!verifyPass) {
            return res.status(401).json({
                success: false,
                message: "wrong password entered",
            });
        }
        const payload = {
            name: userExist.name,
            email: userExist.email,
            id: userExist.id,
            role:userExist.role,
        };
        const accessToken = generateAccessToken(payload);
        const isProduction = process.env.NODE_ENV === "production";

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
        });
        return res.status(200).json({
            success: true,
            message: "login successfully",
            data: {
                id: userExist.id,
                email: userExist.email,
                name: userExist.name,
                role:userExist.role,
            },
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: error.message || "internal server error",
            });
        }
    }
};

export const movieList=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No Logged in user found"
            });
        }
        const userData=await userRepo.findOne({
            where:{
                id:req.user.id,
                role:"user"
            }
        });
        if(!userData){
            return res.status(401).json({
                success:false,
                message:"you are not admin"
            });
        }
        const shows=await showRepo.find({
            relations: {
                movie: true
            }
        });
        const movies = shows.map(show => show.movie);
        const uniqueMovies = movies.filter((movie, index, self) =>
            index === self.findIndex((m) => m.id === movie.id)
        );
        return res.status(200).json({
            success: true,
            message: "login successfully",
            data: uniqueMovies
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

export const getMovieDetail = async (req: RequestWithUser, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "No login user found" 
            });
        }
        const { movieId } = req.params;
 
        const movie = await movieRepo.findOne({ 
            where: { 
                id: movieId as string 
            } 
        });
        if (!movie) {
            return res.status(404).json({ 
                success: false, 
                message: "Movie not found" 
            });
        }
 
        return res.status(200).json({
            success: true,
            message: "Movie detail fetched",
            data: movie,
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
};

export const getNearbyTheatre=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No login user found"
            });
        }
        const {movieId}=req.params;
        const{lat,long}=req.query;
        if(!movieId){
            return res.status(400).json({
                success:false,
                message:"Please provide movied id"
            });
        }
        const movie=await movieRepo.findOne({
            where:{
                id:movieId as string
            }
        });
        if(!movie){
            return res.status(400).json({
                success:false,
                message:"No movie found with provided id"
            });
        }

        const shows=await showRepo.find({
            where:{
                movie:{
                    id:movieId as string
                },
                showDate:MoreThanOrEqual(new Date().toISOString().split("T")[0] as string),
            },
            relations:{
                theatre:true
            },
        });
        if(shows.length==0){
            return res.status(404).json({
                success:false,
                message:"No show found for this movie"
            });
        }
        let theatres=shows.map((ele)=>ele.theatre);
        theatres=theatres.filter((ele,index)=>(
            index===theatres.findIndex((t)=>t.id===ele.id)
        ));
        if(lat && long){
            const userLat=Number(lat);
            const userLong=Number(long);
            theatres=theatres.map((ele)=>({
                ...ele,
                distance:getDistance(userLat,userLong,ele.latitude,Number(ele.longitude))
            })).sort((a,b)=>a.distance-b.distance);
        }

        return res.status(200).json({
            success:true,
            message:"Theatres fetched success",
            data:theatres,
            movie:movie
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

export const getShowByTheatre=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No login user found"
            });
        }
        const {movieId,theatreId}=req.params;
        if(!movieId){
            return res.status(400).json({
                success:false,
                message:"Please provide movie id"
            });
        }
        if(!theatreId){
            return res.status(400).json({
                success:false,
                message:"Please provide theatreId id"
            });
        }

        const movie=await movieRepo.findOne({
            where:{
                id:movieId as string
            }
        });
        if(!movie){
            return res.status(400).json({
                success:false,
                message:"No movie found with provided id"
            });
        }
        const theatre=await theatreRepo.findOne({
            where:{
                id:theatreId as string
            }
        });
        if(!theatre){
            return res.status(400).json({
                success:false,
                message:"No movie found with provided id"
            });
        }
        const shows=await showRepo.find({
            where:{
                movie:{
                    id:movieId as string
                },
                theatre:{
                    id:theatreId as string
                },
                showDate:MoreThanOrEqual(new Date().toISOString().split("T")[0] as string)
            },
            order:{
                showDate:"ASC",
                showStartTime:"ASC",
            }
        });
        if(shows.length==0){
            return res.status(404).json({
                success:false,
                message:"No show found for this movie in this theatre"
            });
        }
        return res.status(200).json({
            success:true,
            message:"show found at this theatre for this movie",
            movie:movie,
            theatre:theatre.name,
            data:shows
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

export const seatDetails=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No login user found"
            });
        }
        const {showId}=req.params;
        const userId=req.user.id;
        const show=await showRepo.findOne({
            where:{
                id:showId as string
            },
            relations:{
                theatre:true,
                movie:true
            }
        });
        if(!show){
            return res.status(404).json({
                success:false,
                message:"No show found with provided id"
            });
        }
        await bookingRepo.delete({
            show:{
                id:showId as string
            },
            status:"held",
            heldUntil:LessThan(new Date())
        });
        const allSeats=await seatRepo.find({
            where:{
                theatre:{
                    id:show.theatre.id,
                }
            }
        });
        
        const activeBookings = await bookingRepo.find({
            where: { show: { id: showId as string },
                status: In(["held", "booked"]) },
            relations: {
                seat:true,
                user:true
            },
        });

        const seats = allSeats.map((seat) => {
            const booking = activeBookings.find((b) => b.seat.id === seat.id);

            return {
                id: seat.id,
                seatNumber: seat.seatNumber,
                row: seat.row,
                seatType: seat.seatType,
                price: seat.seatType === "Premium" ? show.prem_Price : show.reg_Price,
                status: booking ? booking.status : "available",
                heldByMe: booking?.status === "held" && booking.user.id === userId,
            };
        });
        return res.status(200).json({
            success:true,
            message:"seat fetched",
            data:seats,
            movie:show.movie,
            theatre:show.theatre.name    
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

export const toggleSeat=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No login user found"
            });
        }
        const {showId}=req.params;
        const{seatId}=req.body;
        const userId=req.user.id;
        if(!seatId){
            return res.status(401).json({
                success:false,
                message:"No seat id found"
            });
        }
        if(!showId){
            return res.status(401).json({
                success:false,
                message:"No seat id found"
            });
        }
        const show=await showRepo.findOne({
            where:{
                id:showId as string
            },
            relations:{
                theatre:true
            }
        });
        if(!show){
            return res.status(404).json({
                success:false,
                message:"No show found with provided id"
            });
        }

        const seat=await seatRepo.findOne({
            where:{
                id:seatId,
                theatre:{
                    id:show.theatre.id
                }
            }
        });
        if(!seat){
            return res.status(400).json({
                success:false,
                message:"no seat found with given id"
            });
        }
        const existing=await bookingRepo.findOne({
            where:{
                show:{
                    id:showId as string
                },
                seat:{
                    id:seatId
                },
            },
            relations:{
                user:true
            }
        });
        if(!existing){
            const heldCount=await bookingRepo.count({
                where:{
                    show:{
                        id:showId as string
                    },
                    user:{
                        id:userId
                    },
                    status:"held"
                }
            });
            if(heldCount>5){
                return res.status(400).json({
                    success:false,
                    message:"only 5 seat can held at a time"
                });
            }            
            const heldUntil=new Date(Date.now()+5*60*1000);
            const booking=bookingRepo.create({
                show:{
                    id:showId as string
                },
                seat:{
                    id:seatId
                },user:{
                    id:userId
                },
                status:"held",
                heldUntil:heldUntil
            });
            const booked=await bookingRepo.save(booking);
            return res.status(201).json({
                success:true,
                message:"seat held",
                data:booked
            });
        }
        if(existing.status=="booked"){
            return res.status(409).json({
                success:false,
                message:"seat already booked",
            });
        }
        if(existing.status=="held" &&existing.user.id===userId){
            await bookingRepo.delete(existing.id);
            return res.status(200).json({
                success:true,
                message:"seat unheld",
            });
        }
        if(existing.status=="held" &&existing.heldUntil<new Date()){
            existing.user={
                id:userId 
            } as never;
            existing.heldUntil=new Date(Date.now()+5*60*1000);
            const updated=await bookingRepo.save(existing);
            return res.status(200).json({
                success:true,
                message:"seat held",
                data:updated
            });
        }
        return res.status(409).json({
            success:false,
            message:"seat is held by another user"
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

export const ticketBoking=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No login user found"
            });
        }
        const {showId,seatId}=req.body;
        // const{seatId}=req.body;
        const userId=req.user.id;
        if(!showId){
            return res.status(401).json({
                success:false,
                message:"No seat id found"
            });
        }
        if(!seatId){
            return res.status(401).json({
                success:false,
                message:"No seat id found"
            });
        }
        if(!Array.isArray(seatId)|| seatId.length==0){
            return res.status(401).json({
                success:false,
                message:"give at least one seat id"
            });
        }
        if(seatId.length>5){
            return res.status(401).json({
                success:false,
                message:"only 5 seat can be booked"
            });
        }
        const show=await showRepo.findOne({
            where:{
                id:showId as string
            }
        });
        if(!show){
            return res.status(404).json({
                success:false,
                message:"No show found with provided id"
            });
        }
        const bookings=await bookingRepo.find({
            where:{
                show:{
                    id:showId as string
                },
                seat:{
                    id:In(seatId)
                }
            },
            relations:{
                user:true,
                seat:true
            }
        });

        if (bookings.length !== seatId.length) {
            return res.status(400).json({
                success: false,
                message: "Some seats are not held. Please select seats again",
            });
        }

        const notOwned = bookings.some((ele) => ele.user.id !== userId);
        if (notOwned) {
            return res.status(403).json({
                success: false,
                message: "Some seats are held by another user",
            });
        }

        const notHeld = bookings.some((ele) => ele.status !== "held");
        if (notHeld) {
            return res.status(409).json({
                success: false,
                message: "Some seats are already booked",
            });
        }

        const now = new Date();
        const expired = bookings.some((ele) => ele.heldUntil && ele.heldUntil < now);
        if (expired) {
            return res.status(410).json({
                success: false,
                message: "Hold expired. Please select seats again",
            });
        }

        const bookingIds = bookings.map((ele) => ele.id);
        await bookingRepo.update(
            { id: In(bookingIds) },
            { status: "booked"}
        );

        const totalAmount = bookings.reduce((sum, b) => {
            const price = b.seat.seatType === "Premium" ? show.prem_Price : show.reg_Price;
            return sum + Number(price);
        }, 0);

        return res.status(200).json({
            success: true,
            message: "Booking confirmed successfully",
            bookingIds,
            totalAmount,
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