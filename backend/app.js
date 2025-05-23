import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
dotenv.config();

// route imports
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import exerciseRouter from "./routes/exercises.js";
import authRoutes from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.BACKEND_URL || process.env.IOS,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Apply rate limiting to all routes except auth routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/auth')) {
    limiter(req, res, next);
  } else {
    next();
  }
});

// set routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/exercises", exerciseRouter);
app.use('/auth', authRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// Change from module.exports to export default
export default app;
