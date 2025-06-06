import express from "express";
import { getDB } from "../db.js";

const router = express.Router();
const staffCollection = "staff";
const scheduleCollection = "timetables";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHIFTS = ["Morning", "Afternoon", "Night"];
const MIN_NURSES_PER_SHIFT = 3;
const MAX_SHIFTS_PER_WEEK = 5; // Maximum shifts a nurse can work in a week

const generateSchedule = async () => {
    const db = getDB();
    const staff = await db.collection(staffCollection).find().toArray();

    const nurses = staff.filter(person => person.work === "Nurse");
    const receptionists = staff.filter(person => person.work === "Receptionist");

    if (nurses.length < MIN_NURSES_PER_SHIFT) {
        throw new Error("Not enough nurses available.");
    }
    if (receptionists.length < 1) {
        throw new Error("Not enough receptionists available.");
    }

    let schedule = {};
    let assignedShifts = {}; // Track total shifts assigned per worker
    let lastNightShiftNurses = new Set(); // Track nurses who worked the previous night shift

    // Initialize assigned shifts counter
    nurses.forEach(nurse => assignedShifts[nurse.workid] = 0);
    receptionists.forEach(receptionist => assignedShifts[receptionist.workid] = 0);

    for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
        const day = DAYS[dayIndex];
        schedule[day] = {};
        let availableNurses = nurses.filter(n => n.off !== day);
        let availableReceptionists = receptionists.filter(r => r.off !== day);
        let assignedToday = new Set(); // Track today's assignments to prevent duplicate shifts

        for (let shift of SHIFTS) {
            // Filter nurses who:
            // 1. Haven't worked today
            // 2. Haven't reached their weekly shift limit
            // 3. Didn't work the previous night shift (if applicable)
            let shiftNurses = availableNurses.filter(n => 
                !assignedToday.has(n.workid) &&
                assignedShifts[n.workid] < MAX_SHIFTS_PER_WEEK &&
                !(shift === "Morning" && lastNightShiftNurses.has(n.workid)) &&
                !(shift === "Afternoon" && lastNightShiftNurses.has(n.workid))
            );

            // Filter receptionists who haven't worked today
            let shiftReceptionists = availableReceptionists.filter(r => 
                !assignedToday.has(r.workid)
            );

            if (shiftNurses.length < MIN_NURSES_PER_SHIFT || shiftReceptionists.length === 0) {
                console.warn(`⚠️ Not enough staff for ${day} ${shift} shift!`);
                continue;
            }

            // Assign nurses with the fewest shifts first
            shiftNurses.sort((a, b) => assignedShifts[a.workid] - assignedShifts[b.workid]);
            let assignedNurses = shiftNurses.slice(0, MIN_NURSES_PER_SHIFT);

            // Assign receptionist with the fewest shifts first
            shiftReceptionists.sort((a, b) => assignedShifts[a.workid] - assignedShifts[b.workid]);
            let assignedReceptionist = shiftReceptionists[0];

            schedule[day][shift] = {
                nurses: assignedNurses.map(n => n.workid),
                receptionist: assignedReceptionist.workid,
            };

            // Track assignments
            assignedNurses.forEach(n => {
                assignedToday.add(n.workid);
                assignedShifts[n.workid]++;
            });
            assignedToday.add(assignedReceptionist.workid);
            assignedShifts[assignedReceptionist.workid]++;

            // Track night shift nurses for the next day
            if (shift === "Night") {
                lastNightShiftNurses = new Set(assignedNurses.map(n => n.workid));
            } else if (dayIndex < DAYS.length - 1 && DAYS[dayIndex + 1] !== day) {
                // Reset night shift nurses if it's the last day or the next day is different
                lastNightShiftNurses.clear();
            }
        }
    }

    // Save schedule in MongoDB
    await db.collection(scheduleCollection).updateOne(
        { type: "weekly_schedule" },
        { $set: { type: "weekly_schedule", schedule } },
        { upsert: true }
    );

    return schedule;
};

// ✅ Generate & Save Timetable
router.post("/generate", async (req, res) => {
    try {
        const schedule = await generateSchedule();
        res.json({ message: "Timetable generated and saved successfully!", schedule });
    } catch (error) {
        console.error("Error generating schedule:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Fetch Saved Timetable
router.get("/get", async (req, res) => {
    try {
        const db = getDB();
        const timetable = await db.collection(scheduleCollection).findOne({ type: "weekly_schedule" });

        if (!timetable) {
            return res.status(404).json({ error: "No timetable found." });
        }

        res.status(200).json(timetable.schedule);
    } catch (error) {
        console.error("Error fetching timetable:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;