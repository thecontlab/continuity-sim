import { RiskCategory } from '../types';

export interface ScenarioQuestion {
  id: string;
  type: 'slider' | 'binary' | 'picker'; // 'binary' is treated as picker now
  label: string;
  options?: string[]; 
  helperText?: string;
  minLabel?: string; 
  maxLabel?: string;
}

export interface IndustryScenario {
  contextTags: string[]; 
  q1: ScenarioQuestion;
  q2: (answer1: any) => ScenarioQuestion | null;
  calculateScore: (a1: any, a2: any) => { severity: number, latency: number };
}

const normalize = (val: number) => Math.ceil(val / 10);

// Helper to check if the user selected the "Safe" option
// If they picked "Other" or a risky option, this returns false.
const isSafeOption = (answer: string, safeOptions: string[]) => {
  return safeOptions.includes(answer);
};

// === GENERIC FALLBACK ===
const GENERIC_FALLBACK: Record<RiskCategory, IndustryScenario> = {
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Single Source', 'Logistics', 'Quality Fade'],
      q1: { id: 'gen_supply', type: 'slider', label: 'Supplier Concentration', minLabel: 'Single Source', maxLabel: 'Distributed' },
      q2: () => ({ 
        id: 'gen_rec', 
        type: 'picker', 
        label: 'Recovery Plan Status', 
        options: ['Full Backup Active', 'Plan Exists (Untested)', 'No Plan'] 
      }),
      calculateScore: (v, a2) => ({ 
        severity: normalize(100 - v), 
        latency: a2 === 'Full Backup Active' ? 3 : (a2 === 'No Plan' ? 9 : 6)
      })
    },
    [RiskCategory.CASH_FLOW]: {
       contextTags: ['Late Payments', 'Payroll'],
       q1: { id: 'gen_cash', type: 'slider', label: 'Cash Runway', minLabel: '< 30 Days', maxLabel: '6+ Months' },
       q2: () => ({ 
         id: 'gen_AR', 
         type: 'picker', 
         label: 'Accounts Receivable Status', 
         options: ['Mostly Current', '30-60 Days Late', 'High Delinquency'] 
       }),
       calculateScore: (v, a2) => ({ 
         severity: normalize(100 - v), 
         latency: a2 === 'Mostly Current' ? 4 : 8 
       })
    },
    [RiskCategory.WORKFORCE]: {
        contextTags: ['Key Person', 'Burnout'],
        q1: { id: 'gen_wf', type: 'slider', label: 'Key Person Dependency', minLabel: 'Redundant Teams', maxLabel: 'Single Points of Failure' },
        q2: () => null,
        calculateScore: (v) => ({ severity: normalize(v), latency: 5 })
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
        contextTags: ['SaaS Outage', 'Data Loss'],
        q1: { id: 'gen_tool', type: 'slider', label: 'Platform Dependency', minLabel: 'Open Standard', maxLabel: 'Vendor Locked' },
        q2: () => null,
        calculateScore: (v) => ({ severity: normalize(v), latency: 5 })
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
       contextTags: ['Access', 'Power'],
       q1: { id: 'gen_wea', type: 'slider', label: 'Physical Vulnerability', minLabel: 'Safe Zone', maxLabel: 'High Risk Zone' },
       q2: () => null,
       calculateScore: (v) => ({ severity: normalize(v), latency: 5 })
    }
};

export const INDUSTRY_RbBS: Record<string, Record<RiskCategory, IndustryScenario>> = {
  
  // 1. CONSTRUCTION
  'Construction & Real Estate': {
    ...GENERIC_FALLBACK,
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Lumber Shortage', 'Steel Tariffs', 'Vendor Insolvency'],
      q1: {
        id: 'supply_resilience',
        type: 'slider',
        label: 'Material Lead Time Volatility',
        helperText: 'Predictability of critical path delivery dates.',
        minLabel: 'Unpredictable',
        maxLabel: 'Guaranteed'
      },
      q2: (a1) => ({
        id: 'inventory_buffer',
        type: 'picker',
        label: 'On-Site Inventory Buffer',
        options: ['< 3 Days (Just-in-Time)', '1-2 Weeks Buffer', 'Massive Stockpile (>1 Mo)']
      }),
      calculateScore: (resilience, buffer) => {
        let risk = normalize(100 - resilience); 
        // Logic: Only massive stockpile truly mitigates risk in "Other" scenarios
        if (buffer === '< 3 Days (Just-in-Time)') risk += 3;
        if (buffer === 'Massive Stockpile (>1 Mo)') risk -= 2;
        return { severity: Math.min(10, Math.max(1, risk)), latency: risk > 7 ? 8 : 4 };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Skilled Labor', 'Subcontractors', 'Safety'],
      q1: {
        id: 'sub_reliance',
        type: 'slider',
        label: 'Reliance on Subcontractors',
        minLabel: 'Self-Performed',
        maxLabel: '100% Outsourced'
      },
      q2: () => ({
        id: 'sub_backup',
        type: 'picker',
        label: 'Subcontractor Contingency',
        options: ['Multiple Vetted Backups', 'Identified but Unvetted', 'No Backups / Search Req.']
      }),
      calculateScore: (val, backup) => {
        let lat = 6; // Default/Other
        if (backup === 'Multiple Vetted Backups') lat = 3;
        if (backup === 'No Backups / Search Req.') lat = 9;
        return { severity: normalize(val), latency: lat };
      }
    }
  },

  // 2. MANUFACTURING
  'Manufacturing & Industrial': {
    ...GENERIC_FALLBACK,
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Raw Materials', 'Shipping', 'Quality Control'],
      q1: {
        id: 'single_source_components',
        type: 'slider',
        label: 'Component Redundancy',
        helperText: 'Percentage of BOM (Bill of Materials) that is single-sourced.',
        minLabel: 'Multi-Sourced',
        maxLabel: 'Single-Sourced'
      },
      q2: (a1) => ({
        id: 'retooling_time',
        type: 'picker',
        label: 'Time to switch vendors?',
        options: ['Rapid (< 2 Weeks)', 'Moderate (1-3 Months)', 'Painful (6+ Months)']
      }),
      calculateScore: (dependency, time) => {
        let lat = 6;
        if (time === 'Rapid (< 2 Weeks)') lat = 3;
        if (time === 'Painful (6+ Months)') lat = 10;
        return { severity: normalize(dependency), latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Factory Access', 'Power Grid', 'Machinery'],
      q1: {
        id: 'production_halt',
        type: 'slider',
        label: 'Downtime Cost Sensitivity',
        minLabel: 'Manageable',
        maxLabel: 'Catastrophic'
      },
      q2: () => ({ 
        id: 'spare_parts', 
        type: 'picker', 
        label: 'Spare Parts Inventory',
        options: ['Full On-Site Inventory', 'Key Parts Only', 'Order on Demand']
      }),
      calculateScore: (sens, spare) => ({ 
        severity: normalize(sens), 
        latency: spare === 'Full On-Site Inventory' ? 3 : 8 
      })
    }
  },

  // 3. SAAS / SOFTWARE
  'SaaS / Software': {
    ...GENERIC_FALLBACK,
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['AWS/Azure', 'Cybersecurity', 'Data Privacy'],
      q1: {
        id: 'cloud_lockin',
        type: 'slider',
        label: 'Infrastructure Portability',
        minLabel: 'Portable / K8s',
        maxLabel: 'Total Vendor Lock-in'
      },
      q2: (a1) => ({
        id: 'dr_plan',
        type: 'picker',
        label: 'Disaster Recovery Status',
        options: ['Automated (IaC)', 'Manual Runbook', 'No Formal Plan']
      }),
      calculateScore: (lockin, dr) => ({ 
        severity: normalize(lockin), 
        latency: dr === 'Automated (IaC)' ? 3 : 9 
      })
    }
  },

  // 4. PROFESSIONAL SERVICES
  'Professional Services': {
    ...GENERIC_FALLBACK,
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['Client Concentration', 'WIP', 'Retainers'],
      q1: {
        id: 'client_conc',
        type: 'slider',
        label: 'Revenue Concentration',
        helperText: '% of revenue from top 3 clients.',
        minLabel: 'Diversified (<20%)',
        maxLabel: 'Concentrated (>60%)'
      },
      q2: (a1) => ({
        id: 'contract_structure',
        type: 'picker',
        label: 'Contract Structure',
        options: ['Long-term Retainers', 'Mix of Both', 'One-off Projects']
      }),
      calculateScore: (conc, type) => {
        let sev = normalize(conc);
        if (type === 'One-off Projects') sev += 2; 
        return { severity: Math.min(10, sev), latency: 5 };
      }
    }
  },

  // 5. HEALTHCARE
  'Healthcare / MedTech': {
    ...GENERIC_FALLBACK,
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['EHR', 'HIPAA', 'Ransomware'],
      q1: {
        id: 'ehr_downtime',
        type: 'slider',
        label: 'Operational Dependency on EHR',
        minLabel: 'Can operate on Paper',
        maxLabel: 'Total Paralysis'
      },
      q2: () => ({ 
        id: 'cyber_insurance', 
        type: 'picker', 
        label: 'Cyber Insurance Coverage', 
        options: ['Comprehensive Policy', 'Basic Coverage', 'Self-Insured / None'] 
      }),
      calculateScore: (dep, ins) => ({ 
        severity: normalize(dep), 
        latency: ins === 'Comprehensive Policy' ? 3 : 8 
      })
    }
  },

  // 6. RETAIL / E-COMMERCE
  'Retail / E-commerce': {
    ...GENERIC_FALLBACK,
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Inventory', 'Shipping Costs', 'Seasonality'],
      q1: {
        id: 'inventory_depth',
        type: 'slider',
        label: 'Inventory Turnover Risk',
        minLabel: 'Optimized',
        maxLabel: 'Volatile'
      },
      q2: () => ({ 
        id: '3pl_backup', 
        type: 'picker', 
        label: '3PL / Shipping Redundancy',
        options: ['Multiple Active Carriers', 'Single Partner + Backup', 'Single Point of Failure']
      }),
      calculateScore: (vol, backup) => ({ 
        severity: normalize(vol), 
        latency: backup === 'Single Point of Failure' ? 9 : 4 
      })
    }
  },

  'Financial Services / Fintech': GENERIC_FALLBACK,
  'Logistics & Transportation': GENERIC_FALLBACK,
  'Energy & Utilities': GENERIC_FALLBACK,
  'Other': GENERIC_FALLBACK,
  'default': GENERIC_FALLBACK
};