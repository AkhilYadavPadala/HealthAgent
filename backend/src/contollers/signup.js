import express from "express";
import { getDB } from "../db.js";

const router = express.Router();
const signupCollection = "signin";

router.post('/signup', async (req, res) => {
    try {
        const db = getDB();
        if (!db) {
            console.log("Database connection failed");
            return res.status(500).json({ error: "Database connection failed" });
        }
        console.log("Database connection successful");

        const result = await db.collection(signupCollection).insertOne({ Gmail: req.body.Gmail, Password: req.body.Password });
        if (result) {
            res.json({ message: "Signup success", values: result });
        } else {
            res.json({ error: "Failed" });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "Failed to sign up" });
    }
});

export default router;