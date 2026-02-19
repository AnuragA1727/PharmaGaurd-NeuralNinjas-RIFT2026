const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

const { readVCF } = require("./Services/vcfReader.js");
const { extractGenes } = require("./Services/geneExtractor.js");
const { formatResponse } = require("./Services/responseFormatter.js");
const { DRUG_GENE_INTERACTIONS } = require("./Services/riskAssessment.js");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Generate unique patient ID
function generatePatientID() {
  return "PATIENT_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Get primary gene for a drug
function getPrimaryGeneForDrug(drug) {
  const drugData = DRUG_GENE_INTERACTIONS[drug.toUpperCase()];
  return drugData ? drugData.primary_gene : null;
}

app.get("/test", (req, res) => {
  res.json({ message: "PharmaGuard backend is running" });
});

app.get("/supported-drugs", (req, res) => {
  const supportedDrugs = Object.keys(DRUG_GENE_INTERACTIONS);
  res.json({ 
    supported_drugs: supportedDrugs,
    count: supportedDrugs.length
  });
});

app.post("/upload", upload.single("vcf"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: "No VCF file uploaded",
        quality_metrics: { vcf_parsing_success: false }
      });
    }

    // Extract drug from request body or query
    const drug = req.body.drug || req.query.drug;
    
    if (!drug) {
      return res.status(400).json({
        error: "Drug name is required. Provide 'drug' parameter in request body or query.",
        supported_drugs: Object.keys(DRUG_GENE_INTERACTIONS),
        quality_metrics: { vcf_parsing_success: false }
      });
    }

    // Validate drug is supported
    const supportedDrugs = Object.keys(DRUG_GENE_INTERACTIONS);
    if (!supportedDrugs.includes(drug.toUpperCase())) {
      return res.status(400).json({
        error: `Drug "${drug}" is not supported.`,
        supported_drugs: supportedDrugs,
        quality_metrics: { vcf_parsing_success: false }
      });
    }

    const content = fs.readFileSync(req.file.path, "utf8");

    const { vcfVersionValid, variantLines } = readVCF(content);

    const extracted = extractGenes(variantLines);

    const primaryGene = getPrimaryGeneForDrug(drug);
    const finalResponse = formatResponse(extracted, vcfVersionValid, drug, primaryGene);

    fs.unlinkSync(req.file.path);

    res.json({
      patient_id: generatePatientID(),
      drug: drug.toUpperCase(),
      timestamp: new Date().toISOString(),
      ...finalResponse
    });

  } catch (err) {
    res.status(400).json({
      error: err.message,
      details: err.stack,
      quality_metrics: { vcf_parsing_success: false }
    });
  }
});

// Endpoint to test with sample data
app.post("/test-sample", (req, res) => {
  try {
    const drug = req.body.drug || "CODEINE";
    
    if (!Object.keys(DRUG_GENE_INTERACTIONS).includes(drug.toUpperCase())) {
      return res.status(400).json({
        error: `Drug "${drug}" not supported`,
        supported_drugs: Object.keys(DRUG_GENE_INTERACTIONS)
      });
    }

    const sampleData = {
      pharmacogenes: {
        CYP2D6: [
          { rsid: "rs1065852", star: "*1" },
          { rsid: "rs16947", star: "*2" }
        ],
        CYP2C19: [],
        CYP2C9: [],
        SLCO1B1: [],
        TPMT: [],
        DPYD: []
      },
      totalVariants: 2,
      relevantVariants: 2
    };

    const primaryGene = getPrimaryGeneForDrug(drug);
    const response = formatResponse(sampleData, true, drug, primaryGene);

    res.json({
      patient_id: generatePatientID(),
      drug: drug.toUpperCase(),
      timestamp: new Date().toISOString(),
      ...response
    });
  } catch (err) {
    res.status(400).json({
      error: err.message,
      quality_metrics: { vcf_parsing_success: false }
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PharmaGuard server running on port ${PORT}`);
  console.log(`📝 Supported drugs: ${Object.keys(DRUG_GENE_INTERACTIONS).join(", ")}`);
});