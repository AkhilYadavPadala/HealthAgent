import express from "express";
import { getDB } from "../db.js";

const router = express.Router();
const medicineCollection = "medicine";
const orderCollection = "medicine_orders";

// Fetch all medicines
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const medicines = await db.collection(medicineCollection).find().toArray();
    res.json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a new medicine
router.post("/", async (req, res) => {
  try {
    const { name, type, description, cost, medid } = req.body;

    if (!name || !type || !description || !cost || !medid) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const db = getDB();
    const existingMedicine = await db.collection(medicineCollection).findOne({ medid });

    if (existingMedicine) {
      return res.status(400).json({ error: "Medicine with this ID already exists!" });
    }

    await db.collection(medicineCollection).insertOne({ name, type, description, cost, medid });
    res.status(201).json({ message: "Medicine added successfully!" });
  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Place multiple medicine orders
router.post("/order", async (req, res) => {
  try {
    console.log('hi');
    
    const { userid, medicines } = req.body; // medicines is an array of { medid, quantity }

    if (!userid || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ error: "User ID and medicines array are required!" });
    }

    const db = getDB();
    const existingMedIds = await db.collection(medicineCollection)
      .find({ medid: { $in: medicines.map(med => med.medid) } })
      .toArray();

    const existingMedIdsSet = new Set(existingMedIds.map(med => med.medid));
    const invalidMedicines = medicines.filter(med => !existingMedIdsSet.has(med.medid)).map(med => med.medid);

    // If some medicines are invalid, return an error
    if (invalidMedicines.length > 0) {
      return res.status(400).json({
        error: "Some medicines were not found",
        invalidMedicines,
      });
    }

    // Insert order into the database
    const order = {
      userid,
      medicines, // Only storing { medid, quantity }
      orderDate: new Date(),
      status: "Pending",
    };

    await db.collection(orderCollection).insertOne(order);
    res.status(201).json({ message: "Medicines ordered successfully!", order });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch orders for a specific user
router.get("/orders/:userid", async (req, res) => {
  try {
    const db = getDB();
    const userid = parseInt(req.params.userid); // Ensure it's a number

    const orders = await db.collection(orderCollection).find({ userid }).toArray();

    if (orders.length === 0) {
      return res.status(404).json({ error: "No orders found for this user!" });
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/medicine/getByMedIds", async (req, res) => {
  try {
    const { medids } = req.body; // Expect an array of medids
    if (!Array.isArray(medids) || medids.length === 0) {
      return res.status(400).json({ error: "Invalid medids array" });
    }

    const db = getDB();
    const medicines = await db.collection(medicineCollection)
      .find({ medid: { $in: medids } })
      .toArray();

    res.json(medicines);
  } catch (error) {
    console.error("Error fetching medicine details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch medicine names using medid
router.get("/getmedname/:medid", async (req, res) => {
  try {
    const db = getDB();
    const medid = parseInt(req.params.medid);

    const medicine = await db.collection(medicineCollection).findOne({ medid });

    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found!" });
    }

    res.json({ name: medicine.name });
  } catch (error) {
    console.error("Error fetching medicine name:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/orders/done/:userid", async (req, res) => {
  try {
    const db = getDB();
    const userid = parseInt(req.params.userid); // Ensure it's a number

    // Fetch only completed orders
    const completedOrders = await db.collection(orderCollection)
      .find({ userid, status: "Done" })
      .toArray();

    if (completedOrders.length === 0) {
      return res.status(404).json({ error: "No completed orders found for this user!" });
    }

    res.json(completedOrders);
  } catch (error) {
    console.error("Error fetching completed orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Cancel an order
router.delete("/order/cancel/:orderid", async (req, res) => {
  try {
    const { orderid } = req.params;
    const db = getDB();

    const existingOrder = await db.collection(orderCollection).findOne({ _id: orderid });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found!" });
    }

    if (existingOrder.status !== "Pending") {
      return res.status(400).json({ error: "Only pending orders can be canceled!" });
    }

    await db.collection(orderCollection).deleteOne({ _id: orderid });

    res.json({ message: "Order canceled successfully!" });
  } catch (error) {
    console.error("Error canceling order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
