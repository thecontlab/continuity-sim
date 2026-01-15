import { RiskCategory } from '../types';

export interface ScenarioQuestion {
  id: string;
  type: 'slider' | 'binary' | 'picker';
  label: string;
  options?: string[]; 
  helperText?: string;
  minLabel?: string; 
  maxLabel?: string;
  tooltip?: string; 
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
        options: ['Full Backup Active', 'Plan Exists (Untested)', 'No Plan'],
        tooltip: 'Do you have a written, tested plan to switch vendors immediately if your primary source fails?'
      }),
      calculateScore: (v, a2) => ({ 
        severity: normalize(100 - v), 
        latency: a2 === 'Full Backup Active' ? 3 : (a2 === 'No Plan' ? 9 : 6)
      })
    },
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

  // 2. SKILLED TRADES
  'Skilled Trades': {
    ...GENERIC_FALLBACK,
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Labor Shortage', 'Aging Workforce', 'Training Gaps'],
      q1: {
        id: 'hiring_difficulty',
        type: 'slider',
        label: 'Time-to-Hire for Lead Technicians',
        minLabel: '< 2 Weeks',
        maxLabel: '> 3 Months',
        tooltip: 'If your lead electrician or plumber quits today, how long until a fully qualified replacement is in the van generating revenue?'
      },
      q2: () => ({
        id: 'apprentice_ratio',
        type: 'picker',
        label: 'Apprentice Pipeline',
        options: ['Robust (1:1 Ratio)', 'Thin Pipeline', 'None / Rely on Senior Hires'],
        tooltip: 'Buying talent is expensive and slow. Building talent (Apprenticeships) lowers latency but requires upfront investment.'
      }),
      calculateScore: (time, pipe) => {
        let lat = 5;
        if (pipe === 'None / Rely on Senior Hires') lat = 9;
        if (pipe === 'Robust (1:1 Ratio)') lat = 3;
        return { severity: normalize(time), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Parts Availability', 'Distributor Lock-in', 'Price Inflation'],
      q1: {
        id: 'parts_availability',
        type: 'slider',
        label: 'Parts Availability Risk',
        minLabel: 'Always in Stock',
        maxLabel: 'Backorder Hell',
        tooltip: 'Are you constantly waiting on HVAC units, breakers, or specialized fittings? Waiting = No Revenue.'
      },
      q2: () => ({
        id: 'distributor_count',
        type: 'picker',
        label: 'Distributor Redundancy',
        options: ['3+ Active Accounts', 'Single Primary + Backup', 'Single Source Loyalty'],
        tooltip: 'Loyalty to one supply house is great for pricing until they run out of stock. Do you have active credit lines elsewhere?'
      }),
      calculateScore: (avail, dist) => ({
        severity: normalize(avail),
        latency: dist === 'Single Source Loyalty' ? 8 : 4
      })
    }
  },

  // 3. SAAS / SOFTWARE
  'SaaS / Software': {
    ...GENERIC_FALLBACK,
    [RiskCategory.SUPPLY_CHAIN]: { // Mapped to API/Third Party
      contextTags: ['API Dependency', 'Vendor Insolvency', 'Price Hikes'],
      q1: {
        id: 'api_dependency',
        type: 'slider',
        label: 'Critical API Dependency',
        helperText: 'Reliance on 3rd party APIs (e.g. OpenAI, Stripe, Twilio).',
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
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Bus Factor', 'Burnout', 'IP Retention'],
      q1: {
        id: 'bus_factor',
        type: 'slider',
        label: 'Technical "Bus Factor"',
        minLabel: 'Documented / Distributed',
        maxLabel: 'Tribal Knowledge',
        tooltip: 'If your Lead Engineer gets hit by a bus (or poached by Google), does development halt? 0% = Full Documentation, 100% = Only in their head.'
      },
      q2: () => ({
        id: 'documentation',
        type: 'picker',
        label: 'Codebase Documentation',
        options: ['Live/Auto-Generated', 'Outdated Wiki', 'None / "Ask Dave"'],
        tooltip: 'Code without documentation is a liability. It increases the time required for a new hire to become productive (Latency).'
      }),
      calculateScore: (val, doc) => ({
        severity: normalize(val),
        latency: doc === 'None / "Ask Dave"' ? 9 : 4
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
        maxLabel: 'Concentrated (>60%)',
        tooltip: 'If your biggest client fires you tomorrow, do you lose >20% of your revenue? That is a solvency risk.'
      },
      q2: (a1) => ({
        id: 'contract_structure',
        type: 'picker',
        label: 'Contract Consistency',
        options: ['Long-term Retainers', 'Mix of Both', 'One-off Projects'],
        tooltip: 'Retainers provide predictable cash flow (Low Latency). "Eat what you kill" projects create feast/famine cycles (High Latency).'
      }),
      calculateScore: (conc, type) => {
        let sev = normalize(conc);
        if (type === 'One-off Projects') sev += 2; 
        return { severity: Math.min(10, sev), latency: 5 };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Partner Burnout', 'Non-Competes', 'Succession'],
      q1: {
        id: 'partner_dependence',
        type: 'slider',
        label: 'Rainmaker Dependency',
        minLabel: 'Sales System',
        maxLabel: 'Founder Led Sales',
        tooltip: 'Does new business depend entirely on the Founder\'s network? If so, the business has very little enterprise value without you.'
      },
      q2: () => ({
        id: 'mid_level_management',
        type: 'picker',
        label: 'Delivery Delegation',
        options: ['Team Delivers 100%', 'Founder Reviews Final', 'Founder Does Work'],
        tooltip: 'Can you take a 2-week vacation without the quality of work suffering? If not, you have a delivery bottleneck.'
      }),
      calculateScore: (dep, del) => ({
        severity: normalize(dep),
        latency: del === 'Founder Does Work' ? 9 : 4
      })
    }
  },

  // 5. LOGISTICS & TRANSPORTATION
  'Logistics & Transportation': {
    ...GENERIC_FALLBACK,
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Route Disruption', 'Fuel Costs', 'Vehicle Maintenance'],
      q1: {
        id: 'fleet_age',
        type: 'slider',
        label: 'Fleet Reliability (Avg Age)',
        minLabel: 'Modern (< 3 Yrs)',
        maxLabel: 'Aging (> 7 Yrs)',
        tooltip: 'Old trucks break down. Breakdown = missed delivery + repair cost + reputational damage. It is a compounding risk.'
      },
      q2: () => ({
        id: 'maintenance_plan',
        type: 'picker',
        label: 'Maintenance Protocol',
        options: ['Predictive / PM', 'Scheduled Intervals', 'Run to Failure'],
        tooltip: 'Reactive maintenance ("Run to Failure") has 10x the latency of Predictive maintenance. You cannot schedule a breakdown.'
      }),
      calculateScore: (age, plan) => {
        let lat = 4;
        if (plan === 'Run to Failure') lat = 9;
        return { severity: normalize(age), latency: lat };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Driver Shortage', 'Safety Compliance', 'Turnover'],
      q1: {
        id: 'driver_turnover',
        type: 'slider',
        label: 'Driver Turnover Rate',
        minLabel: 'Stable (< 20%)',
        maxLabel: 'High (> 80%)',
        tooltip: 'The industry average is high, but if you are constantly recruiting, your safety rating and delivery reliability will suffer.'
      },
      q2: () => ({
        id: 'driver_pipeline',
        type: 'picker',
        label: 'Recruiting Pipeline',
        options: ['Waitlist of Drivers', 'Always Hiring', 'Trucks Sitting Empty'],
        tooltip: 'A parked truck costs money. Do you have a bench of qualified drivers ready to step in?'
      }),
      calculateScore: (turn, pipe) => {
        let lat = 5;
        if (pipe === 'Trucks Sitting Empty') lat = 10;
        if (pipe === 'Waitlist of Drivers') lat = 2;
        return { severity: normalize(turn), latency: lat };
      }
    }
  },

  // 6. HEALTHCARE
  'Healthcare / MedTech': {
    ...GENERIC_FALLBACK,
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['EHR', 'HIPAA', 'Ransomware'],
      q1: {
        id: 'ehr_downtime',
        type: 'slider',
        label: 'Operational Dependency on EHR',
        minLabel: 'Can operate on Paper',
        maxLabel: 'Total Paralysis',
        tooltip: 'If the internet cuts or ransomware hits, can you legally and safely treat patients using paper charts?'
      },
      q2: () => ({ 
        id: 'cyber_insurance', 
        type: 'picker', 
        label: 'Cyber Insurance Coverage', 
        options: ['Comprehensive Policy', 'Basic Coverage', 'Self-Insured / None'],
        tooltip: 'Ransomware payments average $1M+. Do you have a policy that covers business interruption and data recovery?'
      }),
      calculateScore: (dep, ins) => ({ 
        severity: normalize(dep), 
        latency: ins === 'Comprehensive Policy' ? 3 : 8 
      })
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['PPE', 'Reagents', 'Implants'],
      q1: { 
        id: 'single_source', 
        type: 'slider', 
        label: 'Consumable Dependency', 
        minLabel: 'Generics Available',
        maxLabel: 'Proprietary / Single',
        tooltip: 'In healthcare, "Single Source" is a compliance risk. If a specific catheter is unavailable, can you legally use a substitute?'
      },
      q2: () => ({
        id: 'emergency_stock',
        type: 'picker',
        label: 'Emergency Stockpile Status',
        options: ['> 1 Month On-Hand', '1-2 Weeks', 'Just-in-Time'],
        tooltip: 'JIT is dangerous in MedTech. A 2-week buffer is often the minimum standard for resilience.'
      }),
      calculateScore: (val, stock) => {
        let lat = stock === '> 1 Month On-Hand' ? 3 : 8;
        return { severity: normalize(val), latency: lat };
      }
    }
  },

  // 7. RETAIL
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
        tooltip: 'High volatility = stockouts or dead stock. Ideally, you want a stable flow matching demand.'
      },
      q2: () => ({ 
        id: '3pl_backup', 
        type: 'picker', 
        label: 'Logistics / 3PL Redundancy',
        options: ['Multiple Active Carriers', 'Single Partner + Backup', 'Single Point of Failure'],
        tooltip: 'If your main shipper raises rates or strikes, do you have an active account with a competitor?'
      }),
      calculateScore: (vol, backup) => ({ 
        severity: normalize(vol), 
        latency: backup === 'Single Point of Failure' ? 9 : 4 
      })
    }
  },

  // 8. MANUFACTURING
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
        tooltip: 'If a specific part (e.g., a custom chipset or molded plastic) comes from only one factory, your production line is fragile.'
      },
      q2: (a1) => ({
        id: 'equipment_failure',
        type: 'picker',
        label: 'Critical Equipment Recovery',
        options: ['Rapid Repair (< 1 Wk)', 'Weeks (Parts Delay)', 'Months (Custom Import)'],
        tooltip: 'Focus on your single most critical machine. If it fails today and parts are unavailable, how long until you are back online?'
      }),
      calculateScore: (dependency, time) => {
        let lat = 6;
        if (time === 'Rapid Repair (< 1 Wk)') lat = 3;
        if (time === 'Months (Custom Import)') lat = 10;
        return { severity: normalize(dependency), latency: lat };
      }
    }
  },

  'Financial Services / Fintech': GENERIC_FALLBACK,
  'Energy & Utilities': GENERIC_FALLBACK,
  'Other': GENERIC_FALLBACK,
  'default': GENERIC_FALLBACK
};