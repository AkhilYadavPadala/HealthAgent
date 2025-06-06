import express from "express";
import { getDB } from "../db.js";

const router = express.Router();
const doctorsCollection = "doctors";
const favoritesCollection = "fav"; // Collection to store favorite doctors

// ✅ Get all doctors
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const doctors = await db.collection(doctorsCollection).find().toArray();
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/top5", async (req, res) => {
  try {
    const db = getDB();
    const topDoctors = await db.collection(doctorsCollection)
      .find()
      .sort({ exp: -1 }) // Sorting by experience in descending order
      .limit(5)
      .toArray();

    res.json(topDoctors);
  } catch (error) {
    console.error("Error fetching top doctors:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Add a new doctor
router.post("/", async (req, res) => {
  try {
    const { name, specialist, exp, fee, docid } = req.body;

    if (!name || !specialist || !exp || !fee || !docid) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const db = getDB();
    const existingDoctor = await db.collection(doctorsCollection).findOne({ docid });

    if (existingDoctor) {
      return res.status(400).json({ error: "Doctor with this ID already exists!" });
    }

    await db.collection(doctorsCollection).insertOne({ name, specialist, exp, fee, docid });
    res.status(201).json({ message: "Doctor added successfully!" });
  } catch (error) {
    console.error("Error adding doctor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/a", async (req, res) => {
  try {
    const { name, specialty, location } = req.body;

    // Validate required fields
    if (!name || !specialty || !location) {
      return res.status(400).json({ error: "Name, specialty, and location are required!" });
    }

    const db = getDB();
    const existingDoctor = await db.collection(doctorsCollection).findOne({ name, specialty, location });

    if (existingDoctor) {
      return res.status(400).json({ error: "Doctor with this name, specialty, and location already exists!" });
    }

    // Default available slots
    const available_slots = [
      "09:00-10:00",
      "10:00-11:00",
      "11:00-12:00",
      "14:00-15:00",
      "15:00-16:00",
      "16:00-17:00"
    ];

    // Insert new doctor into the database
    await db.collection(doctorsCollection).insertOne({ name, specialty, location, available_slots });

    res.status(201).json({ message: "Doctor added successfully!" });
  } catch (error) {
    console.error("Error adding doctor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// ✅ Update a doctor's details
router.put("/update/:did", async (req, res) => {
  try {
    const { did } = req.params;
    const { name, specialist, exp, fee } = req.body;

    if (!name || !specialist || !exp || !fee) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const db = getDB();
    const updatedDoctor = await db.collection(doctorsCollection).findOneAndUpdate(
      { docid: did },
      { $set: { name, specialist, exp, fee } },
      { returnDocument: "after" }
    );

    if (!updatedDoctor.value) {
      return res.status(404).json({ error: "Doctor not found!" });
    }

    res.json({ message: "Doctor updated successfully!", doctor: updatedDoctor.value });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Add a favorite doctor for a user
router.post('/fav', async (req, res) => {
  try {
    const { userid, docid } = req.body;

    if (typeof userid !== "number" || typeof docid !== "number") {
      return res.status(400).json({ error: "userid and docid must be numbers" });
    }

    const db = getDB();
    const userFavorites = await db.collection(favoritesCollection).findOne({ userid });

    if (userFavorites) {
      if (!userFavorites.docids.includes(docid)) {
        await db.collection(favoritesCollection).updateOne(
          { userid },
          { $push: { docids: docid } }
        );
      }
    } else {
      await db.collection(favoritesCollection).insertOne({ userid, docids: [docid] });
    }

    res.status(200).json({ message: "Favorite doctor added successfully" });
  } catch (error) {
    console.error("Error adding favorite doctor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Get favorite doctor details for a user
router.get('/fav/:userid', async (req, res) => {
  try {
    const userid = parseInt(req.params.userid);
    const db = getDB();

    // 🔹 Fetch user's favorite doctor IDs
    const userFavorites = await db.collection(favoritesCollection).findOne({ userid });

    if (!userFavorites || userFavorites.docids.length === 0) {
      return res.status(404).json({ error: "No favorite doctors found for this userid" });
    }

    // 🔹 Fetch doctor details based on favorite doctor IDs
    const favoriteDoctorDetails = await db.collection(doctorsCollection)
      .find({ docid: { $in: userFavorites.docids } })
      .toArray();

    res.status(200).json({ userid, favoriteDoctors: favoriteDoctorDetails });
  } catch (error) {
    console.error("Error fetching favorite doctors:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Remove a favorite doctor
router.delete('/fav/:userid/:docid', async (req, res) => {
  try {
    const userid = parseInt(req.params.userid);
    const docid = parseInt(req.params.docid);
    const db = getDB();

    // 🔹 Check if user exists in favorites
    const userFavorites = await db.collection(favoritesCollection).findOne({ userid });

    if (!userFavorites) {
      return res.status(404).json({ error: "No favorites found for this user" });
    }

    // 🔹 Remove the doctor ID from the user's favorite list
    const updatedFavorites = userFavorites.docids.filter(id => id !== docid);

    if (updatedFavorites.length === 0) {
      // If no favorites remain, delete the entry
      await db.collection(favoritesCollection).deleteOne({ userid });
    } else {
      // Otherwise, update the document
      await db.collection(favoritesCollection).updateOne(
        { userid },
        { $set: { docids: updatedFavorites } }
      );
    }

    res.status(200).json({ message: "Doctor removed from favorites", favorites: updatedFavorites });
  } catch (error) {
    console.error("Error removing favorite doctor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
