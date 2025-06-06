import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDB } from "./db.js";
import doctorRoutes from "./contollers/doctors.js" ;
import med from './contollers/medicine.js';
import appoint from "./contollers/appointment.js";
import record from './contollers/healthRecord.js';
import tt from './contollers/timetable.js';
import media from './contollers/media.js';
import signin from './contollers/signin.js';
import signup from './contollers/signup.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*', // or replace wit*h your frontend's address
}));


app.get("/", (req, res) => {
  res.json({ message: "🚀 Backend is running successfully!" });
});

app.use("/doctors", doctorRoutes);
app.use('/med',med);
app.use('/appoint',appoint);
app.use('/record',record);
app.use('/tt',tt);
app.use('/media',media);
app.use('/signin',signin);
app.use('/signup',signup);

connectToDB(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
});
