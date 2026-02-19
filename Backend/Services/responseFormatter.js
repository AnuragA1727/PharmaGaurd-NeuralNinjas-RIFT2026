const { predictPhenotype, assessRisk, getClinicalRecommendation } = require("./riskAssessment.js");

function buildDiplotype(variants) {
  const stars = variants
    .map(v => v.star)
    .filter(s => s !== "Unknown")
    .sort();

  if (stars.length >= 2) {
    return `${stars[0]}/${stars[1]}`;
  }

  if (stars.length === 1) {
    return `${stars[0]}/Unknown`;
  }

  return "Unknown";
}

function formatResponse(data, versionValid, drug, primaryGene) {
  const formattedGenes = {};
  let selectedProfile = null;
  let selectedDiplotype = "Unknown";
  let variantCount = 0;

  // Format all genes and select the primary one
  for (let gene in data.pharmacogenes) {
    const variants = data.pharmacogenes[gene];

    if (variants.length > 0) {
      const diplotype = buildDiplotype(variants);
      const phenotype = predictPhenotype(diplotype, gene);

      formattedGenes[gene] = {
        diplotype,
        phenotype,
        detected_variants: variants
      };

      // Track primary gene
      if (gene === primaryGene) {
        selectedProfile = formattedGenes[gene];
        selectedDiplotype = diplotype;
        variantCount = variants.length;
      }
    } else {
      formattedGenes[gene] = {
        diplotype: "Unknown",
        phenotype: "Unknown",
        detected_variants: []
      };
    }
  }

  // If no primary gene found, use first available gene with variants
  if (!selectedProfile && drug) {
    for (let gene in formattedGenes) {
      if (formattedGenes[gene].detected_variants.length > 0) {
        selectedProfile = formattedGenes[gene];
        selectedDiplotype = formattedGenes[gene].diplotype;
        variantCount = formattedGenes[gene].detected_variants.length;
        break;
      }
    }
  }

  const phenotype = selectedProfile?.phenotype || "Unknown";
  const riskAssessment = drug ? assessRisk(drug, phenotype, variantCount) : {
    risk_label: "Unknown",
    confidence_score: 0.0,
    severity: "low"
  };
  
  const clinicalRec = drug ? getClinicalRecommendation(drug, phenotype, variantCount) : {
    recommendation: "Drug not specified",
    cpic_guideline: "N/A",
    monitoring: "N/A",
    contraindications: "N/A"
  };

  return {
    pharmacogenomic_profile: {
      primary_gene: primaryGene || "N/A",
      diplotype: selectedDiplotype,
      phenotype: phenotype,
      detected_variants: selectedProfile?.detected_variants || []
    },
    risk_assessment: riskAssessment,
    clinical_recommendation: clinicalRec,
    llm_generated_explanation: {
      summary: generateExplanation(drug, phenotype, primaryGene, riskAssessment),
      key_points: generateKeyPoints(drug, phenotype, primaryGene),
      variant_impact: generateVariantImpact(selectedProfile?.detected_variants || [])
    },
    quality_metrics: {
      vcf_parsing_success: versionValid,
      vcf_version_valid: versionValid,
      total_variants_found: data.totalVariants,
      relevant_pharmacogenomic_variants: data.relevantVariants,
      genes_analyzed: Object.keys(formattedGenes).length,
      genes_with_variants: Object.values(formattedGenes).filter(g => g.detected_variants.length > 0).length
    },
    all_genes_profile: formattedGenes
  };
}

function generateExplanation(drug, phenotype, gene, riskAssessment) {
  if (!drug || !gene) {
    return "No drug or gene specified for analysis.";
  }

  const phenotypeDescriptions = {
    PM: "Poor Metabolizer - reduced or absent enzyme function",
    IM: "Intermediate Metabolizer - intermediate enzyme function",
    NM: "Normal Metabolizer - normal enzyme function",
    RM: "Rapid Metabolizer - increased enzyme function",
    URM: "Ultra Rapid Metabolizer - significantly increased enzyme function",
    Unknown: "Unable to determine metabolizer status"
  };

  const explanation = `Patient has ${phenotype} (${phenotypeDescriptions[phenotype]}) status for ${gene}. ` +
    `For ${drug}, this ${phenotype} status indicates a ${riskAssessment.risk_label.toLowerCase()} risk profile. ` +
    `${riskAssessment.risk_label === "Safe" ? "Standard dosing is recommended with routine monitoring." : 
      riskAssessment.risk_label === "Adjust Dosage" ? "Dose adjustment is recommended based on CPIC guidelines." :
      "Alternative therapy or specialized monitoring is strongly recommended."} ` +
    `Confidence in this assessment is ${(riskAssessment.confidence_score * 100).toFixed(0)}%.`;

  return explanation;
}

function generateKeyPoints(drug, phenotype, gene) {
  const points = [];
  
  if (drug && gene) {
    points.push(`${gene} ${phenotype} phenotype detected`);
    points.push(`${drug} dosing adjustment may be needed`);
    points.push("Consult CPIC guidelines for detailed recommendations");
  }
  
  return points;
}

function generateVariantImpact(variants) {
  if (!variants || variants.length === 0) {
    return "No variants detected";
  }

  return `${variants.length} pharmacogenomic variant(s) detected: ${
    variants.map(v => `${v.rsid} (${v.star})`).join(", ")
  }`;
}

module.exports = { formatResponse };