// Pharmacogenomics Engine (Node.js CommonJS)
"use strict";

const GENE_STAR_FUNCTION = {
    CYP2D6: {
        "*1": "normal", "*2": "normal", "*3": "no_function", "*4": "no_function",
        "*5": "no_function", "*6": "no_function", "*9": "decreased", "*10": "decreased",
        "*17": "decreased", "*41": "decreased", "*1xN": "increased", "*2xN": "increased",
    },
    CYP2C19: {
        "*1": "normal", "*2": "no_function", "*3": "no_function", "*17": "increased", "*35": "decreased",
    },
    CYP2C9: {
        "*1": "normal", "*2": "decreased", "*3": "no_function", "*5": "decreased",
        "*6": "no_function", "*8": "decreased", "*11": "decreased",
    },
    SLCO1B1: {
        "*1a": "normal", "*1b": "normal", "*5": "decreased", "*15": "decreased",
        "*17": "decreased", "*37": "no_function",
    },
    TPMT: {
        "*1": "normal", "*2": "no_function", "*3A": "no_function", "*3B": "no_function",
        "*3C": "no_function", "*4": "no_function",
    },
    DPYD: {
        "*1": "normal", "*2A": "no_function", "*13": "no_function",
        "c.2846A>T": "decreased", "HapB3": "decreased",
    },
};

const RSID_TO_VARIANT = {
    rs3892097: { gene: "CYP2D6", starAllele: "*4", function: "no_function", clinicalSig: "Loss of function" },
    rs35742686: { gene: "CYP2D6", starAllele: "*3", function: "no_function", clinicalSig: "Frameshift → no protein" },
    rs5030655: { gene: "CYP2D6", starAllele: "*6", function: "no_function", clinicalSig: "Frameshift → no protein" },
    rs1065852: { gene: "CYP2D6", starAllele: "*10", function: "decreased", clinicalSig: "Reduced enzyme activity (Pro34Ser)" },
    rs28371725: { gene: "CYP2D6", starAllele: "*41", function: "decreased", clinicalSig: "Splicing defect, reduced expression" },
    rs4986774: { gene: "CYP2D6", starAllele: "*17", function: "decreased", clinicalSig: "Reduced affinity for substrates" },
    rs4244285: { gene: "CYP2C19", starAllele: "*2", function: "no_function", clinicalSig: "Splice site defect" },
    rs4986893: { gene: "CYP2C19", starAllele: "*3", function: "no_function", clinicalSig: "Premature stop codon" },
    rs12248560: { gene: "CYP2C19", starAllele: "*17", function: "increased", clinicalSig: "Increased transcription" },
    rs1799853: { gene: "CYP2C9", starAllele: "*2", function: "decreased", clinicalSig: "Arg144Cys — reduced activity" },
    rs1057910: { gene: "CYP2C9", starAllele: "*3", function: "no_function", clinicalSig: "Ile359Leu — near-loss of function" },
    rs56165452: { gene: "CYP2C9", starAllele: "*5", function: "decreased", clinicalSig: "Reduced enzyme activity" },
    rs9923231: { gene: "VKORC1", starAllele: "-1639G>A", function: "decreased", clinicalSig: "Warfarin sensitivity marker" },
    rs4149056: { gene: "SLCO1B1", starAllele: "*5", function: "decreased", clinicalSig: "Reduced transporter activity (Val174Ala)" },
    rs2306283: { gene: "SLCO1B1", starAllele: "*1b", function: "normal", clinicalSig: "Common variant, normal function" },
    rs11045819: { gene: "SLCO1B1", starAllele: "*15", function: "decreased", clinicalSig: "Reduced hepatic uptake" },
    rs1800460: { gene: "TPMT", starAllele: "*3B", function: "no_function", clinicalSig: "Reduced enzyme activity" },
    rs1142345: { gene: "TPMT", starAllele: "*3C", function: "no_function", clinicalSig: "Major allele causing TPMT deficiency" },
    rs1800462: { gene: "TPMT", starAllele: "*2", function: "no_function", clinicalSig: "Ala80Pro substitution" },
    rs3918290: { gene: "DPYD", starAllele: "*2A", function: "no_function", clinicalSig: "IVS14+1G>A splice defect" },
    rs55886062: { gene: "DPYD", starAllele: "*13", function: "no_function", clinicalSig: "Ile560Ser" },
    rs67376798: { gene: "DPYD", starAllele: "c.2846A>T", function: "decreased", clinicalSig: "Asp949Val — reduced activity" },
};

const DRUG_GENE_RULES = {
    CODEINE: {
        primaryGene: "CYP2D6", secondaryGenes: [],
        cpicLevel: "A", cpicGuideline: "CPIC Guideline for Codeine and CYP2D6 (PMID: 24458010)",
        phenotypeRisk: {
            PM: { risk: "Ineffective", severity: "moderate", confidence: 0.93, dosing: "Codeine is NOT recommended. Poor metabolizers have minimal analgesia due to inability to convert codeine to morphine via CYP2D6.", alternatives: ["Morphine", "Oxycodone", "Hydromorphone"], monitoring: ["Pain scores", "Alternative opioid efficacy"], urgency: "High — select alternative analgesic" },
            IM: { risk: "Adjust Dosage", severity: "low", confidence: 0.82, dosing: "Use with caution at 75% of standard dose. Monitor for reduced efficacy.", alternatives: ["Tramadol (with caution)", "Morphine low dose"], monitoring: ["Pain control", "Sedation level"], urgency: "Moderate" },
            NM: { risk: "Safe", severity: "none", confidence: 0.91, dosing: "Standard dosing per clinical guidelines.", alternatives: [], monitoring: ["Standard pain monitoring"], urgency: "Routine" },
            RM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.88, dosing: "Rapid metabolizer — increased morphine conversion. Reduce dose by 25%.", alternatives: ["Non-opioid analgesics"], monitoring: ["Morphine levels", "Respiratory depression"], urgency: "High" },
            URM: { risk: "Toxic", severity: "critical", confidence: 0.97, dosing: "CONTRAINDICATED. Ultra-rapid metabolizers convert codeine to morphine at toxic rates. Life-threatening respiratory depression reported.", alternatives: ["Morphine", "Hydromorphone", "Non-opioid analgesics"], monitoring: ["IMMEDIATE: Respiratory rate", "O2 saturation", "Sedation"], urgency: "CRITICAL — Do not prescribe" },
            Unknown: { risk: "Unknown", severity: "low", confidence: 0.45, dosing: "Genotype inconclusive. Standard dosing with enhanced monitoring.", alternatives: [], monitoring: ["Standard monitoring"], urgency: "Low" },
        },
    },
    WARFARIN: {
        primaryGene: "CYP2C9", secondaryGenes: ["VKORC1"],
        cpicLevel: "A", cpicGuideline: "CPIC Guideline for Warfarin and CYP2C9/VKORC1 (PMID: 21900891)",
        phenotypeRisk: {
            PM: { risk: "Adjust Dosage", severity: "high", confidence: 0.94, dosing: "Significant dose reduction required (40–90% of standard). INR monitoring essential.", alternatives: ["Dabigatran", "Rivaroxaban", "Apixaban"], monitoring: ["INR daily×7 days then weekly", "Bleeding signs"], urgency: "High — dose reduction mandatory" },
            IM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.89, dosing: "Reduce starting dose by 25–50%. Frequent INR monitoring required.", alternatives: ["DOACs if bleeding risk high"], monitoring: ["INR 2×/week initial"], urgency: "Moderate" },
            NM: { risk: "Safe", severity: "none", confidence: 0.88, dosing: "Standard dosing. Target INR 2–3 for most indications.", alternatives: [], monitoring: ["Monthly INR when stable"], urgency: "Routine" },
            RM: { risk: "Adjust Dosage", severity: "low", confidence: 0.75, dosing: "May require slightly higher doses. Monitor INR.", alternatives: [], monitoring: ["INR monitoring"], urgency: "Low" },
            URM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.80, dosing: "Higher warfarin dose may be needed. Monitor INR closely.", alternatives: ["DOACs"], monitoring: ["Frequent INR"], urgency: "Moderate" },
            Unknown: { risk: "Unknown", severity: "low", confidence: 0.50, dosing: "Start with low dose. Frequent INR monitoring.", alternatives: [], monitoring: ["INR monitoring"], urgency: "Moderate" },
        },
    },
    CLOPIDOGREL: {
        primaryGene: "CYP2C19", secondaryGenes: [],
        cpicLevel: "A", cpicGuideline: "CPIC Guideline for Clopidogrel and CYP2C19 (PMID: 22205192)",
        phenotypeRisk: {
            PM: { risk: "Ineffective", severity: "high", confidence: 0.95, dosing: "Clopidogrel is NOT effective. Cannot convert to active metabolite. High MACE risk.", alternatives: ["Prasugrel", "Ticagrelor (preferred)"], monitoring: ["Platelet aggregation", "MACE events"], urgency: "CRITICAL — Use alternative antiplatelet agent" },
            IM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.87, dosing: "Consider alternative. If used, platelet function testing recommended.", alternatives: ["Ticagrelor", "Prasugrel"], monitoring: ["Platelet function testing"], urgency: "High" },
            NM: { risk: "Safe", severity: "none", confidence: 0.90, dosing: "Standard clopidogrel dosing (75mg/day).", alternatives: [], monitoring: ["Standard cardiac monitoring"], urgency: "Routine" },
            RM: { risk: "Safe", severity: "none", confidence: 0.85, dosing: "Standard dosing. Enhanced antiplatelet effect.", alternatives: [], monitoring: ["Bleeding risk assessment"], urgency: "Routine" },
            URM: { risk: "Adjust Dosage", severity: "low", confidence: 0.78, dosing: "Monitor for increased bleeding.", alternatives: [], monitoring: ["Bleeding signs", "Platelet function"], urgency: "Low-Moderate" },
            Unknown: { risk: "Unknown", severity: "low", confidence: 0.50, dosing: "Standard dosing with platelet function testing.", alternatives: [], monitoring: ["Platelet aggregation studies"], urgency: "Moderate" },
        },
    },
    SIMVASTATIN: {
        primaryGene: "SLCO1B1", secondaryGenes: [],
        cpicLevel: "A", cpicGuideline: "CPIC Guideline for Simvastatin and SLCO1B1 (PMID: 24918167)",
        phenotypeRisk: {
            PM: { risk: "Toxic", severity: "high", confidence: 0.91, dosing: "HIGH RISK of statin-induced myopathy. Switch to alternative statin.", alternatives: ["Pravastatin", "Rosuvastatin", "Fluvastatin"], monitoring: ["CK levels", "Muscle pain/weakness", "Rhabdomyolysis symptoms"], urgency: "High — switch statin" },
            IM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.86, dosing: "Reduce to simvastatin ≤20mg/day or switch to low-risk statin.", alternatives: ["Pravastatin 40mg", "Rosuvastatin 10mg"], monitoring: ["CK at baseline and 3 months"], urgency: "Moderate — reduce dose or switch" },
            NM: { risk: "Safe", severity: "none", confidence: 0.89, dosing: "Standard simvastatin dosing (up to 40mg/day).", alternatives: [], monitoring: ["Annual CK and LFTs"], urgency: "Routine" },
            RM: { risk: "Safe", severity: "none", confidence: 0.82, dosing: "Standard dosing.", alternatives: [], monitoring: ["Standard lipid monitoring"], urgency: "Routine" },
            URM: { risk: "Safe", severity: "none", confidence: 0.75, dosing: "Standard dosing.", alternatives: [], monitoring: ["Standard monitoring"], urgency: "Routine" },
            Unknown: { risk: "Unknown", severity: "low", confidence: 0.50, dosing: "Standard or low simvastatin dose with CK monitoring.", alternatives: [], monitoring: ["CK monitoring"], urgency: "Low" },
        },
    },
    AZATHIOPRINE: {
        primaryGene: "TPMT", secondaryGenes: [],
        cpicLevel: "A", cpicGuideline: "CPIC Guideline for Thiopurines and TPMT (PMID: 21270794)",
        phenotypeRisk: {
            PM: { risk: "Toxic", severity: "critical", confidence: 0.97, dosing: "TPMT deficient — CONTRAINDICATED at standard doses. Life-threatening myelosuppression.", alternatives: ["Mycophenolate", "Cyclosporine"], monitoring: ["WEEKLY CBC×8 weeks", "Bone marrow function"], urgency: "CRITICAL — Consult hematology before initiation" },
            IM: { risk: "Adjust Dosage", severity: "high", confidence: 0.92, dosing: "Reduce starting dose by 30–70%. Close hematologic monitoring.", alternatives: ["Mycophenolate mofetil"], monitoring: ["CBC every 2 weeks×3 months, then monthly"], urgency: "High — dose reduction required" },
            NM: { risk: "Safe", severity: "none", confidence: 0.90, dosing: "Standard azathioprine dosing (1.5–2.5 mg/kg/day).", alternatives: [], monitoring: ["CBC monthly", "LFTs quarterly"], urgency: "Routine" },
            RM: { risk: "Safe", severity: "none", confidence: 0.85, dosing: "Standard dosing.", alternatives: [], monitoring: ["Standard hematologic monitoring"], urgency: "Routine" },
            URM: { risk: "Safe", severity: "none", confidence: 0.80, dosing: "Standard or slightly higher dose.", alternatives: [], monitoring: ["Standard monitoring"], urgency: "Routine" },
            Unknown: { risk: "Unknown", severity: "moderate", confidence: 0.55, dosing: "Conservative starting dose. Consider enzyme testing.", alternatives: [], monitoring: ["Weekly CBC×4 weeks"], urgency: "Moderate" },
        },
    },
    FLUOROURACIL: {
        primaryGene: "DPYD", secondaryGenes: [],
        cpicLevel: "A", cpicGuideline: "CPIC Guideline for Fluoropyrimidines and DPYD (PMID: 23988590)",
        phenotypeRisk: {
            PM: { risk: "Toxic", severity: "critical", confidence: 0.98, dosing: "DPYD deficient — CONTRAINDICATED. Fatal fluorouracil toxicity: severe mucositis, diarrhea, myelosuppression.", alternatives: ["Alternative chemotherapy per oncologist"], monitoring: ["Immediate: CBC, LFTs, GI symptoms"], urgency: "CRITICAL — Do not administer" },
            IM: { risk: "Adjust Dosage", severity: "high", confidence: 0.93, dosing: "Reduce starting dose by 50%. DPD-deficient patients require significant dose reduction.", alternatives: ["Reduce dose 25–50% depending on variant"], monitoring: ["CBC every cycle", "Mucositis assessment"], urgency: "High — mandatory dose reduction" },
            NM: { risk: "Safe", severity: "none", confidence: 0.88, dosing: "Standard fluorouracil dosing per oncology regimen.", alternatives: [], monitoring: ["Standard oncology monitoring"], urgency: "Routine" },
            RM: { risk: "Safe", severity: "none", confidence: 0.82, dosing: "Standard dosing.", alternatives: [], monitoring: ["Standard oncology monitoring"], urgency: "Routine" },
            URM: { risk: "Safe", severity: "none", confidence: 0.78, dosing: "Standard dosing.", alternatives: [], monitoring: ["Standard monitoring"], urgency: "Routine" },
            Unknown: { risk: "Unknown", severity: "moderate", confidence: 0.60, dosing: "50% dose if testing unavailable.", alternatives: [], monitoring: ["CBC every cycle", "Toxicity surveillance"], urgency: "Moderate" },
        },
    },
};

function getStarFunction(star, gene) {
    return GENE_STAR_FUNCTION[gene] && GENE_STAR_FUNCTION[gene][star]
        ? GENE_STAR_FUNCTION[gene][star]
        : "normal";
}

function derivePhenotype(fn1, fn2, gene) {
    const score1 = fn1 === "no_function" ? 0 : fn1 === "decreased" ? 0.5 : fn1 === "increased" ? 2 : 1;
    const score2 = fn2 === "no_function" ? 0 : fn2 === "decreased" ? 0.5 : fn2 === "increased" ? 2 : 1;
    const total = score1 + score2;
    if (total === 0) return "PM";
    if (total > 0 && total <= 1) return "IM";
    if (total === 2) return "NM";
    if (total > 2) return "URM";
    return "NM";
}

function detectVariantsForGene(variants, gene) {
    return variants.filter(
        (v) =>
            (v.gene && v.gene.toUpperCase() === gene.toUpperCase()) ||
            (v.rsid && RSID_TO_VARIANT[v.rsid] && RSID_TO_VARIANT[v.rsid].gene === gene)
    );
}

function inferDiplotype(geneVariants, gene) {
    if (geneVariants.length === 0) return { diplotype: "*1/*1", allele1: "*1", allele2: "*1" };

    const stars = [];
    for (const v of geneVariants) {
        let sa = v.starAllele && v.starAllele !== "." ? v.starAllele
            : v.rsid && RSID_TO_VARIANT[v.rsid] ? RSID_TO_VARIANT[v.rsid].starAllele
                : null;
        if (!sa) continue;
        if (v.zygosity === "homozygous_alt") {
            return { diplotype: `${sa}/${sa}`, allele1: sa, allele2: sa };
        }
        stars.push(sa);
    }

    if (stars.length === 0) return { diplotype: "*1/*1", allele1: "*1", allele2: "*1" };
    if (stars.length === 1) return { diplotype: `${stars[0]}/*1`, allele1: stars[0], allele2: "*1" };
    return { diplotype: `${stars[0]}/${stars[1]}`, allele1: stars[0], allele2: stars[1] };
}

function buildDetectedVariants(geneVariants, secondaryVariants, gene) {
    return [...geneVariants, ...secondaryVariants].map((v) => {
        const known = v.rsid ? RSID_TO_VARIANT[v.rsid] : null;
        return {
            rsid: v.rsid || v.id || ".",
            gene: v.gene || gene,
            star_allele: v.starAllele || (known && known.starAllele) || ".",
            chromosome: v.chromosome,
            position: v.position,
            ref: v.ref,
            alt: v.alt,
            zygosity: v.zygosity,
            clinical_significance: (known && known.clinicalSig) || "Variant of uncertain significance",
        };
    });
}

function analyzeDrug(parsedVcf, drug) {
    const drugUpper = drug.toUpperCase().trim();
    const rule = DRUG_GENE_RULES[drugUpper];

    if (!rule) {
        return {
            patientId: parsedVcf.patientId,
            drug: drugUpper,
            pharmProfile: { primaryGene: "Unknown", diplotype: "Unknown", phenotype: "Unknown", detectedVariants: [], allGenesAssessed: [] },
            riskAssessment: { riskLabel: "Unknown", confidenceScore: 0.1, severity: "none", riskFactors: [`Drug "${drug}" is not supported`] },
            clinicalRecommendation: { dosingRecommendation: "Drug not supported. Consult pharmacist.", alternativeDrugs: [], monitoringRequired: [], cpicLevel: "N/A", cpicGuideline: "N/A", urgency: "Refer to clinical pharmacist" },
        };
    }

    const gene = rule.primaryGene;
    const geneVariants = detectVariantsForGene(parsedVcf.variants, gene);
    let secondaryVariants = [];
    for (const sg of rule.secondaryGenes) {
        secondaryVariants = secondaryVariants.concat(detectVariantsForGene(parsedVcf.variants, sg));
    }

    const { diplotype, allele1, allele2 } = inferDiplotype(geneVariants, gene);
    const fn1 = getStarFunction(allele1, gene);
    const fn2 = getStarFunction(allele2, gene);
    const phenotype = derivePhenotype(fn1, fn2, gene);
    const riskData = rule.phenotypeRisk[phenotype] || rule.phenotypeRisk["Unknown"];
    const detectedVariants = buildDetectedVariants(geneVariants, secondaryVariants, gene);

    const riskFactors = [];
    if (phenotype === "PM") riskFactors.push("Poor metabolizer — zero or minimal enzyme activity");
    if (phenotype === "IM") riskFactors.push("Intermediate metabolizer — reduced enzyme activity");
    if (phenotype === "URM") riskFactors.push("Ultra-rapid metabolizer — significantly elevated enzyme activity");
    if (geneVariants.length > 0) riskFactors.push(`${geneVariants.length} pharmacogenomic variant(s) detected in ${gene}`);
    if (detectedVariants.some((v) => v.zygosity === "homozygous_alt")) riskFactors.push("Homozygous variant(s) detected — compound effect on enzyme activity");

    return {
        patientId: parsedVcf.patientId,
        drug: drugUpper,
        pharmProfile: {
            primaryGene: gene,
            diplotype,
            phenotype,
            detectedVariants,
            allGenesAssessed: [gene, ...rule.secondaryGenes],
        },
        riskAssessment: {
            riskLabel: riskData.risk,
            confidenceScore: riskData.confidence,
            severity: riskData.severity,
            riskFactors,
        },
        clinicalRecommendation: {
            dosingRecommendation: riskData.dosing,
            alternativeDrugs: riskData.alternatives,
            monitoringRequired: riskData.monitoring,
            cpicLevel: rule.cpicLevel,
            cpicGuideline: rule.cpicGuideline,
            urgency: riskData.urgency,
        },
    };
}

module.exports = { analyzeDrug, DRUG_GENE_RULES, RSID_TO_VARIANT };
