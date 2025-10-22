const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Email configuration (you'll need to set up your email service)
const transporter = nodemailer.createTransporter({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Store file metadata in memory (in production, use a database)
let files = [];


// Routes
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileData = {
            id: Date.now().toString(),
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            uploadTime: new Date().toISOString(),
            path: req.file.path
        };

        files.push(fileData);
        res.json({ message: 'File uploaded successfully', file: fileData });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.get('/files', (req, res) => {
    try {
        res.json(files);
    } catch (error) {
        console.error('Files fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

app.get('/download/:id', (req, res) => {
    try {
        const file = files.find(f => f.id === req.params.id);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!fs.existsSync(file.path)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.download(file.path, file.originalName, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Download failed' });
                }
            }
        });
    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    }
});

app.post('/send-file', (req, res) => {
    try {
        const { fileId, email, recipientEmail } = req.body;

        if (!fileId || !email || !recipientEmail) {
            return res.status(400).json({ error: 'File ID, sender email, and recipient email are required' });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || !emailRegex.test(recipientEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const file = files.find(f => f.id === fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!fs.existsSync(file.path)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        const downloadUrl = `http://localhost:${PORT}/download/${fileId}`;

        const mailOptions = {
            from: email,
            to: recipientEmail,
            subject: `File Shared: ${file.originalName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #13a4ec;">FileShare - File Shared</h2>
                    <p>Hello,</p>
                    <p>You have received a file: <strong>${file.originalName}</strong></p>
                    <p>File size: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p>Uploaded: ${new Date(file.uploadTime).toLocaleString()}</p>
                    <p><a href="${downloadUrl}" style="background-color: #13a4ec; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download File</a></p>
                    <p>This link will remain active as long as the file exists on our server.</p>
                    <p>Best regards,<br>FileShare Team</p>
                </div>
            `,
            attachments: [
                {
                    filename: file.originalName,
                    path: file.path
                }
            ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email send error:', error);
                return res.status(500).json({ error: 'Failed to send email' });
            }
            console.log('Email sent:', info.messageId);
            res.json({ message: 'File sent successfully via email' });
        });

    } catch (error) {
        console.error('Send file error:', error);
        res.status(500).json({ error: 'Failed to send file' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});