import express from "express";
import { getDB } from "../db.js";

const router = express.Router();
const signinCollection = "signin";

router.post("/signin", async (req, res) => {
    try {
        console.log("Login Request Data:", req.body);

        const db = getDB();
        if (!db) {
            console.log("Database connection failed");
            return res.status(500).json({ error: "Database connection failed" });
        }
        console.log("Database connection successful");

        // Log the email to check what's being queried
        console.log("Email being searched:", req.body.Gmail);

        // Ensure Gmail is lowercase before searching
        const user = await db.collection(signinCollection).findOne({
            Gmail: req.body.Gmail  // Ensure consistency
        });

        console.log("User Found:", user);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log("Comparing passwords:", user.Password, req.body.Password);

        if (user.Password === req.body.Password) {
            return res.json({ message: "Login success", values: user });
        } else {
            return res.status(401).json({ error: "Incorrect password" });
        }
    } catch (e) {
        console.log("Error:", e);
        res.status(500).json({ error: "Failed to sign in" });
    }
});

export default router;
