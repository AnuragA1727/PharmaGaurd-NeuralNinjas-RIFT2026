// Vercel Serverless Function — POST /api/analyze
// Accepts: { vcfContent: string, drugs: string[] }
// Returns: PharmaGuard JSON schema
"use strict";

const { parseVcf, validateVcfContent } = require("../lib/vcfParser.js");
const { analyzeDrug } = require("../lib/pharmEngine.js");
const { generateExplanation } = require("../lib/llmExplainer.js");

module.exports = async function handler(req, res) {
    // CORS headers for browser access
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    try {
        const { vcfContent, drugs } = req.body;

        if (!vcfContent || typeof vcfContent !== "string" || vcfContent.trim().length === 0) {
            return res.status(400).json({ error: "vcfContent is required (string)" });
        }
        if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
            return res.status(400).json({ error: "drugs array is required and must not be empty" });
        }
        if (vcfContent.length > 5 * 1024 * 1024) {
            return res.status(400).json({ error: "VCF content exceeds 5 MB limit" });
        }

        // Validate VCF
        const validation = validateVcfContent(vcfContent);
        if (!validation.valid) {
            return res.status(400).json({ error: `Invalid VCF: ${validation.error}` });
        }

        // Parse VCF
        const parsedVcf = parseVcf(vcfContent);
        if (!parsedVcf.parseSuccess && parsedVcf.variants.length === 0) {
            return res.status(422).json({
                error: parsedVcf.errorMessage || "Could not parse VCF file",
                hint: "Ensure the file contains variant data lines following the #CHROM header",
            });
        }

        const timestamp = new Date().toISOString();
        const apiKey = process.env.GEMINI_API_KEY || "";

        // Analyze each drug
        const results = await Promise.all(
            drugs.map(async (drug) => {
                const pharmResult = analyzeDrug(parsedVcf, drug.toUpperCase().trim());
                const llmExplanation = await generateExplanation(pharmResult, apiKey);

                return {
                    patient_id: parsedVcf.patientId,
                    drug: pharmResult.drug,
                    timestamp,
                    risk_assessment: {
                        risk_label: pharmResult.riskAssessment.riskLabel,
                        confidence_score: pharmResult.riskAssessment.confidenceScore,
                        severity: pharmResult.riskAssessment.severity,
                        risk_factors: pharmResult.riskAssessment.riskFactors,
                    },
                    pharmacogenomic_profile: {
                        primary_gene: pharmResult.pharmProfile.primaryGene,
                        diplotype: pharmResult.pharmProfile.diplotype,
                        phenotype: pharmResult.pharmProfile.phenotype,
                        detected_variants: pharmResult.pharmProfile.detectedVariants,
                        all_genes_assessed: pharmResult.pharmProfile.allGenesAssessed,
                    },
                    clinical_recommendation: {
                        dosing_recommendation: pharmResult.clinicalRecommendation.dosingRecommendation,
                        alternative_drugs: pharmResult.clinicalRecommendation.alternativeDrugs,
                        monitoring_required: pharmResult.clinicalRecommendation.monitoringRequired,
                        cpic_level: pharmResult.clinicalRecommendation.cpicLevel,
                        cpic_guideline: pharmResult.clinicalRecommendation.cpicGuideline,
                        urgency: pharmResult.clinicalRecommendation.urgency,
                    },
                    llm_generated_explanation: llmExplanation,
                    quality_metrics: {
                        vcf_parsing_success: parsedVcf.parseSuccess,
                        total_variants_in_vcf: parsedVcf.variantCount,
                        pharmacogenomic_genes_found: parsedVcf.pharmGenes,
                        variants_for_this_drug_gene: pharmResult.pharmProfile.detectedVariants.length,
                        llm_explanation_generated: true,
                        analysis_version: "PharmaGuard v1.0.0",
                    },
                };
            })
        );

        return res.status(200).json({
            success: true,
            patient_id: parsedVcf.patientId,
            total_drugs_analyzed: results.length,
            results,
            vcf_metadata: {
                sample_name: parsedVcf.sampleName,
                total_variants: parsedVcf.variantCount,
                pharma_genes_detected: parsedVcf.pharmGenes,
            },
        });
    } catch (err) {
        console.error("Analysis error:", err);
        return res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};
