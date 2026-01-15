import React, { useState } from 'react';
import { Header } from './components/Header';
import { StageFoundation } from './components/StageFoundation';
import { StageRiskAudit } from './components/StageRiskAudit';
import { StageTeaser } from './components/StageTeaser';
import { StageReport } from './components/StageReport';
import { TerminalLoader } from './components/TerminalLoader';
import { generateAuditReport } from './services/geminiService';
import { submitLead } from './services/supabaseService';
import { AppState, AuditStage, FoundationData, RiskInput, IdentityData } from './types';

function App() {
  const [state, setState] = useState<AppState>({
    stage: AuditStage.FOUNDATION,
    foundation: { industry: '', revenue: 0 },
    riskInputs: [],
    identity: { companyName: '', email: '' },
    auditResult: null
  });

  const [error, setError] = useState<string | null>(null);

  const handleFoundationComplete = (data: FoundationData) => {
    setState(prev => ({ ...prev, foundation: data, stage: AuditStage.RISK_AUDIT }));
  };

  const handleAuditComplete = async (inputs: RiskInput[]) => {
    setState(prev => ({ ...prev, riskInputs: inputs, stage: AuditStage.PROCESSING }));
    
    try {
      const result = await generateAuditReport(state.foundation, inputs);
      // Artificial delay to allow the terminal animation to finish if it's too fast
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      setState(prev => ({ 
        ...prev, 
        auditResult: result,
        stage: AuditStage.TEASER 
      }));
    } catch (e) {
      console.error(e);
      setError("AUDIT GENERATION FAILED. PLEASE RETRY.");
      setState(prev => ({ ...prev, stage: AuditStage.RISK_AUDIT }));
    }
  };

  const handleIdentityUnlock = async (identity: IdentityData) => {
    // 1. Update State locally first so UI feels responsive
    const newState = { 
      ...state, 
      identity, 
      stage: AuditStage.FULL_REPORT 
    };
    setState(newState);

    // 2. Submit to Supabase in background
    try {
      await submitLead(newState);
      console.log("Lead secured in database.");
    } catch (dbError) {
      // We do not block the user from seeing the report if DB fails, 
      // but we log it for the admin.
      console.error("Failed to save lead:", dbError);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Global Tactical Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-10" 
           style={{
             backgroundImage: 'linear-gradient(#1F2937 1px, transparent 1px), linear-gradient(90deg, #1F2937 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }} 
      />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          
          {state.stage === AuditStage.FOUNDATION && (
            <StageFoundation onComplete={handleFoundationComplete} />
          )}

          {state.stage === AuditStage.RISK_AUDIT && (
            <StageRiskAudit 
              industry={state.foundation.industry}
              onComplete={handleAuditComplete} 
              />
          )}

          {state.stage === AuditStage.PROCESSING && (
            <TerminalLoader />
          )}

          {state.stage === AuditStage.TEASER && state.auditResult && (
            <StageTeaser data={state.auditResult} onUnlock={handleIdentityUnlock} />
          )}

          {state.stage === AuditStage.FULL_REPORT && state.auditResult && (
            <StageReport data={state.auditResult} identity={state.identity} />
          )}

          {error && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#DC2626] text-white px-6 py-4 rounded-none border border-red-900 shadow-2xl font-mono text-sm uppercase tracking-wider">
              [!] CRITICAL ERROR: {error}
            </div>
          )}

        </main>

        <footer className="text-center py-8 text-[#374151] text-[10px] font-mono tracking-widest uppercase">
          &copy; {new Date().getFullYear()} THE CONTINUITY ADVISOR // SYSTEM VERSION 2.2
        </footer>
      </div>
    </div>
  );
}

export default App;