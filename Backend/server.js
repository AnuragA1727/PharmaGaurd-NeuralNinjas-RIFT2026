const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { parseVCF } = require("./services/vcfParser");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".vcf")) {
      return cb(new Error("Only .vcf files are allowed"));
    }
    cb(null, true);
  }
});

app.post("/upload", upload.single("vcf"), async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileContent = fs.readFileSync(req.file.path, "utf8");

    const result = parseVCF(fileContent);

    fs.unlinkSync(req.file.path); // clean temp file

    const processingTime = (Date.now() - startTime) / 1000;

    return res.json({
      patient_id: "PATIENT_001",
      timestamp: new Date().toISOString(),
      processing_time_seconds: processingTime,
      ...result
    });

  } catch (err) {
    return res.status(400).json({
      error: err.message,
      quality_metrics: {
        vcf_parsing_success: false
      }
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});