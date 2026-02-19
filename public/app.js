// PharmaGuard — Frontend Application (Vanilla JS)
"use strict";

// ─── Sample VCF Data ──────────────────────────────────────────────────────────
const SAMPLE_VCF_DATA = {
    "CYP2D6": `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele">
##INFO=<ID=RS,Number=1,Type=String,Description="rsID without rs prefix">
##SAMPLE=<ID=PM_PATIENT_001,Description="CYP2D6 Poor Metabolizer">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	PM_PATIENT_001
chr22	42526694	rs3892097	G	A	99	PASS	GENE=CYP2D6;STAR=*4;RS=3892097	GT:DP:GQ	1/1:45:99
chr22	42524947	rs1065852	C	T	88	PASS	GENE=CYP2D6;STAR=*10;RS=1065852	GT:DP:GQ	0/1:38:88`,
    "CYP2C19": `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele">
##INFO=<ID=RS,Number=1,Type=String,Description="rsID without rs prefix">
##SAMPLE=<ID=PM_PATIENT_002,Description="CYP2C19 Poor Metabolizer">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	PM_PATIENT_002
chr10	94781859	rs4244285	G	A	99	PASS	GENE=CYP2C19;STAR=*2;RS=4244285	GT:DP:GQ	1/1:51:99
chr10	94762681	rs4986893	G	A	95	PASS	GENE=CYP2C19;STAR=*3;RS=4986893	GT:DP:GQ	0/1:44:95`,
    "CYP2C9": `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele">
##INFO=<ID=RS,Number=1,Type=String,Description="rsID without rs prefix">
##SAMPLE=<ID=PM_PATIENT_003,Description="CYP2C9 Poor Metabolizer">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	PM_PATIENT_003
chr10	94981296	rs1799853	C	T	99	PASS	GENE=CYP2C9;STAR=*2;RS=1799853	GT:DP:GQ	0/1:49:99
chr10	94942290	rs1057910	A	C	96	PASS	GENE=CYP2C9;STAR=*3;RS=1057910	GT:DP:GQ	1/1:41:96`,
    "SLCO1B1": `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele">
##INFO=<ID=RS,Number=1,Type=String,Description="rsID without rs prefix">
##SAMPLE=<ID=PM_PATIENT_004,Description="SLCO1B1 Decreased Function">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	PM_PATIENT_004
chr12	21331549	rs4149056	T	C	99	PASS	GENE=SLCO1B1;STAR=*5;RS=4149056	GT:DP:GQ	1/1:52:99
chr12	21239504	rs11045819	A	G	91	PASS	GENE=SLCO1B1;STAR=*15;RS=11045819	GT:DP:GQ	0/1:39:91`,
    "TPMT": `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele">
##INFO=<ID=RS,Number=1,Type=String,Description="rsID without rs prefix">
##SAMPLE=<ID=PM_PATIENT_005,Description="TPMT Poor Metabolizer">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	PM_PATIENT_005
chr6	18143955	rs1800460	G	A	99	PASS	GENE=TPMT;STAR=*3B;RS=1800460	GT:DP:GQ	1/1:48:99
chr6	18129540	rs1142345	T	C	97	PASS	GENE=TPMT;STAR=*3C;RS=1142345	GT:DP:GQ	1/1:43:97`,
    "DPYD": `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele">
##INFO=<ID=RS,Number=1,Type=String,Description="rsID without rs prefix">
##SAMPLE=<ID=PM_PATIENT_006,Description="DPYD Poor Metabolizer">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	PM_PATIENT_006
chr1	97915614	rs3918290	C	T	99	PASS	GENE=DPYD;STAR=*2A;RS=3918290	GT:DP:GQ	1/1:55:99
chr1	97305364	rs67376798	T	A	93	PASS	GENE=DPYD;STAR=c.2846A>T;RS=67376798	GT:DP:GQ	0/1:40:93`
};

const GENE_DRUG_MAP = {
    "CYP2D6": "CODEINE",
    "CYP2C19": "CLOPIDOGREL",
    "CYP2C9": "WARFARIN",
    "SLCO1B1": "SIMVASTATIN",
    "TPMT": "AZATHIOPRINE",
    "DPYD": "FLUOROURACIL"
};

const SUPPORTED_DRUGS = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"];

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
    vcfContent: null,
    vcfFileName: null,
    selectedDrugs: new Set(),
    customDrug: "",
    isAnalyzing: false,
    results: null,
    error: null,
    activeResultIdx: 0,
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── VCF Parser (browser-side for preview only) ──────────────────────────────
function validateVcf(content) {
    if (!content || !content.trim()) return { valid: false, error: "File is empty" };
    if (!content.includes("#CHROM") && !content.includes("##fileformat")) {
        return { valid: false, error: "Not a valid VCF (missing #CHROM header)" };
    }
    return { valid: true };
}

function countVariants(content) {
    return content.split("\n").filter((l) => l && !l.startsWith("#")).length;
}

// ─── Upload Logic ─────────────────────────────────────────────────────────────
function initUpload() {
    const zone = $("upload-zone");
    const input = $("file-input");

    zone.addEventListener("click", () => input.click());
    input.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    });
    zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFile(file);
    });
}

function handleFile(file) {
    if (!file.name.match(/\.(vcf|txt)$/i)) {
        showUploadError("Please upload a .vcf file");
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showUploadError("File exceeds 5 MB limit");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const v = validateVcf(content);
        if (!v.valid) {
            showUploadError(`Invalid VCF: ${v.error}`);
            return;
        }
        state.vcfContent = content;
        state.vcfFileName = file.name;
        renderUploadSuccess(file.name, file.size, countVariants(content));
        showToast(`✅ Loaded ${file.name}`, "success");
    };
    reader.readAsText(file);
}

function showUploadError(msg) {
    const zone = $("upload-zone");
    zone.classList.add("has-error");
    zone.innerHTML = `
    <span style="font-size:32px;margin-bottom:12px;">⚠️</span>
    <p style="color:var(--rose);font-weight:600;margin-bottom:8px;">${msg}</p>
    <button class="btn-ghost" onclick="resetUpload()" style="margin-top:8px;">Try again</button>`;
}

function renderUploadSuccess(name, size, variants) {
    const zone = $("upload-zone");
    zone.classList.remove("has-error", "drag-over");
    zone.classList.add("has-file");
    zone.innerHTML = `
    <div style="font-size:40px;margin-bottom:12px;">🧬</div>
    <p style="font-weight:700;color:var(--emerald);font-size:18px;margin-bottom:6px;">${name}</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
      <span class="chip chip-cyan">${(size / 1024).toFixed(1)} KB</span>
      <span class="chip chip-violet">${variants} variants</span>
      <span class="chip" style="background:var(--risk-safe-dim);color:var(--emerald);border-color:rgba(16,185,129,0.3);">✓ VCF valid</span>
    </div>
    <button class="btn-ghost" onclick="resetUpload()" style="margin-top:16px;">Change file</button>`;
}

function resetUpload() {
    state.vcfContent = null;
    state.vcfFileName = null;
    const zone = $("upload-zone");
    zone.classList.remove("has-file", "has-error");
    zone.innerHTML = `
    <div style="font-size:48px;margin-bottom:16px;">🧬</div>
    <p style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--text-primary)">Drop your VCF file here</p>
    <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">or click to browse · VCF v4.2 format · Max 5 MB</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
      <span class="chip chip-cyan">VCF v4.2</span>
      <span class="chip">Max 5 MB</span>
    </div>`;
    $("file-input").value = "";
}

// ─── Sample loader ────────────────────────────────────────────────────────────
function loadSample(gene) {
    const content = SAMPLE_VCF_DATA[gene];
    if (!content) return;
    state.vcfContent = content;
    state.vcfFileName = `sample_${gene.toLowerCase()}.vcf`;

    // Auto-select matching drug
    const matchDrug = GENE_DRUG_MAP[gene];
    if (matchDrug) {
        state.selectedDrugs.clear();
        state.selectedDrugs.add(matchDrug);
        renderDrugButtons();
    }

    renderUploadSuccess(state.vcfFileName, new Blob([content]).size, countVariants(content));
    showToast(`✅ Loaded ${gene} sample`, "success");
}

// ─── Drug selection ───────────────────────────────────────────────────────────
function renderDrugButtons() {
    SUPPORTED_DRUGS.forEach((drug) => {
        const btn = $(`drug-${drug}`);
        if (!btn) return;
        btn.classList.toggle("active", state.selectedDrugs.has(drug));
    });
}

function toggleDrug(drug) {
    if (state.selectedDrugs.has(drug)) {
        state.selectedDrugs.delete(drug);
    } else {
        state.selectedDrugs.add(drug);
    }
    renderDrugButtons();
}

// ─── Analysis ─────────────────────────────────────────────────────────────────
async function runAnalysis() {
    if (!state.vcfContent) {
        showToast("⚠️ Please upload a VCF file first", "error");
        return;
    }

    const drugs = [...state.selectedDrugs];
    const customDrug = $("custom-drug")?.value.trim().toUpperCase();
    if (customDrug) drugs.push(customDrug);

    if (drugs.length === 0) {
        showToast("⚠️ Select at least one drug to analyze", "error");
        return;
    }

    state.isAnalyzing = true;
    state.results = null;
    state.error = null;
    state.activeResultIdx = 0;

    setAnalyzeBtn(true);
    $("results-section").classList.add("hidden");
    $("error-section").classList.add("hidden");

    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vcfContent: state.vcfContent, drugs }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Server error ${response.status}`);
        }

        state.results = data;
        renderResults(data);
        showToast(`✅ Analysis complete — ${data.results.length} drug(s) analyzed`, "success");
        $("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
        state.error = err.message;
        $("error-msg").textContent = err.message;
        $("error-section").classList.remove("hidden");
        showToast(`❌ ${err.message}`, "error");
    } finally {
        state.isAnalyzing = false;
        setAnalyzeBtn(false);
    }
}

function setAnalyzeBtn(loading) {
    const btn = $("analyze-btn");
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = `<div class="spinner"></div> Analyzing...`;
    } else {
        btn.disabled = false;
        btn.innerHTML = `🧬 Run Pharmacogenomic Analysis`;
    }
}

// ─── Results Rendering ────────────────────────────────────────────────────────
const RISK_CONFIG = {
    Safe: { color: "var(--risk-safe)", bg: "var(--risk-safe-dim)", emoji: "✅", border: "rgba(16,185,129,0.3)" },
    "Adjust Dosage": { color: "var(--risk-adjust)", bg: "var(--risk-adjust-dim)", emoji: "⚠️", border: "rgba(245,158,11,0.3)" },
    Toxic: { color: "var(--risk-toxic)", bg: "var(--risk-toxic-dim)", emoji: "☠️", border: "rgba(244,63,94,0.3)" },
    Ineffective: { color: "var(--risk-ineffective)", bg: "var(--risk-ineffective-dim)", emoji: "🔴", border: "rgba(249,115,22,0.3)" },
    Unknown: { color: "var(--risk-unknown)", bg: "var(--risk-unknown-dim)", emoji: "❓", border: "rgba(107,114,128,0.3)" },
};

function getRiskCfg(label) {
    return RISK_CONFIG[label] || RISK_CONFIG["Unknown"];
}

function renderResults(data) {
    const section = $("results-section");
    section.classList.remove("hidden");
    section.classList.add("fade-in-up");

    // Summary bar
    $("results-summary").innerHTML = `
    <div>
      <div class="section-label">Patient</div>
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">${data.patient_id}</div>
    </div>
    <div>
      <div class="section-label">Drugs Analyzed</div>
      <div style="font-size:22px;font-weight:800;">${data.total_drugs_analyzed}</div>
    </div>
    <div>
      <div class="section-label">Genes Detected</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
        ${(data.vcf_metadata?.pharma_genes_detected || []).map((g) => `<span class="chip chip-violet">${g}</span>`).join("") || '<span class="chip">None detected</span>'}
      </div>
    </div>
    <div>
      <div class="section-label">Total Variants</div>
      <div style="font-size:22px;font-weight:800;">${data.vcf_metadata?.total_variants || 0}</div>
    </div>`;

    // Drug tabs
    const tabs = $("drug-tabs");
    tabs.innerHTML = "";
    data.results.forEach((result, i) => {
        const cfg = getRiskCfg(result.risk_assessment?.risk_label);
        const btn = document.createElement("button");
        btn.className = "drug-tab";
        btn.setAttribute("data-idx", i);
        btn.style.cssText = i === 0 ? `background:var(--cyan-dim);border-color:var(--cyan);color:var(--cyan);` : "";
        btn.textContent = `${cfg.emoji} ${result.drug}`;
        btn.onclick = () => switchResult(i);
        tabs.appendChild(btn);
    });

    renderResultDetail(data.results[0], 0);
}

function switchResult(idx) {
    state.activeResultIdx = idx;
    document.querySelectorAll(".drug-tab").forEach((btn, i) => {
        const isActive = parseInt(btn.dataset.idx) === idx;
        btn.style.cssText = isActive
            ? "background:var(--cyan-dim);border-color:var(--cyan);color:var(--cyan);"
            : "";
    });
    renderResultDetail(state.results.results[idx], idx);
}

function renderResultDetail(result, idx) {
    const container = $("result-detail");
    const risk = result.risk_assessment || {};
    const profile = result.pharmacogenomic_profile || {};
    const rec = result.clinical_recommendation || {};
    const llm = result.llm_generated_explanation || {};
    const qm = result.quality_metrics || {};

    const riskLabel = risk.risk_label || "Unknown";
    const cfg = getRiskCfg(riskLabel);
    const confidence = Math.round((risk.confidence_score || 0) * 100);

    container.innerHTML = `
    <div class="fade-in">
      <!-- Risk Banner -->
      <div class="risk-banner" style="background:${cfg.bg};border:1px solid ${cfg.border};">
        <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${cfg.color};margin-bottom:8px;">RISK ASSESSMENT</div>
            <div style="font-size:42px;font-weight:900;color:${cfg.color};letter-spacing:-1px;line-height:1;">${cfg.emoji} ${riskLabel}</div>
            <div style="font-size:14px;color:var(--text-secondary);margin-top:8px;">
              Drug: <strong style="color:var(--text-primary);">${result.drug}</strong> &nbsp;·&nbsp;
              Gene: <span class="chip chip-violet" style="font-size:12px;">${profile.primary_gene || "?"}</span> &nbsp;·&nbsp;
              Diplotype: <span class="phenotype-badge">${profile.diplotype || "?"}</span>
              <span class="phenotype-badge" style="margin-left:6px;">${profile.phenotype || "?"}</span>
            </div>
          </div>
          <div style="text-align:center;min-width:120px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:var(--text-muted);margin-bottom:8px;">CONFIDENCE</div>
            <div style="font-size:40px;font-weight:900;color:${cfg.color};">${confidence}%</div>
            <div style="width:80px;margin:8px auto 0;height:6px;background:var(--border-subtle);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${confidence}%;background:${cfg.color};border-radius:3px;transition:width .8s;"></div>
            </div>
          </div>
        </div>
        ${rec.urgency ? `<div style="margin-top:16px;padding:10px 16px;border-radius:8px;background:rgba(0,0,0,0.25);font-size:14px;font-weight:600;color:${cfg.color};">⚡ ${rec.urgency}</div>` : ""}
      </div>

      <!-- Accordions -->
      ${makeAccordion("🧬", "Pharmacogenomic Profile", makeProfileContent(profile), true)}
      ${makeAccordion("💊", "Clinical Recommendation", makeRecContent(rec), true)}
      ${makeAccordion("🤖", "AI-Generated Explanation", makeLLMContent(llm), false)}
      ${makeAccordion("📊", "Quality Metrics & Raw JSON", makeQMContent(qm, result), false)}
    </div>`;

    // Wire accordion toggles
    container.querySelectorAll(".accordion-header").forEach((header) => {
        header.addEventListener("click", () => {
            const content = header.nextElementSibling;
            const arrow = header.querySelector(".accordion-arrow");
            const isOpen = content.style.display !== "none";
            content.style.display = isOpen ? "none" : "block";
            arrow.classList.toggle("open", !isOpen);
        });
    });
}

function makeAccordion(icon, title, content, openByDefault) {
    return `
    <div class="accordion-item">
      <div class="accordion-header">
        <div style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;">
          <span>${icon}</span> ${title}
        </div>
        <span class="accordion-arrow ${openByDefault ? "open" : ""}">▶</span>
      </div>
      <div class="accordion-content" style="display:${openByDefault ? "block" : "none"};">
        ${content}
      </div>
    </div>`;
}

function makeProfileContent(profile) {
    const variants = profile.detected_variants || [];
    const variantsHtml = variants.length > 0
        ? variants.map((v) => `
      <div class="variant-row" style="background:var(--bg-glass);border:1px solid var(--border-subtle);">
        <span style="font-family:'JetBrains Mono',monospace;color:var(--violet);font-weight:600;">${v.rsid || "."}</span>
        <span class="chip chip-cyan">${v.star_allele || "."}</span>
        <span class="chip" style="text-transform:capitalize;">${v.zygosity || "unknown"}</span>
        <span style="color:var(--text-secondary);font-size:14px;flex:1;">${v.clinical_significance || ""}</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted);">${v.chromosome}:${v.position}</span>
      </div>`).join("")
        : `<p style="color:var(--text-muted);font-size:14px;padding:16px 0;">No specific pharmacogenomic variants detected; assuming wild-type.</p>`;

    return `
    <div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
      <div>
        <div class="section-label">DIPLOTYPE</div>
        <span class="phenotype-badge" style="font-size:16px;padding:6px 14px;">${profile.diplotype || "Unknown"}</span>
      </div>
      <div>
        <div class="section-label">PHENOTYPE</div>
        <span class="phenotype-badge" style="font-size:16px;padding:6px 14px;background:var(--cyan-dim);color:var(--cyan);border-color:rgba(0,212,255,0.3);">${profile.phenotype || "Unknown"}</span>
      </div>
    </div>
    <div class="section-label">DETECTED VARIANTS (${variants.length})</div>
    <div style="margin-top:8px;">${variantsHtml}</div>
    <div style="margin-top:16px;">
      <div class="section-label">GENES ASSESSED</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
        ${(profile.all_genes_assessed || [profile.primary_gene]).filter(Boolean).map((g) => `<span class="chip chip-violet">${g}</span>`).join("")}
      </div>
    </div>`;
}

function makeRecContent(rec) {
    const alts = rec.alternative_drugs || [];
    const monitoring = rec.monitoring_required || [];
    return `
    <div class="glass" style="padding:16px 20px;margin-bottom:12px;">
      <div class="section-label">DOSING RECOMMENDATION</div>
      <p style="margin-top:6px;line-height:1.7;">${rec.dosing_recommendation || "No recommendation available."}</p>
    </div>
    ${rec.urgency ? `<div style="background:rgba(248,92,78,0.07);border:1px solid rgba(248,92,78,0.2);padding:12px 16px;border-radius:10px;margin-bottom:12px;">
      <div class="section-label" style="color:var(--rose);">URGENCY</div>
      <p style="font-weight:700;color:var(--rose);margin-top:4px;">${rec.urgency}</p>
    </div>` : ""}
    ${alts.length ? `<div style="margin-bottom:12px;">
      <div class="section-label">ALTERNATIVE DRUGS</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
        ${alts.map((d) => `<span class="chip chip-cyan">${d}</span>`).join("")}
      </div>
    </div>` : ""}
    ${monitoring.length ? `<div style="margin-bottom:12px;">
      <div class="section-label">MONITORING REQUIRED</div>
      <ul style="margin-top:8px;padding-left:20px;color:var(--text-secondary);font-size:14px;line-height:2;">
        ${monitoring.map((m) => `<li>${m}</li>`).join("")}
      </ul>
    </div>` : ""}
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;">
      <div><span class="section-label">CPIC LEVEL</span><div class="chip chip-cyan" style="margin-top:4px;">Level ${rec.cpic_level || "N/A"}</div></div>
      <div style="flex:1;min-width:200px;"><span class="section-label">CPIC GUIDELINE</span><p style="font-size:13px;color:var(--text-secondary);margin-top:4px;">${rec.cpic_guideline || "N/A"}</p></div>
    </div>`;
}

function makeLLMContent(llm) {
    const generated = llm.generated_by || "rule-based";
    const generatedLabel = generated === "gemini"
        ? `<span class="chip chip-cyan">⚡ Gemini 1.5 Flash</span>`
        : `<span class="chip">📋 Rule-Based</span>`;

    const section = (title, content) => content
        ? `<div style="margin-bottom:16px;">
        <div class="section-label">${title}</div>
        <p style="margin-top:6px;line-height:1.8;color:var(--text-secondary);">${content}</p>
      </div>`
        : "";

    const refs = (llm.references || []).filter(Boolean);

    return `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
      Generated by: ${generatedLabel}
    </div>
    ${section("SUMMARY", llm.summary)}
    ${section("MECHANISM", llm.mechanism)}
    ${section("CLINICAL SIGNIFICANCE", llm.clinical_significance)}
    ${section("MONITORING PARAMETERS", llm.monitoring_parameters)}
    <div style="background:var(--cyan-dim);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:16px 20px;margin-bottom:16px;">
      <div class="section-label" style="color:var(--cyan);">PATIENT-FRIENDLY SUMMARY</div>
      <p style="margin-top:8px;line-height:1.8;font-size:15px;">${llm.patient_friendly_summary || "Not available."}</p>
    </div>
    ${refs.length ? `<div>
      <div class="section-label">REFERENCES</div>
      <ul style="margin-top:8px;padding-left:20px;color:var(--text-muted);font-size:13px;line-height:2;">
        ${refs.map((r) => `<li>${r}</li>`).join("")}
      </ul>
    </div>` : ""}`;
}

function makeQMContent(qm, fullResult) {
    const jsonStr = JSON.stringify(fullResult, null, 2);
    return `
    <div class="grid-2" style="margin-bottom:20px;gap:12px;">
      <div class="stat-box">
        <div class="section-label">VCF PARSING</div>
        <div style="font-size:24px;font-weight:800;margin-top:4px;">${qm.vcf_parsing_success ? "✅ Success" : "❌ Failed"}</div>
      </div>
      <div class="stat-box">
        <div class="section-label">TOTAL VARIANTS</div>
        <div style="font-size:24px;font-weight:800;margin-top:4px;">${qm.total_variants_in_vcf ?? 0}</div>
      </div>
      <div class="stat-box">
        <div class="section-label">DRUG-GENE VARIANTS</div>
        <div style="font-size:24px;font-weight:800;margin-top:4px;">${qm.variants_for_this_drug_gene ?? 0}</div>
      </div>
      <div class="stat-box">
        <div class="section-label">LLM EXPLANATION</div>
        <div style="font-size:24px;font-weight:800;margin-top:4px;">${qm.llm_explanation_generated ? "✅ Yes" : "❌ No"}</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:12px;">
      <button class="btn-ghost" onclick="downloadJSON('${fullResult.drug}')">⬇ Download JSON</button>
      <button class="btn-ghost" onclick="copyJSON('${fullResult.drug}')">📋 Copy JSON</button>
    </div>
    <div class="section-label">FULL JSON RESPONSE</div>
    <pre class="code-block" id="json-${fullResult.drug}">${escapeHtml(jsonStr)}</pre>`;
}

function downloadJSON(drug) {
    const result = state.results?.results?.find((r) => r.drug === drug);
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharma_${drug.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("⬇ JSON downloaded", "success");
}

async function copyJSON(drug) {
    const result = state.results?.results?.find((r) => r.drug === drug);
    if (!result) return;
    try {
        await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        showToast("📋 Copied to clipboard", "success");
    } catch {
        showToast("Could not copy — use Download instead", "error");
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(message, type = "info") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast?.remove(), 3500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    initUpload();
    renderDrugButtons();

    $("analyze-btn").addEventListener("click", runAnalysis);

    // Make drug buttons interactive
    SUPPORTED_DRUGS.forEach((drug) => {
        const btn = $(`drug-${drug}`);
        if (btn) btn.addEventListener("click", () => toggleDrug(drug));
    });

    // Custom drug — allow Enter key
    const customInput = $("custom-drug");
    if (customInput) {
        customInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") runAnalysis();
        });
    }

    // Sample buttons
    Object.keys(SAMPLE_VCF_DATA).forEach((gene) => {
        const btn = $(`sample-${gene}`);
        if (btn) btn.addEventListener("click", () => loadSample(gene));
    });
});
