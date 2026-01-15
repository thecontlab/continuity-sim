import { RiskCategory } from '../types';

export interface ScenarioQuestion {
  id: string;
  type: 'slider' | 'binary' | 'picker';
  label: string;
  options?: string[]; // For picker/binary
  helperText?: string;
}

export interface IndustryScenario {
  contextTags: string[]; // "Select risks relevant to you"
  q1: ScenarioQuestion;
  q2: (answer1: any) => ScenarioQuestion | null; // Dynamic Q2 based on Q1
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
        id: 'material_volatility',
        type: 'slider',
        label: 'Material Lead Time Volatility',
        helperText: 'How unpredictable are delivery dates for critical path materials?',
        // Slider represents 0% (Stable) to 100% (Chaos)
      },
      q2: (a1) => ({
        id: 'inventory_buffer',
        type: 'picker',
        label: 'On-Site Inventory Buffer',
        options: ['< 3 Days (JIT)', '1-2 Weeks', '> 1 Month']
      }),
      calculateScore: (volatility, buffer) => {
        // High volatility + Low buffer = Max Risk
        let base = normalize(volatility); 
        if (buffer === '< 3 Days (JIT)') base += 3;
        if (buffer === '> 1 Month') base -= 2;
        // Clamp between 1 and 10
        return { 
          severity: Math.min(10, Math.max(1, base)), 
          latency: base > 7 ? 8 : 4 
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
      },
      q2: () => ({
        id: 'sub_backup',
        type: 'binary',
        label: 'Do you have backup subs vetted for immediate deployment?',
        options: ['Yes, Pre-Vetted', 'No, Search Required']
      }),
      calculateScore: (reliance, backup) => {
        let score = normalize(reliance);
        if (backup === 'No, Search Required') score += 2; // Higher latency risk
        return { 
          severity: Math.min(10, Math.max(1, score)), 
          latency: backup === 'No, Search Required' ? 9 : 3 
        };
      }
    },
    // Fallbacks for other categories in Construction
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
       q1: { id: 'outdoor_ops', type: 'slider', label: '% of Ops Dependent on Weather', helperText: '0% = Indoor, 100% = Outdoor' },
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
    // Fallbacks for Healthcare
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['PPE Shortage', 'Device Components', 'Pharma Logistics'],
      q1: { id: 'single_source', type: 'slider', label: 'Single Source Dependency', helperText: 'Exposure to one critical vendor' },
      q2: () => null,
      calculateScore: (val) => ({ severity: normalize(val), latency: 5 })
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['Insurance Reimbursement', 'Billing Cycles'],
      q1: { id: 'reimbursement_delay', type: 'picker', label: 'Avg Reimbursement Cycle', options: ['< 30 Days', '30-90 Days', '90+ Days'] },
      q2: () => null,
      calculateScore: (delay) => ({ severity: delay === '90+ Days' ? 9 : 4, latency: 5 })
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Burnout', 'Specialized Surgeons', 'Nurses'],
      q1: { id: 'turnover', type: 'slider', label: 'Clinical Staff Turnover', helperText: '0% = Low, 100% = High' },
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
      q1: { id: 'generic_supply', type: 'slider', label: 'Supplier Concentration Risk', helperText: '0% = Diversified, 100% = Single Source' },
      q2: () => ({ id: 'generic_recovery', type: 'binary', label: 'Backup Plan Tested?', options: ['Yes', 'No'] }),
      calculateScore: (conc, tested) => ({ 
        severity: normalize(conc), 
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
       q1: { id: 'location', type: 'slider', label: 'Physical Vulnerability', helperText: 'Exposure to natural disasters' },
       q2: () => null,
       calculateScore: (val) => ({ severity: normalize(val), latency: 5 })
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
        contextTags: ['SaaS Outage', 'Data Loss'],
        q1: { id: 'dependency', type: 'slider', label: 'Platform Dependency', helperText: 'Reliance on proprietary tools' },
        q2: () => null,
        calculateScore: (val) => ({ severity: normalize(val), latency: 5 })
    },
    [RiskCategory.WORKFORCE]: {
        contextTags: ['Key Person Risk', 'Burnout'],
        q1: { id: 'bus_factor', type: 'slider', label: 'Key Person Dependency', helperText: 'If 1 person leaves, does the business stop?' },
        q2: () => null,
        calculateScore: (val) => ({ severity: normalize(val), latency: 5 })
    }
  }
};