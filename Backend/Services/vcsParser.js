function parseVCF(fileContent) {
  const lines = fileContent.split("\n");

  const pharmacogenes = {
    CYP2D6: [],
    CYP2C19: [],
    CYP2C9: [],
    SLCO1B1: [],
    TPMT: [],
    DPYD: []
  };

  let totalVariants = 0;
  let relevantVariants = 0;
  let vcfVersionValid = false;

  for (let line of lines) {
    line = line.trim();

    if (line.startsWith("##fileformat=VCFv4.2")) {
      vcfVersionValid = true;
    }

    if (line.startsWith("#")) continue;
    if (!line) continue;

    totalVariants++;

    const columns = line.split("\t");
    if (columns.length < 8) continue;

    const id = columns[2];
    const info = columns[7];

    let gene = null;
    let star = null;
    let rsid = id && id.startsWith("rs") ? id : null;

    const infoParts = info.split(";");

    for (let part of infoParts) {
      if (part.startsWith("GENE=")) {
        gene = part.split("=")[1];
      }
      if (part.startsWith("STAR=")) {
        star = part.split("=")[1];
      }
      if (part.startsWith("RS=")) {
        rsid = part.split("=")[1];
      }
    }

    if (gene && pharmacogenes[gene]) {
      relevantVariants++;

      pharmacogenes[gene].push({
        rsid: rsid || "Unknown",
        star: star || "Unknown"
      });
    }
  }

  const formattedGenes = {};

  for (let gene in pharmacogenes) {
    if (pharmacogenes[gene].length > 0) {

      const stars = pharmacogenes[gene]
        .map(v => v.star)
        .filter(s => s !== "Unknown")
        .sort();

      const diplotype = stars.length >= 2
        ? `${stars[0]}/${stars[1]}`
        : stars.length === 1
        ? `${stars[0]}/Unknown`
        : "Unknown";

      formattedGenes[gene] = {
        diplotype,
        detected_variants: pharmacogenes[gene]
      };
    }
  }

  return {
    pharmacogenomic_profile: formattedGenes,
    quality_metrics: {
      vcf_parsing_success: true,
      vcf_version_valid: vcfVersionValid,
      total_variants_found: totalVariants,
      relevant_pharmacogenomic_variants: relevantVariants
    }
  };
}

module.exports = { parseVCF };