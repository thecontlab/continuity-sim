import { FoundationData, RiskInput, GeminiAuditResponse, RiskCategory } from "../types";

// --- 1. THE UNIVERSAL NARRATIVE LIBRARY ---
const NARRATIVES: Record<string, { A: any; B: any }> = {
  [RiskCategory.SUPPLY_CHAIN]: {
    A: {
      headline: "CRITICAL UPSTREAM DEPENDENCY",
      finding: "Your value chain has a single point of failure. A disruption at one key external provider creates a 'cascade failure,' halting your ability to deliver value within the calculated latency window."
    },
    B: {
      headline: "VOLATILE INPUT STABILITY",
      finding: "External inputs—whether physical goods, digital services, or talent—are exhibiting instability. Without a larger operational buffer, this volatility will force unforced revenue pauses."
    }
  },
  [RiskCategory.CASH_FLOW]: {
    A: {
      headline: "SOLVENCY RUNWAY COMPROMISED",
      finding: "Operational reserves are insufficient to absorb a 30-day revenue shock. The divergence between your fixed obligations and revenue timing creates a mathematically inevitable liquidity gap."
    },
    B: {
      headline: "CASH CONVERSION CYCLE IMBALANCE",
      finding: "Your outflow velocity exceeds your inflow velocity. This structural misalignment drains working capital and reduces your capacity to weather market contractions."
    }
  },
  [RiskCategory.WORKFORCE]: {
    A: {
      headline: "KEY PERSON DEPENDENCY",
      finding: "Institutional knowledge is dangerously concentrated. The loss of specific individuals would result in an immediate capability regression, as critical execution processes are not transferable."
    },
    B: {
      headline: "KNOWLEDGE SILO RISK",
      finding: "Critical operations rely on tribal knowledge rather than documented systems. This prevents 'surging' capacity during high-demand periods and creates fragility during turnover."
    }
  },
  [RiskCategory.INFRASTRUCTURE_TOOLS]: {
    A: {
      headline: "PLATFORM & DATA LOCK-IN",
      finding: "Operational continuity is fully dependent on proprietary external systems. You lack an autonomous recovery protocol, meaning a vendor outage results in total operational paralysis."
    },
    B: {
      headline: "FRAGMENTED OPERATIONAL TRUTH",
      finding: "Critical data is siloed across disconnected tools or manual trackers. The lack of a unified 'single source of truth' creates dangerous blind spots during rapid decision-making."
    }
  },
  [RiskCategory.WEATHER_PHYSICAL]: {
    A: {
      headline: "GEOGRAPHIC CONCENTRATION EXPOSURE",
      finding: "Asset density in a high-risk zone exceeds safe diversification limits. A single localized event (natural or infrastructure) has the probability of disabling 100% of revenue generation."
    },
    B: {
      headline: "ACCESS & RECOVERY FRAGILITY",
      finding: "Your operations lack location independence. While assets may be insured, the inability to physically access or utilize them during a disruption creates an unrecoverable revenue loss."
    }
  }
};

const PRIORITY_FIXES: Record<string, any[]> = {
  [RiskCategory.SUPPLY_CHAIN]: [
    { timeline: "30 Days", task: "Audit Tier-1 critical vendors for financial solvency", target: "Identification" },
    { timeline: "60 Days", task: "Qualify one alternative provider for primary inputs", target: "Redundancy" },
    { timeline: "90 Days", task: "Negotiate 'Force Majeure' clauses in vendor contracts", target: "Legal Shield" }
  ],
  [RiskCategory.CASH_FLOW]: [
    { timeline: "30 Days", task: "Aggressively collect overdue Accounts Receivable", target: "Cash Injection" },
    { timeline: "60 Days", task: "Establish a rolling 13-week cash flow forecast", target: "Visibility" },
    { timeline: "90 Days", task: "Secure a standby Line of Credit (LOC) or bridge facility", target: "Safety Net" }
  ],
  [RiskCategory.WORKFORCE]: [
    { timeline: "30 Days", task: "Identify 'Bus Factor' personnel for immediate triage", target: "Assessment" },
    { timeline: "60 Days", task: "Document top 5 critical execution processes (SOPs)", target: "Knowledge Capture" },
    { timeline: "90 Days", task: "Cross-train junior staff on one critical function", target: "Continuity" }
  ],
  [RiskCategory.INFRASTRUCTURE_TOOLS]: [
    { timeline: "30 Days", task: "Test offline/manual operating procedures", target: "Resilience" },
    { timeline: "60 Days", task: "Audit SaaS contracts for data ownership/export clauses", target: "Sovereignty" },
    { timeline: "90 Days", task: "Implement a secondary communication channel (out-of-band)", target: "Redundancy" }
  ],
  [RiskCategory.WEATHER_PHYSICAL]: [
    { timeline: "30 Days", task: "Review insurance policy for Business Interruption gaps", target: "Financial Shield" },
    { timeline: "60 Days", task: "Digitize physical records to redundant cloud storage", target: "Asset Protection" },
    { timeline: "90 Days", task: "Establish a remote-work protocol for HQ staff", target: "Agility" }
  ]
};

// --- 2. LOCAL CALCULATION LOGIC ---
const WEIGHTS: Record<string, number> = {
  [RiskCategory.SUPPLY_CHAIN]: 1.0,
  [RiskCategory.CASH_FLOW]: 1.0,
  [RiskCategory.WORKFORCE]: 0.8,
  [RiskCategory.INFRASTRUCTURE_TOOLS]: 0.8,
  [RiskCategory.WEATHER_PHYSICAL]: 0.6
};

// Helper to determine the Math locally so it never hallucinates
const calculateMechanics = (revenue: number, inputs: RiskInput[]) => {
  let highestRar = 0;
  let primaryCategory = '';
  let primaryInput: RiskInput | null = null;
  let totalScore = 0;
  const heatmapData = [];

  // ARCHITECT FIX: Use for-loop instead of .map() to satisfy TypeScript Control Flow
  for (const input of inputs) {
    // 1. Calculate RAR for this specific node
    const weight = WEIGHTS[input.category] || 0.5;
    const riskFactor = (input.severity * input.latency) / 100;
    const rar = Math.round(revenue * riskFactor * weight);

    // Track Highest Risk
    if (rar > highestRar) {
      highestRar = rar;
      primaryCategory = input.category;
      primaryInput = input;
    }

    // Track Aggregate Volatility
    totalScore += (input.severity + input.latency);

    // Build Heatmap
    heatmapData.push({
      label: input.category,
      x: input.severity,
      y: input.latency,
      status: input.skipped ? 'Unknown' : 'Verified'
    });
  }

  // Normalize Volatility Index (0-100)
  const volatilityIndex = Math.min(100, Math.round((totalScore / (inputs.length * 20)) * 100));

  return {
    primary_rar: highestRar,
    primary_risk_category: primaryCategory || 'General Volatility',
    primary_input: primaryInput,
    volatility_index: volatilityIndex,
    heatmap_coordinates: heatmapData
  };
};

export const generateAuditReport = async (
  foundation: FoundationData,
  riskInputs: RiskInput[]
): Promise<GeminiAuditResponse> => {
  
  // 1. PERFORM CALCULATION
  const mechanics = calculateMechanics(foundation.revenue, riskInputs);
  const category = mechanics.primary_risk_category;
  
  // 2. DETERMINE NARRATIVE (Severity Logic)
  // Check magnitude of the primary risk input (Severity + Latency, max 20)
  // If > 12 (60%), it is Critical (A). Otherwise, Warning (B).
  const primaryMag = mechanics.primary_input ? (mechanics.primary_input.severity + mechanics.primary_input.latency) : 0;
  const severityKey = primaryMag > 12 ? 'A' : 'B';
  
  // Fallback to Cash Flow A if something goes wrong with the lookup
  const baseNarrative = NARRATIVES[category]?.[severityKey as 'A' | 'B'] || NARRATIVES[RiskCategory.CASH_FLOW].A;
  const fixes = PRIORITY_FIXES[category] || [];

  // 3. GENERATE DYNAMIC TIE-BACK (The "Why")
  // Injects the specific inputs (e.g., "Single Source") into the general narrative
  let tieBack = "";
  if (mechanics.primary_input?.metadata) {
    const meta = mechanics.primary_input.metadata;
    
    // Only add if we have actual answers
    if (meta.answer1_value) {
       tieBack = ` This exposure is driven by your input for ${meta.question1_label} (${meta.answer1_value})`;
       
       if (meta.answer2_value) {
         tieBack += ` combined with ${meta.question2_label} (${meta.answer2_value}).`;
       } else {
         tieBack += ".";
       }
    }
  }

  // 4. SIMULATE PROCESSING DELAY
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 5. RETURN DETERMINISTIC RESPONSE
  return {
    audit_results: {
      primary_rar: mechanics.primary_rar,
      primary_risk_category: mechanics.primary_risk_category,
      volatility_index: mechanics.volatility_index,
      unknown_vulnerabilities: riskInputs.filter(i => i.skipped).map(i => `${i.category} Protocol Unverified`)
    },
    heatmap_coordinates: mechanics.heatmap_coordinates,
    teaser_summary: {
      headline: baseNarrative.headline,
      critical_finding: baseNarrative.finding + tieBack
    },
    priority_fix_list: fixes
  };
};