# PharmaGuard 🧬
### AI-Powered Pharmacogenomic Risk Prediction System

> **RIFT 2026 Hackathon — Pharmacogenomics / Explainable AI Track**

PharmaGuard analyzes your genetic VCF data to predict personalized drug risks using AI, CPIC guidelines, and Google Gemini for clinical explanations.

---

## 🌐 Live Demo

**[Live Link](https://pharma-gaurd-neural-ninjas-rift-202-self.vercel.app/)** ← Deployed URL

---

## 🎥 LinkedIn Demo Video

**[Watch on LinkedIn](#)** ← Replace with your LinkedIn video URL  
Tagged: RIFT 2026 · #RIFT2026 #PharmaGuard #Pharmacogenomics #AIinHealthcare

---

## 🏗 Architecture Overview

```
pharma/
├── public/                  ← Static frontend (served as-is)
│   ├── index.html           ← Full UI: hero, upload, drug select, results
│   ├── style.css            ← Complete design system (glassmorphism, animations)
│   └── app.js               ← All frontend logic (VCF reading, API calls, rendering)
│
├── lib/                     ← Shared Node.js modules (no dependencies)
│   ├── vcfParser.js         ← VCF v4.2 parser (CommonJS)
│   ├── pharmEngine.js       ← CPIC pharma engine (CommonJS)
│   └── llmExplainer.js      ← Gemini API + rule-based fallback
│
├── api/                     ← Vercel serverless functions
│   └── analyze.js           ← POST /api/analyze
│
├── netlify/
│   └── functions/
│       └── analyze.js       ← Same logic, Netlify exports.handler format
│
├── vercel.json              ← Vercel config (framework: null, public output)
├── netlify.toml             ← Netlify config (redirects /api/* → functions)
├── package.json             ← Zero runtime dependencies
└── .env.example             ← GEMINI_API_KEY placeholder

```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS with Glassmorphism |
| AI/LLM | Google Gemini 1.5 Flash |
| Genomics | Custom VCF v4.2 Parser |
| Guidelines | CPIC (Clinical Pharmacogenetics Consortium) |
| Deployment | Vercel / Netlify / Render |

---

## ⚙️ Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/pharma-guard.git
cd pharma-guard

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY (optional)

# 4. Run development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

---

## 🔑 API Documentation

### `POST /api/analyze`

Analyzes a VCF file for pharmacogenomic drug interactions.

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| `vcf` | File | VCF v4.2 file (max 5 MB) |
| `drugs` | String | Comma-separated drug names |

**Response Schema:**
```json
{
  "patient_id": "PATIENT_XXX",
  "drug": "CODEINE",
  "timestamp": "2026-02-19T00:00:00.000Z",
  "risk_assessment": {
    "risk_label": "Toxic",
    "confidence_score": 0.97,
    "severity": "critical",
    "risk_factors": ["Ultra-rapid metabolizer..."]
  },
  "pharmacogenomic_profile": {
    "primary_gene": "CYP2D6",
    "diplotype": "*1xN/*1",
    "phenotype": "URM",
    "detected_variants": [...]
  },
  "clinical_recommendation": {
    "dosing_recommendation": "CONTRAINDICATED...",
    "alternative_drugs": ["Morphine", "Hydromorphone"],
    "monitoring_required": [...],
    "cpic_level": "A",
    "cpic_guideline": "CPIC Guideline for Codeine..."
  },
  "llm_generated_explanation": {
    "summary": "...",
    "mechanism": "...",
    "clinical_significance": "...",
    "monitoring_parameters": "...",
    "patient_friendly_summary": "..."
  },
  "quality_metrics": {
    "vcf_parsing_success": true,
    "total_variants_in_vcf": 5,
    "pharmacogenomic_genes_found": ["CYP2D6"]
  }
}
```

### `GET /api/samples`

Returns list of available sample VCF files for testing.

### `GET /api/samples?name=<filename>`

Downloads a specific sample VCF file.

---

## 🧬 Supported Genes & Drugs

| Gene | Drug | Risk Scenario |
|------|------|--------------|
| CYP2D6 | CODEINE | PM → Ineffective; URM → Toxic/Fatal |
| CYP2C19 | CLOPIDOGREL | PM → Ineffective (MACE risk) |
| CYP2C9 | WARFARIN | PM → Bleeding risk (90% dose reduction) |
| SLCO1B1 | SIMVASTATIN | Decreased → Myopathy/Rhabdomyolysis |
| TPMT | AZATHIOPRINE | PM → Bone marrow suppression |
| DPYD | FLUOROURACIL | PM → Fatal toxicity |

---

## 🧪 Sample VCF Files

Located in `/public/samples/` (served via `/api/samples`):

- `patient_cyp2d6_codeine.vcf` — CYP2D6 *4/*4 Poor Metabolizer
- `patient_cyp2c19_clopidogrel.vcf` — CYP2C19 *2/*3 Poor Metabolizer
- `patient_cyp2c9_warfarin.vcf` — CYP2C9 *2/*3 Poor Metabolizer
- `patient_slco1b1_simvastatin.vcf` — SLCO1B1 *5/*5 Decreased Function
- `patient_tpmt_azathioprine.vcf` — TPMT *3B/*3C Poor Metabolizer
- `patient_dpyd_fluorouracil.vcf` — DPYD *2A/c.2846A>T Intermediate/Poor

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
# Set GEMINI_API_KEY in Vercel Dashboard → Settings → Environment Variables
```

### Netlify
```bash
npm run build
# Deploy the .next folder via Netlify CLI or drag-and-drop
```

---

## 👥 Team Members

| Name | Role |
|------|------|
| ← Add your team members here | — |

---

## ⚠️ Disclaimer

PharmaGuard is developed for the RIFT 2026 Hackathon and is intended for research and educational purposes only. It is **not** a substitute for clinical pharmacogenomic testing by a certified laboratory, nor for advice from a licensed pharmacist or physician. Clinical decisions should always be made in consultation with qualified healthcare professionals.
