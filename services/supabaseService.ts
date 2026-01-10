import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, RiskCategory } from '../types';

// Initialize Supabase Client
// Ensure these environment variables are set in your deployment context
const supabaseUrl = process.env.SUPABASE_URL || 'https://rcpjbuudyvndqvrcrbgy.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Conditional initialization to prevent crash if keys are missing
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn("Supabase client initialization failed:", err);
  }
}

export const submitLead = async (state: AppState) => {
  if (!state.identity.email || !state.identity.companyName) {
    throw new Error("Missing identity information");
  }

  // Graceful fallback if Supabase is not configured
  // This allows the app to function in demo/preview modes without crashing
  if (!supabase) {
    console.warn("Supabase credentials (SUPABASE_ANON_KEY) are missing. Skipping database save.");
    // Return a mock success response so the UI flow continues
    return [{ status: 'mock_success', message: 'Supabase keys missing' }];
  }

  // Helper to find scores for a specific category
  const getScores = (category: RiskCategory) => {
    const input = state.riskInputs.find(i => i.category === category);
    return {
      severity: input ? input.severity : 0,
      latency: input ? input.latency : 0
    };
  };

  const supplyChain = getScores(RiskCategory.SUPPLY_CHAIN);
  const cashFlow = getScores(RiskCategory.CASH_FLOW);
  const weather = getScores(RiskCategory.WEATHER_PHYSICAL);
  const infrastructure = getScores(RiskCategory.INFRASTRUCTURE_TOOLS);
  const workforce = getScores(RiskCategory.WORKFORCE);

  const payload = {
    company_name: state.identity.companyName,
    email: state.identity.email,
    industry: state.foundation.industry,
    revenue: state.foundation.revenue,
    
    // Derived Calculations (Safe access in case Gemini failed partway, though unlikely at this stage)
    primary_rar: state.auditResult?.audit_results.primary_rar || 0,
    volatility_index: state.auditResult?.audit_results.volatility_index || 0,

    // Flattened Risk Scores
    score_supply_chain_severity: supplyChain.severity,
    score_supply_chain_latency: supplyChain.latency,

    score_cash_flow_severity: cashFlow.severity,
    score_cash_flow_latency: cashFlow.latency,

    score_weather_severity: weather.severity,
    score_weather_latency: weather.latency,

    score_infrastructure_severity: infrastructure.severity,
    score_infrastructure_latency: infrastructure.latency,

    score_workforce_severity: workforce.severity,
    score_workforce_latency: workforce.latency
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