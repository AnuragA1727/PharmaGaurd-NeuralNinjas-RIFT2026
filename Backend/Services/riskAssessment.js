// Drug-Gene Interaction Database (CPIC Guidelines)
const DRUG_GENE_INTERACTIONS = {
  CODEINE: {
    primary_gene: "CYP2D6",
    interactions: {
      PM: { risk_label: "Ineffective", severity: "critical", recommendations: "Avoid or use alternative opioid" },
      IM: { risk_label: "Adjust Dosage", severity: "high", recommendations: "Increase dose by 25-50%" },
      NM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      RM: { risk_label: "Adjust Dosage", severity: "moderate", recommendations: "Reduce dose" },
      URM: { risk_label: "Toxic", severity: "critical", recommendations: "Avoid or use lowest dose" },
      Unknown: { risk_label: "Unknown", severity: "low", recommendations: "Monitor response" }
    }
  },
  WARFARIN: {
    primary_gene: "CYP2C9",
    interactions: {
      PM: { risk_label: "Adjust Dosage", severity: "high", recommendations: "Lower maintenance dose (25-33% reduction)" },
      IM: { risk_label: "Adjust Dosage", severity: "moderate", recommendations: "Lower maintenance dose (20% reduction)" },
      NM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      RM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      URM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      Unknown: { risk_label: "Unknown", severity: "low", recommendations: "Monitor INR closely" }
    }
  },
  CLOPIDOGREL: {
    primary_gene: "CYP2C19",
    interactions: {
      PM: { risk_label: "Ineffective", severity: "critical", recommendations: "Use alternative P2Y12 inhibitor (prasugrel/ticagrelor)" },
      IM: { risk_label: "Adjust Dosage", severity: "high", recommendations: "Increase maintenance dose to 600mg" },
      NM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing (75mg daily)" },
      RM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      URM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      Unknown: { risk_label: "Unknown", severity: "low", recommendations: "Consider genotyping" }
    }
  },
  SIMVASTATIN: {
    primary_gene: "SLCO1B1",
    interactions: {
      PM: { risk_label: "Toxic", severity: "critical", recommendations: "Avoid simvastatin; use pravastatin or rosuvastatin" },
      IM: { risk_label: "Adjust Dosage", severity: "high", recommendations: "Limit to 20mg daily; monitor CK levels" },
      NM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      RM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      URM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      Unknown: { risk_label: "Unknown", severity: "low", recommendations: "Monitor for myopathy" }
    }
  },
  AZATHIOPRINE: {
    primary_gene: "TPMT",
    interactions: {
      PM: { risk_label: "Toxic", severity: "critical", recommendations: "Avoid or use reduced dose (10% of normal); close monitoring" },
      IM: { risk_label: "Adjust Dosage", severity: "high", recommendations: "Reduce dose to 30-70% of standard" },
      NM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      RM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      URM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      Unknown: { risk_label: "Unknown", severity: "low", recommendations: "Monitor blood counts regularly" }
    }
  },
  FLUOROURACIL: {
    primary_gene: "DPYD",
    interactions: {
      PM: { risk_label: "Toxic", severity: "critical", recommendations: "Avoid or use greatly reduced dose; risk of severe toxicity" },
      IM: { risk_label: "Adjust Dosage", severity: "high", recommendations: "Consider 25-50% dose reduction" },
      NM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      RM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      URM: { risk_label: "Safe", severity: "none", recommendations: "Standard dosing" },
      Unknown: { risk_label: "Unknown", severity: "low", recommendations: "Enhanced monitoring recommended" }
    }
  }
};

// Diplotype to Phenotype Conversion
const DIPLOTYPE_TO_PHENOTYPE = {
  // CYP2D6
  "*1/*1": "NM", "*1/*2": "NM", "*1/*3": "IM", "*1/*4": "IM",
  "*1/*5": "IM", "*1/*41": "NM", "*2/*2": "NM", "*2/*3": "IM",
  "*2/*4": "IM", "*2/*5": "IM", "*3/*3": "PM", "*3/*4": "PM",
  "*3/*5": "PM", "*4/*4": "PM", "*4/*5": "PM", "*5/*5": "PM",
  "*1/*9": "IM", "*2/*9": "IM", "*41/*41": "NM",
  // CYP2C19
  "*1/*1": "NM", "*1/*2": "IM", "*1/*3": "IM", "*2/*2": "PM",
  "*2/*3": "PM", "*3/*3": "PM",
  // CYP2C9
  "*1/*1": "NM", "*1/*2": "IM", "*1/*3": "IM", "*2/*2": "IM",
  "*2/*3": "PM", "*3/*3": "PM",
  // SLCO1B1
  "*1a/*1a": "NM", "*1a/*1b": "NM", "*1b/*1b": "NM",
  "*1a/*5": "IM", "*1b/*5": "IM", "*5/*5": "PM",
  // TPMT
  "*1/*1": "NM", "*1/*2": "IM", "*1/*3": "IM", "*2/*2": "PM",
  "*2/*3": "PM", "*3/*3": "PM",
  // DPYD
  "*1/*1": "NM", "*1/*2": "IM", "*1/*13": "IM", "*2/*2": "PM",
  "*2/*13": "PM", "*13/*13": "PM"
};

function predictPhenotype(diplotype, gene) {
  if (diplotype === "Unknown") return "Unknown";
  
  // Try exact match
  if (DIPLOTYPE_TO_PHENOTYPE[diplotype]) {
    return DIPLOTYPE_TO_PHENOTYPE[diplotype];
  }
  
  // Try reverse match (e.g., *2/*1 vs *1/*2)
  const reversed = diplotype.split("/").reverse().join("/");
  if (DIPLOTYPE_TO_PHENOTYPE[reversed]) {
    return DIPLOTYPE_TO_PHENOTYPE[reversed];
  }
  
  return "Unknown";
}

function assessRisk(drug, phenotype, variantCount) {
  const drugData = DRUG_GENE_INTERACTIONS[drug.toUpperCase()];
  
  if (!drugData) {
    return {
      risk_label: "Unknown",
      confidence_score: 0.0,
      severity: "low"
    };
  }
  
  const phenotypeData = drugData.interactions[phenotype] || drugData.interactions["Unknown"];
  
  // Calculate confidence based on variant count
  let confidence_score = 0.0;
  if (phenotype === "Unknown") {
    confidence_score = variantCount > 0 ? 0.5 : 0.0;
  } else {
    confidence_score = variantCount >= 2 ? 0.95 : (variantCount === 1 ? 0.7 : 0.5);
  }
  
  return {
    risk_label: phenotypeData.risk_label,
    confidence_score: Math.min(confidence_score, 0.99),
    severity: phenotypeData.severity
  };
}

function getClinicalRecommendation(drug, phenotype, variantCount) {
  const drugData = DRUG_GENE_INTERACTIONS[drug.toUpperCase()];
  
  if (!drugData) {
    return {
      recommendation: "No specific recommendations available",
      cpic_guideline: "Not available",
      monitoring: "Standard clinical monitoring"
    };
  }
  
  const phenotypeData = drugData.interactions[phenotype] || drugData.interactions["Unknown"];
  
  return {
    recommendation: phenotypeData.recommendations,
    cpic_guideline: `CPIC guideline for ${drug} and ${drugData.primary_gene}`,
    monitoring: getMonitoring(drug, phenotype),
    contraindications: getContraindications(drug, phenotype)
  };
}

function getMonitoring(drug, phenotype) {
  const monitoring = {
    CODEINE: {
      PM: "Not applicable - avoid drug",
      IM: "Monitor for efficacy and side effects",
      NM: "Standard monitoring",
      RM: "Monitor for reduced efficacy",
      URM: "Monitor for overdose symptoms"
    },
    WARFARIN: {
      PM: "INR monitoring at baseline, 2-7 days, then weekly x 1-2 weeks",
      IM: "INR monitoring at baseline, 2-7 days, then weekly x 1-2 weeks",
      NM: "Standard INR monitoring per protocol"
    },
    CLOPIDOGREL: {
      PM: "Not recommended - consider alternative",
      IM: "Monitor for cardiovascular events",
      NM: "Standard monitoring"
    }
  };
  
  return monitoring[drug.toUpperCase()]?.[phenotype] || "Monitor patient response and adverse effects";
}

function getContraindications(drug, phenotype) {
  const contraindications = {
    CODEINE: {
      PM: "Absolute contraindication",
      URM: "Use with extreme caution"
    },
    SIMVASTATIN: {
      PM: "Relative contraindication - use alternatives"
    },
    AZATHIOPRINE: {
      PM: "Absolute contraindication or extreme caution"
    },
    FLUOROURACIL: {
      PM: "Absolute contraindication"
    }
  };
  
  return contraindications[drug.toUpperCase()]?.[phenotype] || "None";
}

module.exports = {
  DRUG_GENE_INTERACTIONS,
  predictPhenotype,
  assessRisk,
  getClinicalRecommendation
};
