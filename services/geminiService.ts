import { GoogleGenAI, Type } from "@google/genai";
import { FoundationData, RiskInput, GeminiAuditResponse, RiskCategory } from "../types";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    audit_results: {
      type: Type.OBJECT,
      properties: {
        primary_rar: { type: Type.NUMBER, description: "Revenue at Risk amount in USD" },
        primary_risk_category: { type: Type.STRING },
        volatility_index: { type: Type.NUMBER, description: "0-100 score" },
        unknown_vulnerabilities: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["primary_rar", "primary_risk_category", "volatility_index", "unknown_vulnerabilities"]
    },
    heatmap_coordinates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          x: { type: Type.NUMBER, description: "Severity 0-10" },
          y: { type: Type.NUMBER, description: "Latency 0-10" },
          status: { type: Type.STRING, description: "Verified or Unknown" }
        },
        required: ["label", "x", "y", "status"]
      }
    },
    teaser_summary: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: "Short, punchy, alarming headline about the risk" },
        critical_finding: { type: Type.STRING, description: "One sentence direct observation" }
      },
      required: ["headline", "critical_finding"]
    },
    priority_fix_list: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timeline: { type: Type.STRING },
          task: { type: Type.STRING, description: "Specific strategic action" },
          target: { type: Type.STRING }
        },
        required: ["timeline", "task", "target"]
      }
    }
  },
  required: ["audit_results", "heatmap_coordinates", "teaser_summary", "priority_fix_list"]
};

// --- LOCAL CALCULATION LOGIC ---
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
  let totalScore = 0;

  const heatmapData = inputs.map(input => {
    // 1. Calculate RAR for this specific node
    // Formula: Revenue * ((Severity * Latency / 100) * Weight)
    const weight = WEIGHTS[input.category] || 0.5;
    const riskFactor = (input.severity * input.latency) / 100;
    const rar = Math.round(revenue * riskFactor * weight);

    // Track Highest Risk
    if (rar > highestRar) {
      highestRar = rar;
      primaryCategory = input.category;
    }

    // Track Aggregate Volatility (Simple average of magnitudes)
    totalScore += (input.severity + input.latency);

    return {
      label: input.category,
      x: input.severity,
      y: input.latency,
      status: input.skipped ? 'Unknown' : 'Verified'
    };
  });

  // Normalize Volatility Index (0-100)
  // Max possible score per item is 20. 5 items = 100 max total.
  const volatilityIndex = Math.min(100, Math.round((totalScore / (inputs.length * 20)) * 100));

  return {
    primary_rar: highestRar,
    primary_risk_category: primaryCategory || 'General Volatility',
    volatility_index: volatilityIndex,
    heatmap_coordinates: heatmapData
  };
};

export const generateAuditReport = async (
  foundation: FoundationData,
  riskInputs: RiskInput[]
): Promise<GeminiAuditResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // 1. PERFORM DETERMINISTIC MATH LOCAL (The "Sim" Part)
  const mechanics = calculateMechanics(foundation.revenue, riskInputs);

  // 2. PREPARE PROMPT (The "Advisor" Part)
  const userPrompt = `
    Analyze the following firm data:
    Industry: ${foundation.industry}
    Annual Revenue: $${foundation.revenue}
    
    Calculated Risk Data (USE THESE VALUES):
    Primary Risk: ${mechanics.primary_risk_category}
    Revenue at Risk: $${mechanics.primary_rar}
    Volatility Index: ${mechanics.volatility_index}

    Risk Inputs:
    ${JSON.stringify(riskInputs, null, 2)}
    
    Generate the text summary and priority fix list. 
    IMPORTANT: You must output the specific numeric values provided above for RAR and Risk Category. Do not recalculate them.
  `;

  // 3. GENERATE OR MOCK
  let responseData: GeminiAuditResponse;

  if (!apiKey || apiKey.length === 0) {
    console.warn("API_KEY not found. Using Dynamic Mock Data.");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Dynamic Mock that actually respects the sliders
    responseData = {
      audit_results: {
        primary_rar: mechanics.primary_rar,
        primary_risk_category: mechanics.primary_risk_category,
        volatility_index: mechanics.volatility_index,
        unknown_vulnerabilities: riskInputs.filter(i => i.skipped).map(i => `${i.category} Protocol Unverified`)
      },
      heatmap_coordinates: mechanics.heatmap_coordinates,
      teaser_summary: {
        headline: `CRITICAL FRAGILITY IN ${mechanics.primary_risk_category.toUpperCase()} VECTOR`,
        critical_finding: `${mechanics.primary_risk_category} instability exposes ${Math.round((mechanics.primary_rar / foundation.revenue) * 100)}% of annual revenue to immediate disruption.`
      },
      priority_fix_list: [
        { timeline: "30 Days", task: `Audit ${mechanics.primary_risk_category} single-points-of-failure`, target: "Severity Reduction" },
        { timeline: "60 Days", task: "Implement cross-training for key technical roles", target: "Latency Reduction" },
        { timeline: "90 Days", task: "Establish 3-month operating cash reserve", target: "Adaptive Capacity" }
      ]
    };

  } else {
    // Real API Call
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemPrompt = `
        You are the Continuity Advisor. You are a senior strategy consultant.
        Your tone is institutional, surgical, and purely objective.
        Analyze the data provided and fill in the JSON schema.
        Use the Pre-Calculated financial figures provided in the prompt.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          systemInstruction: systemPrompt
        }
      });

      const text = result.text;
      if (!text) throw new Error("No response from AI");
      responseData = JSON.parse(text) as GeminiAuditResponse;

    } catch (error) {
      console.error("Audit Generation Failed", error);
      // Fallback to dynamic mock if API fails
      responseData = {
        audit_results: {
          primary_rar: mechanics.primary_rar,
          primary_risk_category: mechanics.primary_risk_category,
          volatility_index: mechanics.volatility_index,
          unknown_vulnerabilities: ["AI Generation Failed - Using Fallback Data"]
        },
        heatmap_coordinates: mechanics.heatmap_coordinates,
        teaser_summary: {
          headline: "SYSTEM OFFLINE: LOCAL ANALYSIS ONLY",
          critical_finding: "The AI analysis service is temporarily unavailable. Displaying raw calculation data."
        },
        priority_fix_list: []
      };
    }
  }

  // 4. FINAL SAFETY OVERWRITE
  // Regardless of what the AI said (or if we used Mock), we overwrite the math 
  // with our local deterministic calculations to ensure the UI matches the sliders 100%.
  responseData.audit_results.primary_rar = mechanics.primary_rar;
  responseData.audit_results.primary_risk_category = mechanics.primary_risk_category;
  responseData.audit_results.volatility_index = mechanics.volatility_index;
  responseData.heatmap_coordinates = mechanics.heatmap_coordinates;

  return responseData;
};