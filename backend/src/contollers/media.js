import express from 'express';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import { getGFS, getDB } from '../db.js'; // ✅ Ensure correct imports

const router = express.Router();
const upload = multer();

// ✅ Media Upload Route (only requires `userId`, `name`, and `file`)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { userid, name } = req.body;
        if (!userid || !name || !req.file) {
            return res.status(400).json({ message: 'Missing required fields: userId, name, or file' });
        }

        const gfs = getGFS();
        const db = getDB();

        // ✅ Allowed file types
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Invalid media type. Only images and videos are allowed.' });
        }

        // ✅ Upload file to GridFS
        const uploadStream = gfs.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype,
        });

        // ✅ Handle upload errors
        uploadStream.on('error', (error) => {
            console.error('Error uploading media:', error);
            return res.status(500).json({ message: 'Error uploading media' });
        });

        // ✅ Handle successful upload
        uploadStream.on('finish', async () => {
            const fileId = uploadStream.id;

            // ✅ Store file details in DB
            const newMediaEntry = {
                userid: userid,
                Name: name,
                FileId: fileId,
                UploadedAt: new Date(),
            };

            try {
                // ✅ Insert record into the database
                await db.collection("UserMedia").insertOne(newMediaEntry);
                res.status(201).json({
                    message: 'Media uploaded successfully!',
                    fileId,
                    data: newMediaEntry,
                });
            } catch (error) {
                console.error("Error inserting media entry:", error);
                res.status(500).json({ error: "Failed to store media entry" });
            }
        });

        // ✅ Send file buffer to GridFS
        uploadStream.end(req.file.buffer);

    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ message: 'Error uploading media' });
    }
});

// ✅ Media Retrieval Route
router.get('/:id', async (req, res) => {
    try {
        const gfs = getGFS();
        const file = await gfs.find({ _id: new ObjectId(req.params.id) }).toArray();

        if (!file.length) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // ✅ Set headers before streaming
        res.set('Content-Type', file[0].contentType);
        res.set('Content-Length', file[0].length);

        const downloadStream = gfs.openDownloadStream(file[0]._id);
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error retrieving media:', error);
        res.status(500).json({ message: 'Error retrieving media' });
    }
});

export default router;
