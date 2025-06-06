import express from "express";
import { getDB } from "../db.js";
const router = express.Router();

// const appointments = db.collection("appointment");
const collectionName = "appointments";

router.post("/book", async (req, res) => {
    const { docid, date, slot, userid } = req.body;

    if (slot < 1 || slot > 8) {
        return res.status(400).json({ message: "Invalid slot number" });
    }

    try {
        const db = getDB();
        let appointment = await db.collection(collectionName).findOne({ docid, date });

        if (!appointment) {
            appointment = {
                docid,
                date,
                slots: { slot1: [], slot2: [], slot3: [], slot4: [], slot5: [], slot6: [], slot7: [], slot8: [] }
            };
        }

        if (appointment.slots[`slot${slot}`].includes(userid)) {
            return res.status(400).json({ message: "User already booked in this slot" });
        }

        if (Object.values(appointment.slots).some(s => s.includes(userid))) {
            return res.status(400).json({ message: "User already booked for this doctor on this day" });
        }

        if (appointment.slots[`slot${slot}`].length >= 4) {
            return res.status(400).json({ message: "Slot is full" });
        }

        appointment.slots[`slot${slot}`].push(userid);
        // const db = getDB();

        await db.collection(collectionName).updateOne({ docid, date }, { $set: { slots: appointment.slots } }, { upsert: true });

        res.status(200).json({ message: "Appointment booked successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 📌 Get doctor’s availability
router.get("/availability", async (req, res) => {
    const { docid, date } = req.query;

    try {
        const db = getDB();
        const appointment = await db.collection(collectionName).findOne({ docid, date });

        if (!appointment) {
            return res.json({ message: "All slots available", slots: { slot1: [], slot2: [], slot3: [], slot4: [], slot5: [], slot6: [], slot7: [], slot8: [] } });
        }
        console.log(appointment.slots);
        

        res.json({ slots: appointment.slots });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const doctors = await db.collection("appointments").find().toArray();
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 Cancel an appointment
router.post("/cancel", async (req, res) => {
    const { docid, date, slot, userid } = req.body;

    try {
        const db = getDB();
        const appointment = await db.collection(collectionName).findOne({ docid, date });

        if (!appointment || !appointment.slots[`slot${slot}`].includes(userid)) {
            return res.status(400).json({ message: "Appointment not found" });
        }

        appointment.slots[`slot${slot}`] = appointment.slots[`slot${slot}`].filter(id => id !== userid);
        // const db = getDB();

        await db.collection(collectionName).updateOne({ docid, date }, { $set: { slots: appointment.slots } });

        res.status(200).json({ message: "Appointment canceled successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

export default router;
