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

function formatResponse(data, versionValid) {
  const formattedGenes = {};

  for (let gene in data.pharmacogenes) {
    const variants = data.pharmacogenes[gene];

    if (variants.length > 0) {
      formattedGenes[gene] = {
        diplotype: buildDiplotype(variants),
        detected_variants: variants
      };
    }
  }

  return {
    pharmacogenomic_profile: formattedGenes,
    quality_metrics: {
      vcf_parsing_success: true,
      vcf_version_valid: versionValid,
      total_variants_found: data.totalVariants,
      relevant_pharmacogenomic_variants: data.relevantVariants
    }
  };
}

module.exports = { formatResponse };