// Netlify Serverless Function — POST /api/analyze (via redirect)
"use strict";

const { parseVcf, validateVcfContent } = require("../../lib/vcfParser.js");
const { analyzeDrug } = require("../../lib/pharmEngine.js");
const { generateExplanation } = require("../../lib/llmExplainer.js");

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
};

exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: CORS_HEADERS, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Method not allowed. Use POST." }),
        };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const { vcfContent, drugs } = body;

        if (!vcfContent || typeof vcfContent !== "string" || vcfContent.trim().length === 0) {
            return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "vcfContent is required" }) };
        }
        if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
            return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "drugs array is required" }) };
        }
        if (vcfContent.length > 5 * 1024 * 1024) {
            return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "VCF content exceeds 5 MB" }) };
        }

        const validation = validateVcfContent(vcfContent);
        if (!validation.valid) {
            return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: `Invalid VCF: ${validation.error}` }) };
        }

        const parsedVcf = parseVcf(vcfContent);
        if (!parsedVcf.parseSuccess && parsedVcf.variants.length === 0) {
            return { statusCode: 422, headers: CORS_HEADERS, body: JSON.stringify({ error: parsedVcf.errorMessage || "Could not parse VCF" }) };
        }

        const timestamp = new Date().toISOString();
        const apiKey = process.env.GEMINI_API_KEY || "";

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

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                patient_id: parsedVcf.patientId,
                total_drugs_analyzed: results.length,
                results,
                vcf_metadata: {
                    sample_name: parsedVcf.sampleName,
                    total_variants: parsedVcf.variantCount,
                    pharma_genes_detected: parsedVcf.pharmGenes,
                },
            }),
        };
    } catch (err) {
        console.error("Analysis error:", err);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal server error", details: err.message }),
        };
    }
};
