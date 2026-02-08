import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, RiskCategory, FoundationData, RiskInput, GeminiAuditResponse } from '../types';

// 1. Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn("Supabase client init failed:", err);
  }
}

// 2. Internal Helper for Score Extraction
const getScores = (riskInputs: RiskInput[], category: RiskCategory) => {
  const input = riskInputs.find(i => i.category === category);
  return {
    severity: input ? input.severity : 0,
    latency: input ? input.latency : 0
  };
};

// --- EXPORT 1: DRAFT LEAD (Partial Save) ---
// Runs silently during the loading screen
export const draftLead = async (state: AppState) => {
  if (!supabase) return null;

  console.log("Initiating Draft Save...");

  // Map dynamic JSON structure
  const riskVectors = state.riskInputs.map(input => ({
    category: input.category,
    scores: { 
      severity: input.severity, 
      latency: input.latency,
      magnitude: input.severity + input.latency 
    },
    telemetry: {
      q1_label: input.metadata?.question1_label,
      q1_value: input.metadata?.answer1_value,
      q2_label: input.metadata?.question2_label,
      q2_value: input.metadata?.answer2_value,
      skipped: input.skipped
    }
  }));

  const payload = {
    industry: state.foundation.industry,
    revenue: state.foundation.revenue,
    primary_rar: state.auditResult?.audit_results.primary_rar || 0,
    volatility_index: state.auditResult?.audit_results.volatility_index || 0,
    risk_vectors: riskVectors,

    // Flattened Scores for SQL Analytics
    score_supply_chain_severity: getScores(state.riskInputs, RiskCategory.SUPPLY_CHAIN).severity,
    score_supply_chain_latency: getScores(state.riskInputs, RiskCategory.SUPPLY_CHAIN).latency,
    score_cash_flow_severity: getScores(state.riskInputs, RiskCategory.CASH_FLOW).severity,
    score_cash_flow_latency: getScores(state.riskInputs, RiskCategory.CASH_FLOW).latency,
    score_weather_severity: getScores(state.riskInputs, RiskCategory.WEATHER_PHYSICAL).severity,
    score_weather_latency: getScores(state.riskInputs, RiskCategory.WEATHER_PHYSICAL).latency,
    score_infrastructure_severity: getScores(state.riskInputs, RiskCategory.INFRASTRUCTURE_TOOLS).severity,
    score_infrastructure_latency: getScores(state.riskInputs, RiskCategory.INFRASTRUCTURE_TOOLS).latency,
    score_workforce_severity: getScores(state.riskInputs, RiskCategory.WORKFORCE).severity,
    score_workforce_latency: getScores(state.riskInputs, RiskCategory.WORKFORCE).latency
  };

  const { data, error } = await supabase
    .from('leads')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    console.error("Draft Save Failed:", error);
    return null;
  }

  return data.id;
};

// --- EXPORT 2: FINALIZE LEAD (The "Concierge" Trigger) ---
// This now bundles the "Prompt Package" and saves it to trigger the email
export const finalizeLead = async (
  leadId: number, 
  identity: { companyName: string, email: string },
  context: {
    foundation: FoundationData,
    riskInputs: RiskInput[],
    auditResult: GeminiAuditResponse
  }
) => {
  if (!supabase) return;

  console.log(`Finalizing Lead ID: ${leadId}`);

  // 1. Construct the "Consultant Prompt Package"
  // This format is optimized for you to copy-paste into Gemini Advanced
  const promptPackage = {
    meta: {
      timestamp: new Date().toISOString(),
      lead_id: leadId,
      action: "MANUAL_REPORT_REQUEST"
    },
    client_profile: {
      company_name: identity.companyName,
      contact_email: identity.email,
      revenue: context.foundation.revenue,
      industry: context.foundation.industry
    },
    // The "Meat": Specific Answers
    risk_assessment: context.riskInputs.map(input => ({
      category: input.category,
      severity_score: input.severity,
      latency_score: input.latency,
      specific_factors: input.metadata 
    })),
    // The "Math": System Calculations
    system_audit: {
      primary_risk: context.auditResult.audit_results.primary_risk_category,
      volatility_score: context.auditResult.audit_results.volatility_index
    }
  };

  // 2. Update Database (Updates Email -> Fires SQL Trigger -> Sends Email)
  const { error } = await supabase
    .from('leads')
    .update({
      company_name: identity.companyName,
      email: identity.email,
      raw_audit_data: promptPackage // <--- The Payload
    })
    .eq('id', leadId);

  if (error) {
    console.error("Finalization Failed:", error);
    throw error;
  }
  
  console.log("Lead Identity Secured & Email Triggered.");
};