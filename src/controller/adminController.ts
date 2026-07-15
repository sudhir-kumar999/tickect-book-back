import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { generateAccessToken } from "../utils/generateToken";
import { Theatre } from "../entity/Theatre";
import { Seat } from "../entity/Seat";
import axios from "axios";
import { Movie } from "../entity/Movie";
import { Show } from "../entity/Show";
import { LessThan, MoreThan } from "typeorm";
import { Booking } from "../entity/Booking";
interface payloadData{
id:string
name:string
email:string
role:string
}
interface RequestWithUser extends Request{
    user?:payloadData
}
interface Seats{
    seatType:string
    rows:number
    columns:number
    price:number
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userRepo = AppDataSource.getRepository(User);
const theatreRepo=AppDataSource.getRepository(Theatre);
const movieRepo=AppDataSource.getRepository(Movie);
const seatRepo=AppDataSource.getRepository(Seat);
const showRepo=AppDataSource.getRepository(Show);
const bookingRepo=AppDataSource.getRepository(Booking);
const stringRegex = /^[A-Za-z ]+$/;

export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { password } = req.body;
        let { email } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Both email and password is required.",
            });
        }
        email = email.trim("").toLowerCase();
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please Provide correct Email Format.",
            });
        }
        const checkEmail = await userRepo.findOne({
            where: {
                email,
                role: "admin",
            },
        });
        if (!checkEmail) {
            return res.status(401).json({
                success: false,
                message: "You are not registered or not an admin",
            });
        }

        const verifyPassword=checkEmail.password==password;
        if(!verifyPassword){
            return res.status(401).json({
                success: false,
                message: "Wrong password. Try again.",
            });
        }

        const payload={
            id:checkEmail.id,
            name:checkEmail.name,
            email:checkEmail.email,
            role:checkEmail.role
        };
        const accessToken=generateAccessToken(payload);
        if(!accessToken){
            return res.status(500).json({
                success: false,
                message: "Token generation Failed",
                data: {
                    id: checkEmail.id,
                    name: checkEmail.name,
                    email: checkEmail.email,
                    role: checkEmail.role,
                },
            });
        }

        const isProduction = process.env.NODE_ENV === "production";

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
        });
        return res.status(200).json({
            success:true,
            message:"Login Success."
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

export const createTheatre=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No Logged in user found"
            });
        }
        const {latitude,longitude,seatMap}=req.body;
        let {name,address}=req.body;
        
        const adminData=await userRepo.findOne({
            where:{
                id:req.user.id,
                role:"admin"
            }
        });
        if(!adminData){
            return res.status(401).json({
                success:false,
                message:"you are not admin"
            });
        }

        name=name.trim("");
        address=address.trim("");
        if(!name || !address){
            return res.status(400).json({
                success:false,
                message:"Name and Address is mandatory"
            });
        }

        if(!stringRegex.test(name)){
            return res.status(400).json({
                success:false,
                message:"Name can only be string"
            });
        }

        if(!latitude || !longitude){
            return res.status(400).json({
                success:false,
                message:"Name and Address is mandatory"
            });
        }

        if(typeof latitude!=="number" || typeof longitude !=="number"){
            return res.status(400).json({
                success:false,
                message:"Latitude and Longitude must be in Number type"
            });
        }

        const theatreData={
            name,
            address,
            latitude,
            longitude
        };
        const allRowNo=seatMap.reduce((acc:number,seat:Seats)=>acc+seat.rows,0);
        const totalSeat=seatMap.reduce((acc:number,seat:Seats)=>acc+(seat.rows*seat.columns),0);
        if(allRowNo>26){
            return res.status(400).json({
                success:false,
                message:"Row can only be 26"
            });
        }
        if(totalSeat>1000){
            return res.status(400).json({
                success:false,
                message:"Seat maximum allowed up to 1000"
            });
        }
        const savedData=await theatreRepo.save(theatreData);
        seatMap.sort((a: Seats, b: Seats) => a.price - b.price);
        const seatData=[];
        let rowIndex=0;
        for(let k=0;k<seatMap.length;k++){
            const row:number=seatMap[k].rows;
            const column=seatMap[k].columns;
            for(let i=0;i<row;i++){
                const rowLetter=String.fromCharCode(65+rowIndex);
                for(let j=1;j<=column;j++){
                    seatData.push({
                        theatre:{
                            id:savedData.id,
                        },
                        row:rowLetter,
                        seatNumber:`R${rowLetter}${j}`,
                        seatType:seatMap[k].seatType,
                        price:seatMap[k].price
                    });
                }
                rowIndex++;
            }
        }
        const seats=await seatRepo.save(seatData);
        return res.status(201).json({
            success:true,
            message:"Theatre with seats created successfully",
            data:savedData,
            seats:seats
            // seats:seatData
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

export const searchMovie=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No Logged in user found"
            });
        }
        const adminData=await userRepo.findOne({
            where:{
                id:req.user.id,
                role:"admin"
            }
        });
        if(!adminData){
            return res.status(401).json({
                success:false,
                message:"you are not admin"
            });
        }
        const {query}=req.query;
        if(!query){
            return res.status(404).json({
                success:false,
                message:"No query found to search movie"
            });
        }
        const TMDB_LINK=process.env.TMDB_LINK;
        const TMDB_API_KEY=process.env.TMDB_API_KEY;
        const response=await axios.get(`${TMDB_LINK}/search/movie`,{
            params:{api_key:`${TMDB_API_KEY}`,query}
        });
        if(!response.data.results){
            return res.status(400).json({
                success:false,
                message:"no movie found with that id"
            });
        }

        return res.status(200).json({
            success:true,
            message:"movie searched from tmdb",
            data:response.data.results
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

export const addMovie=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No Logged in user found"
            });
        }
        const adminData=await userRepo.findOne({
            where:{
                id:req.user.id,
                role:"admin"
            }
        });
        if(!adminData){
            return res.status(401).json({
                success:false,
                message:"you are not admin"
            });
        }
        const {tmdbId}=req.body;
        if(!tmdbId){
            return res.status(400).json({
                success:false,
                message:"Provide tmdbId to fetch movie"
            });
        }
        const existing=await movieRepo.findOne({
            where:{
                tmdbId
            }
        });
        if(existing){
            return res.status(409).json({
                success:false,
                message:"Movie is already in Database No need to add",
                data:existing
            });
        }
        const TMDB_LINK=process.env.TMDB_LINK;
        const TMDB_API_KEY=process.env.TMDB_API_KEY;
        const response=await axios.get(`${TMDB_LINK}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
        if(!response.data){
            return res.status(400).json({
                success:false,
                message:"no movie found with that id"
            });
        }
        const data=response.data;
        const movieData={
            tmdbId:data.id,
            title:data.title,
            description:data.overview,
            duration:data.runtime,
            poster:data?.poster_path,
            releaseDate:data.release_date,
            rating:data?.vote_average
        };
        const savedMovie=await movieRepo.save(movieData);
        return res.status(200).json({
            success:true,
            message:"movie added",
            data:savedMovie
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

export const getAllMovie=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No Logged in user found"
            });
        }
        const adminData=await userRepo.findOne({
            where:{
                id:req.user.id,
                role:"admin"
            }
        });
        if(!adminData){
            return res.status(401).json({
                success:false,
                message:"you are not admin"
            });
        }
        const movies=await movieRepo.find({
            order:{
                releaseDate:"DESC"
            }
        });
        if(!movies || movies.length==0){
            return res.status(400).json({
                success:false,
                message:"No movies found inside database"
            });
        }
        return res.status(200).json({
            success:true,
            message:"All Movie fetched",
            data:movies
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

// export const createShow=async(req:RequestWithUser,res:Response)=>{
//     try {
//         if(!req.user){
//             return res.status(401).json({
//                 success:false,
//                 message:"No Logged in user found"
//             });
//         }
//         const adminData=await userRepo.findOne({
//             where:{
//                 id:req.user.id,
//                 role:"admin"
//             }
//         });
//         if(!adminData){
//             return res.status(401).json({
//                 success:false,
//                 message:"you are not admin"
//             });
//         }
//         const {movieId,theatreId,reg_Price,prem_Price,name,showDate,showStartTime,showEndTime}=req.body;
//         if (!name || typeof name !== "string" || name.trim().length < 2) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Provide a valid show name"
//             });
//         }
//         if(!theatreId){
//             return res.status(400).json({
//                 success:false,
//                 message:"Provide theatre id"
//             });
//         }
//         if (!movieId || typeof movieId !== "string") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Provide a valid movie id"
//             });
//         }
//         if (
//             reg_Price === undefined || isNaN(Number(reg_Price)) || Number(reg_Price) <= 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Provide a regular seat price"
//             });
//         }

//         if (
//             prem_Price === undefined || isNaN(Number(prem_Price)) || Number(prem_Price) <= 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Provide a premium seat price"
//             });
//         }

//         if (!showDate || typeof showDate !== "string") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Provide show date"
//             });
//         }

//         const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
//         if (!dateRegex.test(showDate)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Show date must be in YYYY-MM-DD format"
//             });
//         }

//         if (!showStartTime || typeof showStartTime !== "string") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Provide show start time"
//             });
//         }

//         if (!showEndTime || typeof showEndTime !== "string") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Provide show end time"
//             });
//         }

//         const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
//         if (!timeRegex.test(showStartTime)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Start time must be in HH:mm format"
//             });
//         }

//         if (!timeRegex.test(showEndTime)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "End time must be in HH:mm format"
//             });
//         }

//         if (showStartTime === showEndTime) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Show end time must be after show start time"
//             });
//         }
//         if (showStartTime >= showEndTime) {
//             return res.status(400).json({
//                 success: false,
//                 message: "End time must be after start time and overnight shows are not allowed"
//             });
//         }
//         if (Number(prem_Price) < Number(reg_Price)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Premium price cannot be less than regular price"
//             });
//         }
//         const today = new Date().toISOString().split("T")[0]!;
//         if (showDate < today) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Show date cannot be in the past"
//             });
//         }

//         const checkTheatre=await theatreRepo.findOne({
//             where:{
//                 id:theatreId
//             }
//         });
//         if(!checkTheatre){
//             return res.status(400).json({
//                 success:false,
//                 message:"No theatre found with provided id"
//             });
//         }

//         const seatCount=await seatRepo.count({
//             where:{
//                 theatre:{
//                     id:checkTheatre.id
//                 }
//             }
//         });

//         const checkMovie=await movieRepo.findOne({
//             where:{
//                 id:movieId
//             }
//         });

//         if(!checkMovie){
//             return res.status(400).json({
//                 success:false,
//                 message:"No movie in database. Add it first"
//             });
//         }

//         const existingShow=await showRepo.findOne({
//             where:{
//                 theatre:{
//                     id:checkTheatre.id
//                 },
//                 showDate,
//                 showStartTime: LessThan(showEndTime),
//                 showEndTime: MoreThan(showStartTime),
//             }
//         });

//         if(existingShow){
//             return res.status(409).json({
//                 success:false,
//                 message:"A show is already scheduled at ths time"
//             });
//         }

//         const showDetails={
//             theatre:checkTheatre,
//             movie:checkMovie,
//             reg_Price,
//             prem_Price,
//             showDate,
//             total_seat:seatCount,
//             showStartTime,
//             showEndTime,
//             showName:name
//         };
//         const showData=await showRepo.save(showDetails);
//         return res.status(201).json({
//             success:true,
//             message:"Show created successfully",
//             data:showData
//         });
//     } catch (error) {
//         if (error instanceof Error) {
//             res.status(500).json({
//                 success: false,
//                 message: error.message || "internal server error",
//             });
//         }
//     }
// };

export const createShow=async(req:RequestWithUser,res:Response)=>{
    try {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"No Logged in user found"
            });
        }
        const adminData=await userRepo.findOne({
            where:{
                id:req.user.id,
                role:"admin"
            }
        });
        if(!adminData){
            return res.status(401).json({
                success:false,
                message:"you are not admin"
            });
        }
        const {movieId,theatreId,name,showDate,showStartTime,showEndTime}=req.body;
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Provide a valid show name"
            });
        }
        if(!theatreId){
            return res.status(400).json({
                success:false,
                message:"Provide theatre id"
            });
        }
        if (!movieId || typeof movieId !== "string") {
            return res.status(400).json({
                success: false,
                message: "Provide a valid movie id"
            });
        }

        if (!showDate || typeof showDate !== "string") {
            return res.status(400).json({
                success: false,
                message: "Provide show date"
            });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(showDate)) {
            return res.status(400).json({
                success: false,
                message: "Show date must be in YYYY-MM-DD format"
            });
        }

        if (!showStartTime || typeof showStartTime !== "string") {
            return res.status(400).json({
                success: false,
                message: "Provide show start time"
            });
        }

        if (!showEndTime || typeof showEndTime !== "string") {
            return res.status(400).json({
                success: false,
                message: "Provide show end time"
            });
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(showStartTime)) {
            return res.status(400).json({
                success: false,
                message: "Start time must be in HH:mm format"
            });
        }

        if (!timeRegex.test(showEndTime)) {
            return res.status(400).json({
                success: false,
                message: "End time must be in HH:mm format"
            });
        }

        if (showStartTime === showEndTime) {
            return res.status(400).json({
                success: false,
                message: "Show end time must be after show start time"
            });
        }
        if (showStartTime >= showEndTime) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time and overnight shows are not allowed"
            });
        }
        
        const today = new Date().toISOString().split("T")[0]!;
        if (showDate < today) {
            return res.status(400).json({
                success: false,
                message: "Show date cannot be in the past"
            });
        }

        const checkTheatre=await theatreRepo.findOne({
            where:{
                id:theatreId
            }
        });
        if(!checkTheatre){
            return res.status(400).json({
                success:false,
                message:"No theatre found with provided id"
            });
        }

        const seatCount=await seatRepo.count({
            where:{
                theatre:{
                    id:checkTheatre.id
                }
            }
        });

        const checkMovie=await movieRepo.findOne({
            where:{
                id:movieId
            }
        });

        if(!checkMovie){
            return res.status(400).json({
                success:false,
                message:"No movie in database. Add it first"
            });
        }
        const start =
    Number(showStartTime.split(":")[0]) * 60 +
    Number(showStartTime.split(":")[1]);

        const end =Number(showEndTime.split(":")[0]) * 60 +Number(showEndTime.split(":")[1]);
        if (end < start + checkMovie.duration) {
            return res.status(400).json({
                success: false,
                message: "End time is less than movie duration",
            });
        }

        const existingShow=await showRepo.findOne({
            where:{
                theatre:{
                    id:checkTheatre.id
                },
                showDate,
                showStartTime: LessThan(showEndTime),
                showEndTime: MoreThan(showStartTime),
            }
        });

        if(existingShow){
            return res.status(409).json({
                success:false,
                message:"A show is already scheduled at ths time"
            });
        }

        const showDetails={
            theatre:checkTheatre,
            movie:checkMovie,
            showDate,
            total_seat:seatCount,
            showStartTime,
            showEndTime,
            showName:name
        };
        const showData=await showRepo.save(showDetails);
        return res.status(201).json({
            success:true,
            message:"Show created successfully",
            data:showData
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

export const theatreList=async(req:RequestWithUser,res:Response)=>{
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "No logged in user found",
            });
        }

        const admin = await userRepo.findOne({
            where: {
                id: req.user.id,
                role: "admin",
            },
        });

        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "Only admin can access theatre list",
            });
        }

        const theatres = await theatreRepo.find({
            
        });

        return res.status(200).json({
            success: true,
            message: "Theatre list fetched successfully",
            data: theatres,
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

export const showList=async(req:RequestWithUser,res:Response)=>{
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "No logged in user found",
            });
        }

        const admin = await userRepo.findOne({
            where: {
                id: req.user.id,
                role: "admin",
            },
        });

        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "Only admin can access theatre list",
            });
        }

        const shows = await showRepo.find({
            
        });

        return res.status(200).json({
            success: true,
            message: "Theatre list fetched successfully",
            data: shows,
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

export const allBookings=async(req:RequestWithUser,res:Response)=>{
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "No logged in user found",
            });
        }
        const admin = await userRepo.findOne({
            where: {
                id: req.user.id,
                role: "admin",
            },
        });

        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "Only admin can access all booking data",
            });
        }
        const bookings=await bookingRepo.find({
            where:{
                status:"booked"
            },
            relations:{
                user:true,
                seat:true,
                show:true
            }
        });
        if(bookings.length==0){
            return res.status(404).json({
                success:false,
                message:"No booking found"
            });
        }
        return res.status(200).json({
            success:true,
            message:"Booked History Fetched.",
            data:bookings
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

export const changeShowTime=async(req:RequestWithUser,res:Response)=>{
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "No logged in user found",
            });
        }
        const admin = await userRepo.findOne({
            where: {
                id: req.user.id,
                role: "admin",
            },
        });

        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "Only admin can access all booking data",
            });
        }
        const {showId,showDate,showStartTime,showEndTime}=req.body;
        if(!showId){
            return res.status(400).json({
                success: false,
                message: "Provide show id"
            });
        }
        if (!showDate || typeof showDate !== "string") {
            return res.status(400).json({
                success: false,
                message: "Provide show date"
            });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(showDate)) {
            return res.status(400).json({
                success: false,
                message: "Show date must be in YYYY-MM-DD format"
            });
        }

        if (!showStartTime || typeof showStartTime !== "string") {
            return res.status(400).json({
                success: false,
                message: "Provide show start time"
            });
        }

        if (!showEndTime || typeof showEndTime !== "string") {
            return res.status(400).json({
                success: false,
                message: "Provide show end time"
            });
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(showStartTime)) {
            return res.status(400).json({
                success: false,
                message: "Start time must be in HH:mm format"
            });
        }

        if (!timeRegex.test(showEndTime)) {
            return res.status(400).json({
                success: false,
                message: "End time must be in HH:mm format"
            });
        }

        if (showStartTime === showEndTime) {
            return res.status(400).json({
                success: false,
                message: "Show end time must be after show start time"
            });
        }
        if (showStartTime >= showEndTime) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time and overnight shows are not allowed"
            });
        }
        const today = new Date().toISOString().split("T")[0]!;
        if (showDate < today) {
            return res.status(400).json({
                success: false,
                message: "Show date cannot be in the past"
            });
        }
        const existingShow=await showRepo.findOne({
            where:{
                id:showId,
            }
        });

        if(!existingShow){
            return res.status(409).json({
                success:false,
                message:"No any show scheduled at ths time"
            });
        }

        existingShow.showDate = showDate;
        existingShow.showStartTime = showStartTime;
        existingShow.showEndTime = showEndTime;
        const showData=await showRepo.save(existingShow);
        return res.status(201).json({
            success:true,
            message:"Show created successfully",
            data:showData
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

export const cancelShow=async(req:RequestWithUser,res:Response)=>{
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "No logged in user found",
            });
        }
        const admin = await userRepo.findOne({
            where: {
                id: req.user.id,
                role: "admin",
            },
        });

        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "Only admin can access all booking data",
            });
        }
        const {showId}=req.body;
        if(!showId){
            return res.status(400).json({
                success: false,
                message: "Provide show id"
            });
        }
        const show=await showRepo.findOne({
            where:{
                id:showId,
            }
        });

        if(!show){
            return res.status(409).json({
                success:false,
                message:"No any show found with given show id"
            });
        }
        const showStartDateTime = new Date(
            `${show.showDate}T${show.showStartTime}:00`
        );

        const now = new Date();
        if (showStartDateTime <= now) {
            return res.status(400).json({
                success: false,
                message: "Running or completed shows cannot be cancelled.",
            });
        }

        const bookingCount = await bookingRepo.count({
            where: {
                show: {
                    id: showId,
                },
            },
        });

        if (bookingCount > 0) {
            return res.status(400).json({
                success: false,
                message: "This show already has bookings and cannot be cancelled.",
            });
        }
        if (show.isCancel) {
            return res.status(400).json({
                success: false,
                message: "Show is already cancelled.",
            });
        }
        show.isCancel = true;
        await showRepo.save(show);
        return res.status(200).json({
            success: true,
            message: "Show cancelled successfully.",
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

export const adminDashboard = async (req: RequestWithUser,res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "No logged in user found",
            });
        }

        const admin = await userRepo.findOne({
            where: {
                id: req.user.id,
                role: "admin",
            },
        });

        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "Only admin can see dashboard",
            });
        }

        const totalMovies = await movieRepo.count();
        const totalTheatres = await theatreRepo.count();
        const totalShows = await showRepo.count();
        const totalUsers = await userRepo.count({
            where: {
                role: "user",
            },
        });

        const bookings = await bookingRepo.find({
            where: {
                paymentStatus: "paid",
            },
            relations: {
                show: true,
                seat: true,
            },
        });
        const totalBookings = bookings.length;
        let totalCollection = 0;
        for (const booking of bookings) {
            if (booking.seat.seatType === "Premium") {
                totalCollection += booking.seat.price;
            } else {
                totalCollection += booking.seat.price;
            }
        }
        return res.status(200).json({
            success: true,
            data: {
                totalMovies,
                totalTheatres,
                totalShows,
                totalUsers,
                totalBookings,
                totalCollection,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};