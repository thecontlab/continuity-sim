import { RiskCategory } from '../types';

export interface ScenarioQuestion {
  id: string;
  type: 'slider' | 'binary' | 'picker';
  label: string;
  options?: string[]; 
  helperText?: string;
  minLabel?: string; 
  maxLabel?: string;
  tooltip?: string; // NEW: Contextual help content
}

export interface IndustryScenario {
  contextTags: string[]; 
  q1: ScenarioQuestion;
  q2: (answer1: any) => ScenarioQuestion | null;
  calculateScore: (a1: any, a2: any) => { severity: number, latency: number };
}

const normalize = (val: number) => Math.ceil(val / 10);

// === GENERIC FALLBACK ===
const GENERIC_FALLBACK: Record<RiskCategory, IndustryScenario> = {
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Single Source', 'Logistics', 'Quality Fade'],
      q1: { 
        id: 'gen_supply', 
        type: 'slider', 
        label: 'Supplier Concentration', 
        minLabel: 'Single Source', 
        maxLabel: 'Distributed',
        tooltip: 'Risk increases when a large % of revenue relies on a single vendor. "Safe" usually means no vendor controls >20% of your input.'
      },
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
    // ... (Keep other generic risks as placeholders for now)
    [RiskCategory.CASH_FLOW]: {
       contextTags: ['Late Payments', 'Payroll'],
       q1: { id: 'gen_cash', type: 'slider', label: 'Cash Runway', minLabel: '< 30 Days', maxLabel: '6+ Months' },
       q2: () => null,
       calculateScore: (v) => ({ severity: normalize(100 - v), latency: 5 })
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
      contextTags: ['Lumber Shortage', 'Steel Tariffs', 'Vendor Insolvency', 'Shipping Delays'],
      q1: {
        id: 'supply_resilience',
        type: 'slider',
        label: 'Material Lead Time Volatility',
        helperText: 'Predictability of critical path delivery dates.',
        minLabel: 'Unpredictable',
        maxLabel: 'Guaranteed',
        tooltip: 'In construction, "Volatility" is the enemy. Even if you have a supplier, if their delivery dates fluctuate by >20%, your project schedule (and margin) is at risk.'
      },
      q2: (a1) => ({
        id: 'inventory_buffer',
        type: 'picker',
        label: 'On-Site Inventory Buffer',
        options: ['< 3 Days (JIT)', '1-2 Weeks', 'Massive Stockpile (>1 Mo)'],
        tooltip: 'Just-in-Time (JIT) is efficient for cash flow but fatal for continuity. A buffer allows you to keep working even if the supply chain breaks.'
      }),
      calculateScore: (resilience, buffer) => {
        let risk = normalize(100 - resilience); 
        if (buffer === '< 3 Days (JIT)') risk += 3;
        if (buffer === 'Massive Stockpile (>1 Mo)') risk -= 2;
        return { severity: Math.min(10, Math.max(1, risk)), latency: risk > 7 ? 8 : 4 };
      }
    }
  },

  // 2. MANUFACTURING
  'Manufacturing & Industrial': {
    ...GENERIC_FALLBACK,
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Raw Materials', 'Shipping', 'Quality Control', 'Custom Tooling'],
      q1: {
        id: 'single_source_components',
        type: 'slider',
        label: 'Single-Source Components',
        helperText: 'Percentage of BOM (Bill of Materials) that comes from exactly 1 factory.',
        minLabel: 'Multi-Sourced',
        maxLabel: 'Single-Sourced',
        tooltip: 'If a specific part (e.g., a custom chipset or molded plastic) comes from only one factory in the world, your entire production line is fragile.'
      },
      q2: (a1) => ({
        id: 'retooling_time',
        type: 'picker',
        label: 'Retooling / Switching Time',
        options: ['Rapid (< 2 Weeks)', 'Moderate (1-3 Months)', 'Painful (6+ Months)'],
        tooltip: 'If your primary vendor fails, how long does it take to validate a new mold, get a new sample approved, and ramp up production?'
      }),
      calculateScore: (dependency, time) => {
        let lat = 6;
        if (time === 'Rapid (< 2 Weeks)') lat = 3;
        if (time === 'Painful (6+ Months)') lat = 10;
        return { severity: normalize(dependency), latency: lat };
      }
    }
  },

  // 3. SAAS / SOFTWARE
  'SaaS / Software': {
    ...GENERIC_FALLBACK,
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['API Dependency', 'Vendor Insolvency', 'Price Hikes'],
      q1: {
        id: 'api_dependency',
        type: 'slider',
        label: 'Critical API Dependency',
        helperText: 'Reliance on 3rd party APIs (e.g. OpenAI, Stripe, Twilio) for core function.',
        minLabel: 'Independent',
        maxLabel: 'Totally Dependent',
        tooltip: 'Your "Supply Chain" is code. If a critical API (like an AI model or SMS gateway) goes down or triples its price, does your product stop working?'
      },
      q2: (a1) => ({
        id: 'fallback_code',
        type: 'picker',
        label: 'API Fallback Capability',
        options: ['Auto-Failover', 'Manual Switch', 'Hard-Coded / No Backup'],
        tooltip: 'Can you switch providers (e.g. from Twilio to Plivo) instantly via a code switch, or would it require a full rewrite?'
      }),
      calculateScore: (dep, fallback) => {
        let risk = normalize(dep);
        let lat = fallback === 'Auto-Failover' ? 2 : (fallback === 'Hard-Coded / No Backup' ? 9 : 5);
        return { severity: risk, latency: lat };
      }
    }
  },

  // 4. HEALTHCARE
  'Healthcare / MedTech': {
    ...GENERIC_FALLBACK,
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['PPE Shortage', 'Device Components', 'Pharma Logistics'],
      q1: { 
        id: 'single_source', 
        type: 'slider', 
        label: 'Consumable Dependency', 
        helperText: 'Reliance on specific, single-source medical supplies.',
        minLabel: 'Generics Available',
        maxLabel: 'Proprietary / Single',
        tooltip: 'In healthcare, "Single Source" can be a compliance risk. If a specific catheter or reagent is unavailable, can you legally use a substitute?'
      },
      q2: () => ({
        id: 'emergency_stock',
        type: 'picker',
        label: 'Emergency Stockpile Status',
        options: ['> 1 Month On-Hand', '1-2 Weeks', 'Just-in-Time'],
        tooltip: 'Standard practice for resilience in MedTech is often higher than retail. JIT is considered high risk for critical care items.'
      }),
      calculateScore: (val, stock) => {
        let lat = stock === '> 1 Month On-Hand' ? 3 : 8;
        return { severity: normalize(val), latency: lat };
      }
    }
  },

  // 5. RETAIL
  'Retail / E-commerce': {
    ...GENERIC_FALLBACK,
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Inventory', 'Shipping Costs', 'Seasonality', 'Port Strikes'],
      q1: {
        id: 'inventory_depth',
        type: 'slider',
        label: 'Inventory Turnover Risk',
        minLabel: 'Optimized',
        maxLabel: 'Volatile',
        tooltip: 'High volatility means you are prone to stockouts (lost revenue) or overstocking (cash flow death). Ideally, you want a stable, predictable flow.'
      },
      q2: () => ({ 
        id: '3pl_backup', 
        type: 'picker', 
        label: 'Logistics / 3PL Redundancy',
        options: ['Multiple Active Carriers', 'Single Partner + Backup', 'Single Point of Failure'],
        tooltip: 'If your main shipper raises rates or faces a strike, do you have an active account with a competitor ready to go?'
      }),
      calculateScore: (vol, backup) => ({ 
        severity: normalize(vol), 
        latency: backup === 'Single Point of Failure' ? 9 : 4 
      })
    }
  },

  // Default mappings for other industries
  'Professional Services': GENERIC_FALLBACK,
  'Financial Services / Fintech': GENERIC_FALLBACK,
  'Logistics & Transportation': GENERIC_FALLBACK, // Could customize later
  'Energy & Utilities': GENERIC_FALLBACK,
  'Other': GENERIC_FALLBACK,
  'default': GENERIC_FALLBACK
};