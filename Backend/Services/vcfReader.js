function readVCF(content) {
  const lines = content.split("\n");

  const variantLines = [];
  let vcfVersionValid = false;

  for (let line of lines) {
    line = line.trim();

    if (line.startsWith("##fileformat=VCFv4.2")) {
      vcfVersionValid = true;
    }

    if (line.startsWith("#")) continue;
    if (!line) continue;

    variantLines.push(line);
  }

  return {
    vcfVersionValid,
    variantLines
  };
}

module.exports = { readVCF };