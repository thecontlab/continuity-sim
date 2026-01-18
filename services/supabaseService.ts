import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, RiskCategory } from '../types';

// ARCHITECT NOTE: Updated to use Vite env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase credentials missing. Data will not be saved.");
}

export const submitLead = async (state: AppState) => {
  if (!supabase) return;

  // 1. Helper to extract flat scores for the dashboard columns
  const getScores = (category: RiskCategory) => {
    const input = state.riskInputs.find(i => i.category === category);
    return {
      severity: input ? input.severity : 0,
      latency: input ? input.latency : 0
    };
  };

  // 2. Prepare the Dynamic Risk Vectors (JSON)
  // This maps the user's specific answers into the JSONB column
  const riskVectorData = state.riskInputs.map(input => ({
    category: input.category,
    scores: { severity: input.severity, latency: input.latency },
    metadata: input.metadata || {} // Captures Q1/Q2 labels and answers
  }));

  const payload = {
    // Identity
    company_name: state.identity.companyName,
    email: state.identity.email,
    industry: state.foundation.industry,
    revenue: state.foundation.revenue,

    // High-Level Metrics
    primary_rar: state.auditResult?.audit_results.primary_rar || 0,
    volatility_index: state.auditResult?.audit_results.volatility_index || 0,

    // The Dynamic Context
    risk_vectors: riskVectorData,

    // Flattened Scores (Map existing inputs to DB columns)
    score_supply_chain_severity: getScores(RiskCategory.SUPPLY_CHAIN).severity,
    score_supply_chain_latency: getScores(RiskCategory.SUPPLY_CHAIN).latency,

    score_cash_flow_severity: getScores(RiskCategory.CASH_FLOW).severity,
    score_cash_flow_latency: getScores(RiskCategory.CASH_FLOW).latency,

    score_weather_severity: getScores(RiskCategory.WEATHER_PHYSICAL).severity,
    score_weather_latency: getScores(RiskCategory.WEATHER_PHYSICAL).latency,

    score_infrastructure_severity: getScores(RiskCategory.INFRASTRUCTURE_TOOLS).severity,
    score_infrastructure_latency: getScores(RiskCategory.INFRASTRUCTURE_TOOLS).latency,

    score_workforce_severity: getScores(RiskCategory.WORKFORCE).severity,
    score_workforce_latency: getScores(RiskCategory.WORKFORCE).latency
  };

  const { data, error } = await supabase
    .from('leads')
    .insert([payload])
    .select();

  if (error) {
    console.error('Supabase Submission Error:', error);
    throw error;
  }

  return data;
};