# Ticket Booking System with Razor pay Payment Integration

This project is related to booking ticket platform where user user can browse movies, choose movies, select theatre, select seats, select shows and proceed for payment to make the booking successful. This project has two role the main role is admin panel, where admin have to create all the functionality so that user can make interaction with the project and they can use it. Given Below are steps how to install this project in your system, just follow the instruction

## Features for User
- User can signup and login (Authentication and jwt)
- Browse available movie whose show is created
- Select movie so that the can see the listed nearest theatre according to his location
- Then select show time for that movie in that theatre
- Select seat form the provided seat map
- Secure payment with razorpay
- Booking confirmation if booking done
- Browse their booking history
- User dashboard to see how much spent how many ticket booked

## features for admin
- Admin login only
- Admin dashboard to see all the calculation and bookings
- Admin can add a theatre based on their location using latitude and longitude
- Admin can show all the theatre list they added
- Admin can search movie and add them into their database
- Admin can see which movie is added or not to create shows
- Now Admin can create Shows based on movie and theatre.
Admin can see all the list of created show they can change their show time and also cancel the show only if no any ticket is booked with that show
- Admin can see all the booking details of users with user details, show details, seat details, movie details.

## Tech Stack Used
### Frontend
- React js
- Material UI
- React Router
- Axios
- React leaf let

### Backend 
- Node.js
- Express.js
- Typescript
- Typeorm

### Database
- Postgresql

### Authentication 
- JWT

### Payment Integration
- RazorPay

## Frontend Structure
```
ticket-bookin-front.git/
├── .gitignore
├── README.md
├── api/
│   └── apidata.ts
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── components/
│   │   ├── Home.tsx
│   │   ├── NotFound.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── PubLayout.tsx
│   │   ├── PubNav.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AllBookings.tsx
│   │   │   ├── AllShow.tsx
│   │   │   ├── CreateTheatre.tsx
│   │   │   ├── Createshow.tsx
│   │   │   ├── MovieList.tsx
│   │   │   ├── SearchMovie.tsx
│   │   │   └── TheatreList.tsx
│   │   └── user/
│   │       ├── Booking.tsx
│   │       ├── MainLayout.tsx
│   │       ├── MovieDetaiols.tsx
│   │       ├── MovieUserList.tsx
│   │       ├── MyBooking.tsx
│   │       ├── SeatList.tsx
│   │       ├── ShowsList.tsx
│   │       ├── Signup.tsx
│   │       ├── UserDashboard.tsx
│   │       └── UserLogin.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── index.css
│   └── main.tsx
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

## Backend structure
```
tickect-book-back.git/
├── .gitignore
├── eslint.config.mjs
├── eslint.config.mts
├── package-lock.json
├── package.json
├── server.ts
├── src/
│   ├── authorization/
│   │   └── authorize.ts
│   ├── config/
│   │   └── data-source.ts
│   ├── controller/
│   │   ├── adminController.ts
│   │   ├── getMe.ts
│   │   └── userController.ts
│   ├── entity/
│   │   ├── Booking.ts
│   │   ├── Movie.ts
│   │   ├── Seat.ts
│   │   ├── Show.ts
│   │   ├── Theatre.ts
│   │   └── User.ts
│   ├── middleware/
│   │   └── checkLogin.ts
│   ├── routes/
│   │   ├── adminRoute.ts
│   │   ├── meRoute.ts
│   │   └── userRoute.ts
│   └── utils/
│       ├── generateToken.ts
│       ├── getDistance.ts
│       ├── razorPay.ts
│       ├── types.ts
│       └── verifyToken.ts
└── tsconfig.json
```

## env variables for backend
- PORT=Enter your posrt number
- DATABASE_URL=postgres databse connection string
- JWT_SECRET=enter your secret key
- CORS_ORIGIN=enter the url of frontend deployement or running localhost link
- TMDB_LINK=https://api.themoviedb.org/3 
- TMDB_API_KEY=your tmdb API key
- NODE_ENV=development // change on deployment
- RAZORPAY_KEY_ID=enter your razor pay key id from razor pay dashboard don't forget to make razor pay in test mode to get these details
- RAZORPAY_KEY_SECRET=enter your razor pay key secret

## env for frontend
VITE_API_URL=backend localhost or deployed url
VITE_RAZORPAY_KEY_ID=razor pay key id

## installation
 ### clone the repository
 ```
 - git clone <repository name>
 ```

 ### backend
```
cd ticket-booking-node
npm install 
npm run dev
```

### frontend
```
cd ticket-booking-react
npm install
npm run dev
```

## Author 
Sudhir kumar
