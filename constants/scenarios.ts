import { RiskCategory } from '../types';

export interface ScenarioQuestion {
  id: string;
  type: 'slider' | 'binary' | 'picker';
  label: string;
  options?: string[]; // For picker/binary
  helperText?: string;
  // NEW: Dynamic labels for slider endpoints
  minLabel?: string; 
  maxLabel?: string;
}

export interface IndustryScenario {
  contextTags: string[]; 
  q1: ScenarioQuestion;
  q2: (answer1: any) => ScenarioQuestion | null;
  calculateScore: (a1: any, a2: any) => { severity: number, latency: number };
}

// Helper to map 0-100 inputs to 1-10 severity
const normalize = (val: number) => Math.ceil(val / 10);

export const INDUSTRY_RbBS: Record<string, Record<RiskCategory, IndustryScenario>> = {
  
  // === CONSTRUCTION & REAL ESTATE ===
  'Construction & Real Estate': {
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Lumber Shortage', 'Steel Tariffs', 'Vendor Insolvency', 'Shipping Delays'],
      q1: {
        id: 'supply_resilience',
        type: 'slider',
        label: 'Supply Chain Diversification',
        helperText: 'How dependent are you on a single provider for critical materials?',
        // Slider: 0 = Bad (Single), 100 = Good (Dynamic)
        minLabel: 'Single Source (Critical)',
        maxLabel: 'Dynamic / Multi-Vendor',
      },
      q2: (a1) => ({
        id: 'inventory_buffer',
        type: 'picker',
        label: 'On-Site Inventory Buffer',
        options: ['< 3 Days (JIT)', '1-2 Weeks', '> 1 Month']
      }),
      calculateScore: (resilience, buffer) => {
        // INVERTED LOGIC: High Resilience (100) = Low Risk (0)
        // We use (100 - resilience) to get the risk factor
        let riskFactor = normalize(100 - resilience); 
        
        if (buffer === '< 3 Days (JIT)') riskFactor += 3;
        if (buffer === '> 1 Month') riskFactor -= 2;

        return { 
          severity: Math.min(10, Math.max(1, riskFactor)), 
          latency: riskFactor > 7 ? 8 : 4 
        };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Skilled Labor Shortage', 'Subcontractor Reliance', 'Safety Incidents'],
      q1: {
        id: 'sub_reliance',
        type: 'slider',
        label: 'Reliance on Subcontractors',
        helperText: 'Percentage of critical path work outsourced vs. self-performed.',
        minLabel: '100% Self-Performed',
        maxLabel: '100% Outsourced'
      },
      q2: () => ({
        id: 'sub_backup',
        type: 'binary',
        label: 'Do you have backup subs vetted for immediate deployment?',
        options: ['Yes, Pre-Vetted', 'No, Search Required']
      }),
      calculateScore: (reliance, backup) => {
        // High Reliance (100) = High Risk
        let score = normalize(reliance);
        if (backup === 'No, Search Required') score += 2; 
        return { 
          severity: Math.min(10, Math.max(1, score)), 
          latency: backup === 'No, Search Required' ? 9 : 3 
        };
      }
    },
    // Fallbacks
    [RiskCategory.CASH_FLOW]: {
       contextTags: ['Project Delays', 'Retainage', 'Draw Schedules'],
       q1: { id: 'draw_delay', type: 'picker', label: 'Avg Draw Payment Delay', options: ['< 30 Days', '30-60 Days', '60+ Days'] },
       q2: () => ({ id: 'float_cash', type: 'binary', label: 'Can you float payroll for 2 months?', options: ['Yes', 'No'] }),
       calculateScore: (delay, float) => ({ 
         severity: delay === '60+ Days' ? 9 : 5, 
         latency: float === 'No' ? 10 : 3 
       })
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
       contextTags: ['Site Access', 'Equipment Damage', 'Storms'],
       q1: { 
         id: 'outdoor_ops', 
         type: 'slider', 
         label: '% of Ops Dependent on Weather', 
         helperText: 'How much of your production stops during severe weather?',
         minLabel: '0% (Indoor/Protected)',
         maxLabel: '100% (Fully Exposed)'
       },
       q2: () => null,
       calculateScore: (val) => ({ severity: normalize(val), latency: 6 })
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
        contextTags: ['Procore Downtime', 'Blueprint Access'],
        q1: { id: 'offline_prints', type: 'binary', label: 'Can site operate if cloud blueprints are offline?', options: ['Yes (Paper Backups)', 'No (Work Stops)'] },
        q2: () => null,
        calculateScore: (offline) => ({ severity: offline === 'No (Work Stops)' ? 9 : 2, latency: 4 })
    }
  },

  // === HEALTHCARE / MEDTECH ===
  'Healthcare / MedTech': {
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['EHR Downtime', 'Ransomware', 'Power Failure', 'Device Connectivity'],
      q1: {
        id: 'downtime_tolerance',
        type: 'picker',
        label: 'Maximum Tolerable Downtime (EHR)',
        options: ['Zero (Critical)', '< 4 Hours', '> 24 Hours']
      },
      q2: (a1) => ({
        id: 'offline_protocol',
        type: 'binary',
        label: 'Is there a practiced "Paper Protocol" for offline ops?',
        options: ['Yes, Drill Quarterly', 'No / Outdated']
      }),
      calculateScore: (tolerance, protocol) => {
        let sev = 5;
        if (tolerance === 'Zero (Critical)') sev = 10;
        if (tolerance === '< 4 Hours') sev = 7;
        
        let lat = protocol === 'No / Outdated' ? 10 : 2;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['PPE Shortage', 'Device Components', 'Pharma Logistics'],
      q1: { 
        id: 'single_source', 
        type: 'slider', 
        label: 'Supplier Redundancy', 
        helperText: 'Do you have qualified backups for critical medical supplies?',
        minLabel: 'Single Source (Critical)',
        maxLabel: 'Multi-Vendor (Safe)'
      },
      q2: () => null,
      calculateScore: (val) => ({ severity: normalize(100 - val), latency: 5 })
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['Insurance Reimbursement', 'Billing Cycles'],
      q1: { id: 'reimbursement_delay', type: 'picker', label: 'Avg Reimbursement Cycle', options: ['< 30 Days', '30-90 Days', '90+ Days'] },
      q2: () => null,
      calculateScore: (delay) => ({ severity: delay === '90+ Days' ? 9 : 4, latency: 5 })
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Burnout', 'Specialized Surgeons', 'Nurses'],
      q1: { 
        id: 'turnover', 
        type: 'slider', 
        label: 'Clinical Staff Turnover', 
        helperText: 'Annual rate of attrition for key clinical roles.',
        minLabel: 'Low (< 5%)',
        maxLabel: 'High (> 20%)'
      },
      q2: () => null,
      calculateScore: (val) => ({ severity: normalize(val), latency: 7 })
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Generator Failure', 'Patient Access', 'Flooding'],
      q1: { id: 'backup_power', type: 'binary', label: 'Redundant Power > 48 Hours?', options: ['Yes', 'No'] },
      q2: () => null,
      calculateScore: (backup) => ({ severity: backup === 'No' ? 10 : 2, latency: 3 })
    }
  },

  // === GENERIC / DEFAULT ===
  'default': {
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Single Source', 'Logistics', 'Quality Fade'],
      q1: { 
        id: 'generic_supply', 
        type: 'slider', 
        label: 'Supplier Concentration', 
        helperText: 'Level of dependency on your top 3 vendors.',
        minLabel: 'Single Source (Risky)',
        maxLabel: 'Distributed (Safe)'
      },
      q2: () => ({ id: 'generic_recovery', type: 'binary', label: 'Backup Plan Tested?', options: ['Yes', 'No'] }),
      calculateScore: (conc, tested) => ({ 
        // Inverted: 0 (Single) is bad, 100 (Distributed) is good
        severity: normalize(100 - conc), 
        latency: tested === 'No' ? 8 : 4 
      })
    },
    [RiskCategory.CASH_FLOW]: {
       contextTags: ['Late Payments', 'Payroll Pressure'],
       q1: { id: 'runway', type: 'picker', label: 'Cash Runway (Zero Revenue)', options: ['< 1 Month', '3 Months', '6+ Months'] },
       q2: () => null,
       calculateScore: (runway) => ({ severity: runway === '< 1 Month' ? 9 : (runway === '3 Months' ? 5 : 2), latency: 5 })
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
       contextTags: ['Flood', 'Power Outage', 'Access'],
       q1: { 
         id: 'location', 
         type: 'slider', 
         label: 'Physical Vulnerability', 
         helperText: 'Exposure to natural disasters based on HQ location.',
         minLabel: 'Safe Zone',
         maxLabel: 'High Risk Zone'
       },
       q2: () => null,
       calculateScore: (val) => ({ severity: normalize(val), latency: 5 })
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
        contextTags: ['SaaS Outage', 'Data Loss'],
        q1: { 
          id: 'dependency', 
          type: 'slider', 
          label: 'Platform Dependency', 
          helperText: 'Reliance on proprietary tools / Walled Gardens.',
          minLabel: 'Open Standard',
          maxLabel: 'Vendor Locked'
        },
        q2: () => null,
        calculateScore: (val) => ({ severity: normalize(val), latency: 5 })
    },
    [RiskCategory.WORKFORCE]: {
        contextTags: ['Key Person Risk', 'Burnout'],
        q1: { 
          id: 'bus_factor', 
          type: 'slider', 
          label: 'Key Person Dependency', 
          helperText: 'If 1 person leaves, does the business stop?',
          minLabel: 'Redundant Teams',
          maxLabel: 'Single Points of Failure'
        },
        q2: () => null,
        calculateScore: (val) => ({ severity: normalize(val), latency: 5 })
    }
  }
};