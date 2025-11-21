const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Ensure data directory exists for metadata persistence
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const filesMetadataPath = path.join(dataDir, 'files.json');

function loadFilesFromDisk() {
    try {
        if (!fs.existsSync(filesMetadataPath)) {
            fs.writeFileSync(filesMetadataPath, JSON.stringify([], null, 2));
            return [];
        }

        const raw = fs.readFileSync(filesMetadataPath, 'utf-8');
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(file => {
            if (!file || !file.path) {
                return false;
            }

            if (!fs.existsSync(file.path)) {
                console.warn(`Missing file on disk, removing from metadata: ${file.originalName || file.path}`);
                return false;
            }

            return true;
        });
    } catch (error) {
        console.error('Failed to load files metadata:', error);
        return [];
    }
}

function saveFilesToDisk(fileList) {
    try {
        fs.writeFileSync(filesMetadataPath, JSON.stringify(fileList, null, 2));
    } catch (error) {
        console.error('Failed to save files metadata:', error);
    }
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

// Store file metadata persistently (in production, use a database)
let files = loadFilesFromDisk();
saveFilesToDisk(files);


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
        saveFilesToDisk(files);
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

app.delete('/files/:id', (req, res) => {
    try {
        const fileIndex = files.findIndex(f => f.id === req.params.id);
        if (fileIndex === -1) {
            return res.status(404).json({ error: 'File not found' });
        }

        const [file] = files.splice(fileIndex, 1);

        if (file && file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (unlinkError) {
                console.warn('Failed to delete file from disk:', unlinkError);
            }
        }

        saveFilesToDisk(files);
        res.json({ message: 'File removed successfully' });
    } catch (error) {
        console.error('File delete error:', error);
        res.status(500).json({ error: 'Failed to remove file' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});