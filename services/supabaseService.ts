import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, RiskCategory } from '../types';

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
const getScores = (state: AppState, category: RiskCategory) => {
  const input = state.riskInputs.find(i => i.category === category);
  return {
    severity: input ? input.severity : 0,
    latency: input ? input.latency : 0
  };
};

// --- EXPORT 1: DRAFT LEAD (Partial Save) ---
// This runs silently while the AI report is generating.
export const draftLead = async (state: AppState) => {
  if (!supabase) {
    console.warn("Supabase offline. Skipping draft save.");
    return null;
  }

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

  // Construct Payload (Identity fields are NULL here)
  const payload = {
    industry: state.foundation.industry,
    revenue: state.foundation.revenue,
    primary_rar: state.auditResult?.audit_results.primary_rar || 0,
    volatility_index: state.auditResult?.audit_results.volatility_index || 0,
    risk_vectors: riskVectors,

    // Flattened Scores
    score_supply_chain_severity: getScores(state, RiskCategory.SUPPLY_CHAIN).severity,
    score_supply_chain_latency: getScores(state, RiskCategory.SUPPLY_CHAIN).latency,
    score_cash_flow_severity: getScores(state, RiskCategory.CASH_FLOW).severity,
    score_cash_flow_latency: getScores(state, RiskCategory.CASH_FLOW).latency,
    score_weather_severity: getScores(state, RiskCategory.WEATHER_PHYSICAL).severity,
    score_weather_latency: getScores(state, RiskCategory.WEATHER_PHYSICAL).latency,
    score_infrastructure_severity: getScores(state, RiskCategory.INFRASTRUCTURE_TOOLS).severity,
    score_infrastructure_latency: getScores(state, RiskCategory.INFRASTRUCTURE_TOOLS).latency,
    score_workforce_severity: getScores(state, RiskCategory.WORKFORCE).severity,
    score_workforce_latency: getScores(state, RiskCategory.WORKFORCE).latency
  };

  // Insert and return only the ID
  const { data, error } = await supabase
    .from('leads')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    console.error("Draft Save Failed:", error);
    return null;
  }

  return data.id; // Returns the ID (e.g., 42) to App.tsx
};

// --- EXPORT 2: FINALIZE LEAD (Identity Unlock) ---
// This runs when they click the button on the Teaser page.
export const finalizeLead = async (leadId: number, identity: { companyName: string, email: string }) => {
  if (!supabase) return;

  console.log(`Finalizing Lead ID: ${leadId}`);

  const { error } = await supabase
    .from('leads')
    .update({
      company_name: identity.companyName,
      email: identity.email
    })
    .eq('id', leadId); // Updates the specific row we created earlier

  if (error) {
    console.error("Finalization Failed:", error);
    throw error;
  }
  
  console.log("Lead Identity Secured.");
};