import React, { useState } from 'react';
import { Header } from './components/Header';
import { StageFoundation } from './components/StageFoundation';
import { StageRiskAudit } from './components/StageRiskAudit';
import { StageTeaser } from './components/StageTeaser';
import { StageReport } from './components/StageReport';
import { TerminalLoader } from './components/TerminalLoader';
import { generateAuditReport } from './services/geminiService';
// ARCHITECT UPDATE: Imported split service functions
import { draftLead, finalizeLead } from './services/supabaseService';
import { AppState, AuditStage, FoundationData, RiskInput, IdentityData } from './types';

function App() {
  const [state, setState] = useState<AppState>({
    stage: AuditStage.FOUNDATION,
    foundation: { industry: '', revenue: 0 },
    riskInputs: [],
    identity: { companyName: '', email: '' },
    auditResult: null,
    leadId: undefined // Initialize as undefined
  });

  const [error, setError] = useState<string | null>(null);

  const handleFoundationComplete = (data: FoundationData) => {
    setState(prev => ({ ...prev, foundation: data, stage: AuditStage.RISK_AUDIT }));
  };

  const handleAuditComplete = async (inputs: RiskInput[]) => {
    // 1. Enter Processing State immediately
    const processingState = { 
      ...state, 
      riskInputs: inputs, 
      stage: AuditStage.PROCESSING 
    };
    setState(processingState);
    
    try {
      // 2. PARALLEL EXECUTION:
      // - Generate the AI Strategy Report
      // - Save the "Draft" Lead to Database (Shadow Capture)
      const [aiResult, dbId] = await Promise.all([
        generateAuditReport(state.foundation, inputs),
        draftLead(processingState)
      ]);

      // Artificial delay to allow the terminal animation to finish cleanly
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      setState(prev => ({ 
        ...prev, 
        auditResult: aiResult,
        stage: AuditStage.TEASER,
        leadId: dbId || undefined // Store the DB ID for the final update
      }));

    } catch (e) {
      console.error("Audit Workflow Failed:", e);
      setError("AUDIT GENERATION FAILED. PLEASE RETRY.");
      setState(prev => ({ ...prev, stage: AuditStage.RISK_AUDIT }));
    }
  };

  const handleIdentityUnlock = async (identity: IdentityData) => {
    // 1. Update UI immediately to show the report
    setState(prev => ({ 
      ...prev, 
      identity, 
      stage: AuditStage.FULL_REPORT 
    }));

    // 2. Background: Update the lead with full context to trigger email
    if (state.leadId && state.auditResult) {
      try {
        await finalizeLead(state.leadId, identity, {
          foundation: state.foundation,
          riskInputs: state.riskInputs,
          auditResult: state.auditResult
        });
        console.log(`Lead #${state.leadId} finalized with full context.`);
      } catch (dbError) {
        console.error("Failed to finalize lead identity:", dbError);
      }
    } else {
      console.warn("No Lead ID or Result found. Data saved as anonymous draft only.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-