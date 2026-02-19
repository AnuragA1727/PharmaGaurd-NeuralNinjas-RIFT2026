// LLM Explainer (Node.js CommonJS) — Gemini 1.5 Flash + rule-based fallback
"use strict";

const GENE_MECHANISM = {
    CYP2D6: "CYP2D6 encodes the cytochrome P450 2D6 enzyme, responsible for metabolizing ~25% of clinically used drugs. Genetic variants reduce, eliminate, or amplify enzyme activity, directly altering drug plasma concentrations and clinical response.",
    CYP2C19: "CYP2C19 encodes a hepatic cytochrome P450 enzyme critical for activating prodrugs like clopidogrel and metabolizing proton pump inhibitors. Loss-of-function variants prevent prodrug bioactivation, rendering them ineffective.",
    CYP2C9: "CYP2C9 is the primary enzyme metabolizing warfarin's S-enantiomer. Reduced-function variants decrease warfarin clearance, dramatically elevating bleeding risk at standard doses.",
    SLCO1B1: "SLCO1B1 encodes the hepatic uptake transporter OATP1B1, responsible for liver extraction of statins from plasma. Transporter dysfunction leads to elevated systemic statin concentrations, increasing myopathy and rhabdomyolysis risk.",
    TPMT: "TPMT (thiopurine S-methyltransferase) detoxifies thiopurine drugs via methylation. Deficient TPMT activity diverts thiopurines into cytotoxic thioguanine nucleotides (TGNs), causing severe bone marrow suppression.",
    DPYD: "DPYD encodes dihydropyrimidine dehydrogenase, the primary catabolic enzyme for fluoropyrimidines. DPYD deficiency allows toxic fluorouracil accumulation, causing life-threatening mucositis, diarrhea, and neutropenia.",
};

const PHENOTYPE_DESCRIPTION = {
    PM: "Poor Metabolizer — Complete or near-complete loss of enzyme/transporter function.",
    IM: "Intermediate Metabolizer — One functional and one non-functional allele, resulting in reduced activity.",
    NM: "Normal Metabolizer — Two functional alleles, normal enzyme activity expected.",
    RM: "Rapid Metabolizer — Enhanced enzyme activity from increased-function alleles.",
    URM: "Ultra-Rapid Metabolizer — Markedly elevated enzyme activity, often from gene duplication.",
    Unknown: "Phenotype could not be determined from available genotype data.",
};

function generateRuleBasedExplanation(pharmResult) {
    const { pharmProfile, riskAssessment, clinicalRecommendation, drug } = pharmResult;
    const gene = pharmProfile.primaryGene;
    const phenotype = pharmProfile.phenotype;
    const risk = riskAssessment.riskLabel;
    const diplotype = pharmProfile.diplotype;

    const mechanism = GENE_MECHANISM[gene] || `${gene} plays a critical pharmacogenomic role in drug metabolism for ${drug}.`;
    const phenotypeDesc = PHENOTYPE_DESCRIPTION[phenotype] || `Phenotype: ${phenotype}`;
    const variantStr = pharmProfile.detectedVariants.length > 0
        ? pharmProfile.detectedVariants.map((v) => `${v.rsid} (${v.star_allele}, ${v.zygosity})`).join(", ")
        : "No specific pharmacogenomic variants detected";

    return {
        summary: `Patient carries the ${gene} diplotype ${diplotype}, classifying them as a ${phenotype}. For ${drug}, this results in a risk classification of "${risk}" with ${(riskAssessment.confidenceScore * 100).toFixed(0)}% confidence.`,
        mechanism: `${mechanism} The detected diplotype ${diplotype} (${phenotypeDesc}) affects the enzyme's capacity to process ${drug}. Variants detected: ${variantStr}.`,
        clinical_significance: `${riskAssessment.riskFactors.join(". ")}. ${clinicalRecommendation.dosingRecommendation}`,
        monitoring_parameters: clinicalRecommendation.monitoringRequired.join("; ") || "Standard clinical monitoring",
        patient_friendly_summary: `Your genetic profile shows that your body ${phenotype === "PM" ? "processes this medication very slowly or not at all"
                : phenotype === "IM" ? "processes this medication more slowly than average"
                    : phenotype === "URM" ? "processes this medication much faster than normal"
                        : "processes this medication normally"
            }. This means ${risk === "Toxic" ? `${drug} could build up to harmful levels and is not recommended for you`
                : risk === "Ineffective" ? `${drug} may not work effectively and an alternative should be considered`
                    : risk === "Adjust Dosage" ? `your doctor should adjust the dose of ${drug} for your genetic profile`
                        : `${drug} is expected to work normally for you at standard doses`
            }.`,
        references: [
            clinicalRecommendation.cpicGuideline,
            "PharmGKB Pharmacogenomics Knowledge Base (www.pharmgkb.org)",
            `FDA Table of Pharmacogenomic Biomarkers — ${gene}`,
            "Clinical Pharmacogenetics Implementation Consortium (CPIC) Guidelines",
        ],
        generated_by: "rule-based",
    };
}

async function generateGeminiExplanation(pharmResult, apiKey) {
    const { pharmProfile, riskAssessment, clinicalRecommendation, drug } = pharmResult;

    const prompt = `You are a clinical pharmacogenomics specialist. Generate a structured clinical explanation for the following result. Return ONLY valid JSON, no markdown, no extra text.

Patient Result:
- Drug: ${drug}
- Primary Gene: ${pharmProfile.primaryGene}
- Diplotype: ${pharmProfile.diplotype}
- Phenotype: ${pharmProfile.phenotype}
- Risk Label: ${riskAssessment.riskLabel}
- Severity: ${riskAssessment.severity}
- Confidence: ${(riskAssessment.confidenceScore * 100).toFixed(0)}%
- Detected Variants: ${pharmProfile.detectedVariants.map((v) => `${v.rsid} (${v.star_allele})`).join(", ") || "None"}
- Dosing Recommendation: ${clinicalRecommendation.dosingRecommendation}
- CPIC Guideline: ${clinicalRecommendation.cpicGuideline}

Return:
{"summary":"2-3 sentence clinical summary","mechanism":"Detailed biological mechanism (3-4 sentences)","clinical_significance":"Clinical significance for this patient","monitoring_parameters":"Specific monitoring recommendations","patient_friendly_summary":"Plain language explanation for patient"}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            }),
        }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
        summary: parsed.summary ?? "",
        mechanism: parsed.mechanism ?? "",
        clinical_significance: parsed.clinical_significance ?? "",
        monitoring_parameters: parsed.monitoring_parameters ?? "",
        patient_friendly_summary: parsed.patient_friendly_summary ?? "",
        references: [
            clinicalRecommendation.cpicGuideline,
            "Google Gemini 1.5 Flash — AI-generated clinical explanation",
            "PharmGKB Knowledge Base",
        ],
        generated_by: "gemini",
    };
}

async function generateExplanation(pharmResult, apiKey) {
    if (apiKey && apiKey.length > 10) {
        try {
            return await generateGeminiExplanation(pharmResult, apiKey);
        } catch (err) {
            console.warn("Gemini API failed, using rule-based fallback:", err.message);
        }
    }
    return generateRuleBasedExplanation(pharmResult);
}

module.exports = { generateExplanation };
