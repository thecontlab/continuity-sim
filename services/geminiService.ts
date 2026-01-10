import { GoogleGenAI, Type, SchemaParams } from "@google/genai";
import { FoundationData, RiskInput, GeminiAuditResponse } from "../types";

const RESPONSE_SCHEMA: SchemaParams = {
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

export const generateAuditReport = async (
  foundation: FoundationData,
  riskInputs: RiskInput[]
): Promise<GeminiAuditResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `
    You are the Continuity Advisor. You are a senior strategy consultant for mid-market firms ($2M – $50M ARR). 
    Your objective is to quantify operational fragility and identify the Volatility Gap within a business. 
    Your tone is institutional, surgical, and purely objective. Avoid hyperbolic language. 
    Do not use words like "unleash," "unlock," "game-changer," or "landscape." 
    You analyze data through the lens of P&L preservation and Speed to Market.

    LOGIC & CALCULATIONS:
    1. Geographic Weight: If the user’s location (if inferred) or risk profile implies high physical risk, increase Weather Severity by 20%.
    2. Unknown Vulnerability: If a user skipped a risk card (passed in JSON as skipped: true), assign a "Shadow Score" of 7/10 for both X and Y. Label it "Unknown".
    3. Heatmap: Plot 5 nodes. X=Severity, Y=Reaction Latency.
    4. Revenue-at-Risk (RAR): Calculate $RAR = Revenue * ((Severity * Latency / 100) * Weight).
       Weights: Cash Flow/Supply Chain (1.0), Workforce/Infrastructure (0.8), Weather (0.6).
       Report only the highest single RAR figure.
    5. Volatility Index: An aggregate score 0-100 based on average distance from origin.
  `;

  const userPrompt = `
    Analyze the following firm data:
    Industry: ${foundation.industry}
    Annual Revenue: $${foundation.revenue}
    
    Risk Audit Inputs:
    ${JSON.stringify(riskInputs, null, 2)}
    
    Generate the structured JSON response for the Continuity Audit.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeminiAuditResponse;
  } catch (error) {
    console.error("Audit Generation Failed", error);
    throw error;
  }
};