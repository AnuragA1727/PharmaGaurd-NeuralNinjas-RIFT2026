const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

const { readVCF } = require("./vcfReader.js");
const { extractGenes } = require("./Services/geneExtractor.js");
const { formatResponse } = require("./responseFormatter.js");

const app = express();
app.use(cors());

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.post("/upload", upload.single("vcf"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const content = fs.readFileSync(req.file.path, "utf8");

    const { vcfVersionValid, variantLines } = readVCF(content);

    const extracted = extractGenes(variantLines);

    const finalResponse = formatResponse(extracted, vcfVersionValid);

    fs.unlinkSync(req.file.path);

    res.json({
      patient_id: "PATIENT_001",
      timestamp: new Date().toISOString(),
      ...finalResponse
    });

  } catch (err) {
    res.status(400).json({
      error: err.message,
      quality_metrics: { vcf_parsing_success: false }
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});