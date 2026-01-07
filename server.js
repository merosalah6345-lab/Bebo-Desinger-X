const express = require('express');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const sanitize = require('sanitize-filename');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PDFS_DIR = path.join(__dirname, 'pdfs');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(PDFS_DIR)) fs.mkdirSync(PDFS_DIR);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files and generated PDFs
app.use('/files', express.static(UPLOADS_DIR));
app.use('/pdfs', express.static(PDFS_DIR));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const clean = sanitize(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + clean;
    cb(null, unique);
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB per file

app.post('/api/orders', upload.array('files', 10), (req, res) => {
  try {
    const { service, pages, language, topic, details, phone } = req.body;
    const files = req.files || [];

    const safeTopic = sanitize(topic || 'order').replace(/\s+/g, '_') || 'order';
    const timestamp = Date.now();
    const pdfFilename = `${safeTopic}_${timestamp}.pdf`;
    const pdfPath = path.join(PDFS_DIR, pdfFilename);

    // Generate PDF server-side using PDFKit
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(18).text('New Order from Bebo Designer X', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Service: ${service || ''}`);
    doc.text(`Pages/Slides: ${pages || ''}`);
    doc.text(`Language: ${language || ''}`);
    doc.text(`Topic: ${topic || ''}`);
    doc.moveDown();

    doc.text('Details:', { underline: true });
    doc.text(details || '', { width: 450 });
    doc.moveDown();

    doc.text(`Client Contact: ${phone || ''}`);
    doc.moveDown();

    doc.text('Attached files:', { underline: true });
    if (files.length) {
      files.forEach((f, i) => {
        doc.text(`${i + 1}. ${f.originalname} -> /files/${path.basename(f.filename)}`);
      });
    } else {
      doc.text('No files attached');
    }

    doc.end();

    stream.on('finish', () => {
      const host = req.get('host');
      const protocol = req.protocol;
      const pdfUrl = `${protocol}://${host}/pdfs/${pdfFilename}`;
      res.json({ success: true, pdfUrl });
    });

    stream.on('error', (err) => {
      console.error('PDF write error', err);
      res.status(500).json({ success: false, error: 'Failed to generate PDF' });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Basic health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the existing index.html if present (static root)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
