// VCF Parser — Variant Call Format v4.2 (Node.js CommonJS)
"use strict";

const PHARM_GENES = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"];

function parseInfoField(infoStr) {
    const result = {};
    if (!infoStr || infoStr === ".") return result;
    for (const part of infoStr.split(";")) {
        const eqIdx = part.indexOf("=");
        if (eqIdx >= 0) {
            result[part.slice(0, eqIdx)] = part.slice(eqIdx + 1);
        } else {
            result[part] = "true";
        }
    }
    return result;
}

function parseGenotype(gtField) {
    if (!gtField) return "unknown";
    const gt = gtField.split(":")[0];
    const alleles = gt.split(/[|/]/);
    if (alleles.length < 2) return "unknown";
    if (alleles[0] === "." || alleles[1] === ".") return "unknown";
    if (alleles[0] === "0" && alleles[1] === "0") return "homozygous_ref";
    if (alleles[0] !== "0" && alleles[1] !== "0") return "homozygous_alt";
    return "heterozygous";
}

function parseVcf(content) {
    const result = {
        patientId: "PATIENT_001",
        sampleName: "SAMPLE",
        variants: [],
        metadata: {},
        rawHeaders: [],
        parseSuccess: false,
        variantCount: 0,
        pharmGenes: [],
    };

    try {
        const lines = content.split("\n").map((l) => l.trim());
        let hasColumnHeader = false;

        for (const line of lines) {
            if (!line) continue;

            if (line.startsWith("##")) {
                result.rawHeaders.push(line);
                const m = line.match(/^##(.+?)=(.+)$/);
                if (m) {
                    const key = m[1];
                    const val = m[2];
                    if (key === "SAMPLE") {
                        const idMatch = val.match(/ID=([^,>]+)/);
                        if (idMatch) {
                            result.patientId = `PATIENT_${idMatch[1].replace(/[^a-zA-Z0-9]/g, "_")}`;
                            result.sampleName = idMatch[1];
                        }
                    }
                }
                continue;
            }

            if (line.startsWith("#CHROM")) {
                hasColumnHeader = true;
                const sampleColumns = line.slice(1).split("\t");
                if (sampleColumns.length > 9) {
                    const lastSample = sampleColumns[sampleColumns.length - 1];
                    result.sampleName = lastSample;
                    result.patientId = `PATIENT_${lastSample.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
                }
                continue;
            }

            if (line.startsWith("#")) continue;

            const cols = line.split("\t");
            if (cols.length < 8) continue;

            const [chrom, posStr, id, ref, alt, qual, filter, infoStr] = cols;
            const formatStr = cols[8] || "";
            const sampleStr = cols[9] || "";

            const info = parseInfoField(infoStr);
            const gene = info["GENE"] || "";
            const starAllele = info["STAR"] || "";
            const rsid = info["RS"] ? `rs${info["RS"]}` : id !== "." ? id : "";

            const formatKeys = formatStr.split(":");
            const sampleVals = sampleStr.split(":");
            const gtIdx = formatKeys.indexOf("GT");
            const gtValue = gtIdx >= 0 ? sampleVals[gtIdx] : sampleStr.split(":")[0];
            const zygosity = parseGenotype(gtValue);

            result.variants.push({
                chromosome: chrom,
                position: parseInt(posStr, 10),
                id,
                ref,
                alt,
                qual,
                filter,
                info,
                gene,
                starAllele,
                rsid,
                zygosity,
                genotype: gtValue || "unknown",
            });
        }

        const geneSet = new Set();
        for (const v of result.variants) {
            if (v.gene && PHARM_GENES.includes(v.gene.toUpperCase())) {
                geneSet.add(v.gene.toUpperCase());
            }
        }
        result.pharmGenes = Array.from(geneSet);
        result.variantCount = result.variants.length;
        result.parseSuccess = result.variants.length > 0;

        if (result.variants.length === 0) {
            result.errorMessage = "No variant records found in VCF file.";
        }
    } catch (err) {
        result.parseSuccess = false;
        result.errorMessage = `Parse error: ${err.message}`;
    }

    return result;
}

function validateVcfContent(content) {
    if (!content || content.trim().length === 0) {
        return { valid: false, error: "File is empty" };
    }
    if (!content.includes("#CHROM") && !content.includes("##fileformat")) {
        return { valid: false, error: "File does not appear to be a valid VCF (missing #CHROM header)" };
    }
    return { valid: true };
}

module.exports = { parseVcf, validateVcfContent };
