const TARGET_GENES = [
  "CYP2D6",
  "CYP2C19",
  "CYP2C9",
  "SLCO1B1",
  "TPMT",
  "DPYD"
];

function extractGenes(variantLines) {
  const pharmacogenes = {};
  TARGET_GENES.forEach(g => pharmacogenes[g] = []);

  let totalVariants = 0;
  let relevantVariants = 0;

  for (let line of variantLines) {
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

    if (gene && TARGET_GENES.includes(gene)) {
      relevantVariants++;

      pharmacogenes[gene].push({
        rsid: rsid || "Unknown",
        star: star || "Unknown"
      });
    }
  }

  return {
    pharmacogenes,
    totalVariants,
    relevantVariants
  };
}

module.exports = { extractGenes };