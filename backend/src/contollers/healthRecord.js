import express from "express";
import { getDB } from "../db.js";

const router = express.Router();
const healthCollection = "health_records";

// Add a new health record for a user
router.post("/", async (req, res) => {
  try {
    const { userid, bloodPressure, height, weight, oxygenSaturation, bmi, pulseRate, bodyTemperature, respirationRate, bloodSugar, gender, DOB, bloodGroup, name } = req.body;

    if (
      !userid || !bloodPressure || height == null || weight == null || oxygenSaturation == null || 
      bmi == null || pulseRate == null || bodyTemperature == null || respirationRate == null || 
      bloodSugar == null || !gender || !DOB || !bloodGroup || !name
    ) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const db = getDB();
    const existingRecord = await db.collection(healthCollection).findOne({ userid });

    if (existingRecord) {
      return res.status(400).json({ error: "Health record for this user already exists!" });
    }

    await db.collection(healthCollection).insertOne({
      userid,
      bloodPressure, 
      height: parseFloat(height), 
      weight: parseFloat(weight), 
      oxygenSaturation: parseFloat(oxygenSaturation),
      bmi: parseFloat(bmi),
      pulseRate: parseInt(pulseRate),
      bodyTemperature: parseFloat(bodyTemperature),
      respirationRate: parseInt(respirationRate),
      bloodSugar: parseFloat(bloodSugar),
      gender,
      DOB: new Date(DOB), 
      bloodGroup,
      name,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Health record added successfully!" });
  } catch (error) {
    console.error("Error adding health record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a user's health record based on userid
router.get("/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const db = getDB();
    const healthRecord = await db.collection(healthCollection).findOne({ userid: parseInt(userid) });

    if (!healthRecord) {
      return res.status(404).json({ error: "No health record found for this user!" });
    }

    res.json(healthRecord);
  } catch (error) {
    console.error("Error fetching health record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update an existing health record based on userid
router.put("/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const { bloodPressure, height, weight, oxygenSaturation, bmi, pulseRate, bodyTemperature, respirationRate, bloodSugar, gender, DOB, bloodGroup, name } = req.body;

    if (
      !bloodPressure || height == null || weight == null || oxygenSaturation == null || 
      bmi == null || pulseRate == null || bodyTemperature == null || respirationRate == null || 
      bloodSugar == null || !gender || !DOB || !bloodGroup || !name
    ) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const db = getDB();
    const existingRecord = await db.collection(healthCollection).findOne({ userid: parseInt(userid) });

    if (!existingRecord) {
      return res.status(404).json({ error: "No health record found for this user to update!" });
    }

    await db.collection(healthCollection).updateOne(
      { userid: parseInt(userid) },
      {
        $set: {
          bloodPressure, 
          height: parseFloat(height), 
          weight: parseFloat(weight), 
          oxygenSaturation: parseFloat(oxygenSaturation),
          bmi: parseFloat(bmi),
          pulseRate: parseInt(pulseRate),
          bodyTemperature: parseFloat(bodyTemperature),
          respirationRate: parseInt(respirationRate),
          bloodSugar: parseFloat(bloodSugar),
          gender,
          DOB: new Date(DOB), 
          bloodGroup,
          name,
          updatedAt: new Date(),
        }
      }
    );

    res.status(200).json({ message: "Health record updated successfully!" });
  } catch (error) {
    console.error("Error updating health record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
