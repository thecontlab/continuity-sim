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
      contextTags: [],
      q1: { 
        id: 'gen_supply', 
        type: 'slider', 
        label: 'Supplier Concentration', 
        minLabel: 'Single Source', 
        maxLabel: 'Distributed',
        tooltip: 'Rate your reliance on a single vendor. Choose "Single Source" if one vendor controls >20% of your input.'
      },
      q2: () => ({ 
        id: 'gen_rec', 
        type: 'picker', 
        label: 'Recovery Plan Status', 
        options: ['Full Backup Active', 'Plan Exists (Untested)', 'No Plan'],
        tooltip: 'Do you have a tested plan to switch vendors immediately? Select your current readiness level.'
      }),
      calculateScore: (v, a2) => ({ 
        severity: normalize(100 - v), 
        latency: a2 === 'Full Backup Active' ? 3 : (a2 === 'No Plan' ? 9 : 6)
      })
    },
    [RiskCategory.CASH_FLOW]: {
       contextTags: [],
       q1: { 
         id: 'gen_cash', 
         type: 'slider', 
         label: 'Cash Runway (Zero Revenue)', 
         minLabel: 'Healthy (6+ Mo)', 
         maxLabel: 'Critical (< 1 Mo)',
         tooltip: 'If sales stopped today, how long could you operate? Slide left for 6+ months, right for less than 1 month.'
       },
       q2: () => ({ 
         id: 'gen_AR', 
         type: 'picker', 
         label: 'Accounts Receivable Status', 
         options: ['Mostly Current', '30-60 Days Late', 'High Delinquency'],
         tooltip: 'Select the average status of your customer payments. High delinquency means >15% of invoices are overdue.'
       }),
       calculateScore: (v, a2) => ({ 
         severity: normalize(v), 
         latency: a2 === 'Mostly Current' ? 4 : 8 
       })
    },
    [RiskCategory.WORKFORCE]: {
        contextTags: [],
        q1: { id: 'gen_wf', type: 'slider', label: 'Key Person Dependency', minLabel: 'Redundant Teams', maxLabel: 'Single Points of Failure' },
        q2: () => null,
        calculateScore: (v) => ({ severity: normalize(v), latency: 5 })
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
        contextTags: [],
        q1: { id: 'gen_tool', type: 'slider', label: 'Platform Dependency', minLabel: 'Open Standard', maxLabel: 'Vendor Locked' },
        q2: () => null,
        calculateScore: (v) => ({ severity: normalize(v), latency: 5 })
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
       contextTags: [],
       q1: { 
         id: 'gen_wea', 
         type: 'slider', 
         label: 'Physical Vulnerability', 
         minLabel: 'Safe Zone', 
         maxLabel: 'High Risk Zone',
         tooltip: 'Rate your exposure to natural disasters. Choose "High Risk" if you are in a known flood, fire, or hurricane zone.'
       },
       q2: () => null,
       calculateScore: (v) => ({ severity: normalize(v), latency: 5 })
    }
};

export const INDUSTRY_RbBS: Record<string, Record<RiskCategory, IndustryScenario>> = {
  
  // 1. CONSTRUCTION
  'Construction & Real Estate': {
    ...GENERIC_FALLBACK,
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'super_depth',
        type: 'slider',
        label: 'Superintendent / PM Bench Strength',
        minLabel: 'Deep Bench',
        maxLabel: 'No Backups',
        tooltip: 'Rate your site leadership depth. Choose "No Backups" if a Superintendent quitting would stall the project.'
      },
      q2: () => ({
        id: 'labor_availability',
        type: 'picker',
        label: 'General Labor Availability',
        options: ['On-Demand Staffing', '1-2 Week Lag', 'Chronic Shortage'],
        tooltip: 'How fast can you find crew for a new job? Select "Chronic Shortage" if staffing prevents you from bidding.'
      }),
      calculateScore: (depth, labor) => {
        let lat = 5;
        if (labor === 'Chronic Shortage') lat = 9;
        return { severity: normalize(depth), latency: lat };
      }
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'pm_software_reliance',
        type: 'slider',
        label: 'Digital Project Management Reliance',
        minLabel: 'Paper / Hybrid',
        maxLabel: '100% Cloud (Procore)',
        tooltip: 'Rate your dependency on cloud software. Choose "100% Cloud" if the site cannot operate without internet access.'
      },
      q2: () => ({
        id: 'offline_blueprints',
        type: 'picker',
        label: 'Offline Site Capability',
        options: ['Local Backups (iPad/Paper)', 'Slow Mobile Hotspots', 'Work Stoppage'],
        tooltip: 'If the internet fails, can work continue? Select "Work Stoppage" if crews cannot access blueprints.'
      }),
      calculateScore: (rel, off) => {
        let sev = normalize(rel);
        let lat = 4;
        if (off === 'Work Stoppage') lat = 10;
        if (off === 'Local Backups (iPad/Paper)') lat = 3;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'site_exposure',
        type: 'slider',
        label: 'Active Sites in High-Risk Zones',
        helperText: 'Percentage of active revenue in flood plains, fire zones, or hurricane paths.',
        minLabel: 'Safe / Indoor',
        maxLabel: '100% Exposed',
        tooltip: 'What % of your active sites are in danger zones? Slide right if most revenue comes from vulnerable areas.'
      },
      q2: () => ({
        id: 'weather_clauses',
        type: 'picker',
        label: 'Contract Protection (Force Majeure)',
        options: ['Day-for-Day + Costs', 'Time Extension Only', 'No Relief (We Eat Cost)'],
        tooltip: 'Who pays for weather delays? Select "No Relief" if you absorb the cost of idle labor and equipment.'
      }),
      calculateScore: (exp, clause) => {
        let sev = normalize(exp);
        let lat = 5;
        if (clause === 'No Relief (We Eat Cost)') lat = 9;
        if (clause === 'Day-for-Day + Costs') lat = 3;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
       contextTags: [],
       q1: { 
         id: 'draw_delay', 
         type: 'slider', 
         label: 'Avg. Draw Payment Delay', 
         minLabel: 'Net 15 (Fast)',
         maxLabel: 'Net 90+ (Slow)',
         tooltip: 'How long between paying your labor and getting paid by the owner? Slide right for longer delays (Net 90).'
       },
       q2: () => ({ 
         id: 'float_cash', 
         type: 'picker', 
         label: 'Payroll Float Capacity', 
         options: ['3+ Payrolls (Safe)', '1-2 Payrolls', 'Payroll-to-Payroll'],
         tooltip: 'If a payment is frozen, how long can you make payroll? Select "Payroll-to-Payroll" if you have no cash buffer.'
       }),
       calculateScore: (delay, float) => {
         let sev = normalize(delay);
         let lat = 5;
         if (float === 'Payroll-to-Payroll') lat = 10;
         if (float === '3+ Payrolls (Safe)') lat = 3;
         return { severity: sev, latency: lat };
       }
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: [],
      q1: {
        id: 'supply_resilience',
        type: 'slider',
        label: 'Material Lead Time Volatility',
        helperText: 'Predictability of critical path delivery dates.',
        minLabel: 'Unpredictable',
        maxLabel: 'Guaranteed',
        tooltip: 'Rate the reliability of material delivery dates. Slide left if dates constantly shift, right if they never miss.'
      },
      q2: (a1) => ({
        id: 'inventory_buffer',
        type: 'picker',
        label: 'On-Site Inventory Buffer',
        options: ['< 3 Days (JIT)', '1-2 Weeks', 'Massive Stockpile (>1 Mo)'],
        tooltip: 'How much material is on site? Select "JIT" if you rely on daily deliveries to keep working.'
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
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'fsm_dependence',
        type: 'slider',
        label: 'Field Service Software Reliance',
        minLabel: 'Paper / Whiteboard',
        maxLabel: '100% Digital (ServiceTitan)',
        tooltip: 'Rate your dependency on FSM software. Choose "100% Digital" if you cannot dispatch without the app.'
      },
      q2: () => ({
        id: 'manual_dispatch',
        type: 'picker',
        label: 'Manual Dispatch Protocol',
        options: ['Paper/Phone Backup', 'Chaotic / Ad-Hoc', 'Trucks Parked'],
        tooltip: 'If the software fails, can you dispatch? Select "Trucks Parked" if operations would stop completely.'
      }),
      calculateScore: (dep, man) => {
        let sev = normalize(dep);
        let lat = 4;
        if (man === 'Trucks Parked') lat = 10;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'fleet_resilience',
        type: 'slider',
        label: 'Fleet All-Weather Capability',
        minLabel: '4WD / All-Weather',
        maxLabel: 'Fair Weather Only',
        tooltip: 'Can your fleet operate in snow/flood? Slide right if vehicles are unable to roll in bad weather.'
      },
      q2: () => ({
        id: 'surge_capacity',
        type: 'picker',
        label: 'Emergency Surge Capacity',
        options: ['Overtime/On-Call Ready', 'Stretched Thin', 'Rejecting Calls'],
        tooltip: 'Can you handle emergency demand spikes (e.g., frozen pipes)? Select "Rejecting Calls" if you are at max capacity.'
      }),
      calculateScore: (fleet, surge) => {
        let sev = normalize(fleet);
        let lat = 5;
        if (surge === 'Rejecting Calls') lat = 9;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: [],
      q1: {
        id: 'ar_aging',
        type: 'slider',
        label: 'Avg. Invoice Collection Time',
        minLabel: 'COD / Net 7',
        maxLabel: 'Net 60+',
        tooltip: 'How fast do customers pay? Slide right if you typically wait 60+ days for payment.'
      },
      q2: () => ({
        id: 'credit_utilization',
        type: 'picker',
        label: 'Line of Credit Utilization',
        options: ['< 30% (Healthy)', '50-80% (Strained)', 'Maxed / Personal Cards'],
        tooltip: 'How much debt are you carrying? Select "Maxed" if you are using credit lines to cover operating costs.'
      }),
      calculateScore: (aging, util) => {
        let lat = 4;
        if (util === 'Maxed / Personal Cards') lat = 10;
        return { severity: normalize(aging), latency: lat };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'hiring_difficulty',
        type: 'slider',
        label: 'Time-to-Hire for Lead Technicians',
        minLabel: '< 2 Weeks',
        maxLabel: '> 3 Months',
        tooltip: 'How long to replace a lead technician? Slide right if it takes more than 3 months to find qualified talent.'
      },
      q2: () => ({
        id: 'apprentice_ratio',
        type: 'picker',
        label: 'Apprentice Pipeline',
        options: ['Robust (1:1 Ratio)', 'Thin Pipeline', 'None / Rely on Senior Hires'],
        tooltip: 'Do you train your own talent? Select "Robust" if you have a structured apprentice program.'
      }),
      calculateScore: (time, pipe) => {
        let lat = 5;
        if (pipe === 'None / Rely on Senior Hires') lat = 9;
        if (pipe === 'Robust (1:1 Ratio)') lat = 3;
        return { severity: normalize(time), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: [],
      q1: {
        id: 'parts_availability',
        type: 'slider',
        label: 'Parts Availability Risk',
        minLabel: 'Always in Stock',
        maxLabel: 'Severe Backorders', 
        tooltip: 'Are critical parts often out of stock? Slide right if you frequently experience severe backorders.'
      },
      q2: () => ({
        id: 'distributor_count',
        type: 'picker',
        label: 'Distributor Redundancy',
        options: ['3+ Active Accounts', 'Single Primary + Backup', 'Single Source Loyalty'],
        tooltip: 'How many suppliers do you use? Select "Single Source Loyalty" if you rely on just one distributor.'
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
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'platform_lockin',
        type: 'slider',
        label: 'Platform / Cloud Lock-in',
        minLabel: 'Agnostic (K8s)',
        maxLabel: 'Proprietary (Walled Garden)',
        tooltip: 'How hard is it to switch cloud providers? Slide right if you are locked into proprietary vendor tools.'
      },
      q2: () => ({
        id: 'data_sovereignty',
        type: 'picker',
        label: 'Data Portability',
        options: ['Full SQL Export', 'CSV Only', 'Vendor Proprietary Format'],
        tooltip: 'Can you export all customer data? Select "Proprietary Format" if the data is useless outside the platform.'
      }),
      calculateScore: (lock, data) => {
        let lat = 4;
        if (data === 'Vendor Proprietary Format') lat = 9;
        return { severity: normalize(lock), latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'cloud_zones',
        type: 'slider',
        label: 'Cloud Region Redundancy',
        minLabel: 'Multi-Region (Geo-Redundant)',
        maxLabel: 'Single Availability Zone',
        tooltip: 'Is your app hosted in multiple regions? Slide right if you rely on a single physical data center.'
      },
      q2: () => ({
        id: 'hq_dependency',
        type: 'picker',
        label: 'Physical Office Dependency',
        options: ['100% Remote Capable', 'Hybrid / VPN Dependent', 'On-Premises Servers'],
        tooltip: 'Can the team work if the office is closed? Select "On-Premises Servers" if you need physical access.'
      }),
      calculateScore: (zones, office) => {
        let sev = normalize(zones);
        let lat = 3;
        if (office === 'On-Premises Servers') lat = 10;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: [],
      q1: {
        id: 'runway',
        type: 'slider',
        label: 'Runway (Current Burn Rate)',
        minLabel: 'Default Alive (>18m)',
        maxLabel: 'Default Dead (<3m)',
        tooltip: 'Months until cash runs out. Slide right if you have less than 3 months of runway.'
      },
      q2: () => ({
        id: 'payment_terms',
        type: 'picker',
        label: 'Customer Payment Structure',
        options: ['Annual Upfront', 'Quarterly Mix', 'Monthly (Net 30)'],
        tooltip: 'How do customers pay? Select "Annual Upfront" for best cash flow, "Monthly" for higher risk.'
      }),
      calculateScore: (runway, terms) => {
        let lat = 5;
        if (terms === 'Annual Upfront') lat = 3;
        if (terms === 'Monthly (Net 30)') lat = 8;
        return { severity: normalize(runway), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: { 
      contextTags: [],
      q1: {
        id: 'api_dependency',
        type: 'slider',
        label: 'Critical API Dependency',
        helperText: 'Reliance on 3rd party APIs (e.g. OpenAI, Stripe, Twilio).',
        minLabel: 'Independent',
        maxLabel: 'Totally Dependent',
        tooltip: 'Rate your reliance on 3rd party APIs. Slide right if your product stops working when an API goes down.'
      },
      q2: (a1) => ({
        id: 'fallback_code',
        type: 'picker',
        label: 'API Fallback Capability',
        options: ['Auto-Failover', 'Manual Switch', 'Hard-Coded / No Backup'],
        tooltip: 'Can you switch API providers easily? Select "Hard-Coded" if switching requires a code rewrite.'
      }),
      calculateScore: (dep, fallback) => {
        let risk = normalize(dep);
        let lat = fallback === 'Auto-Failover' ? 2 : (fallback === 'Hard-Coded / No Backup' ? 9 : 5);
        return { severity: risk, latency: lat };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'bus_factor',
        type: 'slider',
        label: 'Technical "Bus Factor"',
        minLabel: 'Documented / Distributed',
        maxLabel: 'Tribal Knowledge',
        tooltip: 'Is knowledge shared or siloed? Slide right if only one person understands the core system.'
      },
      q2: () => ({
        id: 'documentation',
        type: 'picker',
        label: 'Codebase Documentation',
        options: ['Live/Auto-Generated', 'Outdated Wiki', 'None / "Ask Dave"'],
        tooltip: 'Is your code documented? Select "None" if new hires have to ask existing staff how things work.'
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
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'tool_consolidation',
        type: 'slider',
        label: 'Tooling Fragmentation',
        minLabel: 'Centralized CRM/ERP',
        maxLabel: 'Spreadsheet Chaos',
        tooltip: 'Where does your data live? Slide right if you rely on disconnected spreadsheets instead of a central CRM.'
      },
      q2: () => ({
        id: 'email_dependency',
        type: 'picker',
        label: 'Communication Redundancy',
        options: ['Slack/Teams + Email', 'Email Only', 'Personal Cell Phones'],
        tooltip: 'Do you have backup comms? Select "Email Only" if you have no alternative when email goes down.'
      }),
      calculateScore: (frag, comm) => {
        let lat = 4;
        if (comm === 'Personal Cell Phones') lat = 8;
        return { severity: normalize(frag), latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'office_dependence',
        type: 'slider',
        label: 'Physical Office Reliance',
        minLabel: 'Digital Nomad Ready',
        maxLabel: 'Server Room on Prem',
        tooltip: 'Can you work without the office? Slide right if you depend on on-premise servers or paper files.'
      },
      q2: () => ({
        id: 'remote_infra',
        type: 'picker',
        label: 'Remote Infrastructure',
        options: ['Cloud Native (Zero VPN)', 'VPN Required', 'Desktop Remote Desktop'],
        tooltip: 'How do you access files remotely? Select "Cloud Native" for best resilience, "Desktop Remote" for highest risk.'
      }),
      calculateScore: (dep, infra) => {
        let lat = 3;
        if (infra === 'Desktop Remote Desktop') lat = 8;
        return { severity: normalize(dep), latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: [],
      q1: {
        id: 'client_conc',
        type: 'slider',
        label: 'Revenue Concentration',
        helperText: '% of revenue from top 3 clients.',
        minLabel: 'Diversified (<20%)',
        maxLabel: 'Concentrated (>60%)',
        tooltip: 'How much revenue comes from your top 3 clients? Slide right if it is more than 60%.'
      },
      q2: (a1) => ({
        id: 'contract_structure',
        type: 'picker',
        label: 'Contract Consistency',
        options: ['Long-term Retainers', 'Mix of Both', 'One-off Projects'],
        tooltip: 'Are revenues recurring? Select "One-off Projects" if you have to resell every month.'
      }),
      calculateScore: (conc, type) => {
        let sev = normalize(conc);
        if (type === 'One-off Projects') sev += 2; 
        return { severity: Math.min(10, sev), latency: 5 };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'partner_dependence',
        type: 'slider',
        label: 'Rainmaker Dependency',
        minLabel: 'Sales System',
        maxLabel: 'Founder Led Sales',
        tooltip: 'Who brings in new business? Slide right if the founder is the only one who can close deals.'
      },
      q2: () => ({
        id: 'mid_level_management',
        type: 'picker',
        label: 'Delivery Delegation',
        options: ['Team Delivers 100%', 'Founder Reviews Final', 'Founder Does Work'],
        tooltip: 'Can the team deliver without you? Select "Founder Does Work" if you are a bottleneck.'
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
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'tms_uptime',
        type: 'slider',
        label: 'TMS / ELD Reliance',
        minLabel: 'Paper Logs Ready',
        maxLabel: '100% Digital Lockout',
        tooltip: 'If your ELD/TMS fails, can you drive? Slide right if trucks are legally grounded without the software.'
      },
      q2: () => ({
        id: 'routing_backup',
        type: 'picker',
        label: 'Manual Routing Capability',
        options: ['Drivers Know Routes', 'Dispatch Can Route Manually', 'Total Blindness'],
        tooltip: 'Can you route trucks manually? Select "Total Blindness" if you rely entirely on GPS automation.'
      }),
      calculateScore: (rel, backup) => {
        let sev = normalize(rel);
        let lat = 4;
        if (backup === 'Total Blindness') lat = 10;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'fleet_age',
        type: 'slider',
        label: 'Fleet Reliability (Avg Age)',
        minLabel: 'Modern (< 3 Yrs)',
        maxLabel: 'Aging (> 7 Yrs)',
        tooltip: 'How old is your fleet? Slide right if average truck age is over 7 years.'
      },
      q2: () => ({
        id: 'maintenance_plan',
        type: 'picker',
        label: 'Maintenance Protocol',
        options: ['Predictive / PM', 'Scheduled Intervals', 'Run to Failure'],
        tooltip: 'How do you handle repairs? Select "Run to Failure" if you only fix trucks when they break.'
      }),
      calculateScore: (age, plan) => {
        let lat = 4;
        if (plan === 'Run to Failure') lat = 9;
        return { severity: normalize(age), latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: [],
      q1: {
        id: 'fuel_recovery',
        type: 'slider',
        label: 'Fuel Surcharge Pass-Through',
        minLabel: '100% Pass-Through',
        maxLabel: '0% (Fixed Bids)',
        tooltip: 'Do customers pay for fuel spikes? Slide right if you are locked into fixed bids and absorb the cost.'
      },
      q2: () => ({
        id: 'factoring',
        type: 'picker',
        label: 'Invoice Factoring Dependency',
        options: ['Cash Reserves', 'Line of Credit', 'Heavy Factoring (High Fees)'],
        tooltip: 'How do you fund operations? Select "Heavy Factoring" if you sell invoices to get cash immediately.'
      }),
      calculateScore: (fuel, fact) => {
        let lat = 4;
        if (fact === 'Heavy Factoring (High Fees)') lat = 9;
        return { severity: normalize(fuel), latency: lat };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'driver_turnover',
        type: 'slider',
        label: 'Driver Turnover Rate',
        minLabel: 'Stable (< 20%)',
        maxLabel: 'High (> 80%)',
        tooltip: 'Rate your driver churn. Slide right if you are constantly recruiting to replace departing drivers.'
      },
      q2: () => ({
        id: 'driver_pipeline',
        type: 'picker',
        label: 'Recruiting Pipeline',
        options: ['Waitlist of Drivers', 'Always Hiring', 'Trucks Sitting Empty'],
        tooltip: 'Do you have drivers ready? Select "Trucks Sitting Empty" if you have vehicles with no one to drive them.'
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
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'clinical_churn',
        type: 'slider',
        label: 'Clinical Staff Turnover',
        minLabel: 'Low (< 10%)',
        maxLabel: 'Crisis (> 30%)',
        tooltip: 'Rate your clinical staff turnover. Slide right if more than 30% of staff leave annually.'
      },
      q2: () => ({
        id: 'credentialing_lag',
        type: 'picker',
        label: 'New Hire Credentialing Lag',
        options: ['Fast (< 30 Days)', 'Standard (60 Days)', 'Slow (> 90 Days)'],
        tooltip: 'How long to bill for a new hire? Select "Slow" if it takes over 90 days to credential a new provider.'
      }),
      calculateScore: (churn, lag) => {
        let lat = 5;
        if (lag === 'Slow (> 90 Days)') lat = 9;
        return { severity: normalize(churn), latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'backup_power',
        type: 'slider',
        label: 'Backup Power Autonomy',
        minLabel: '> 96 Hours',
        maxLabel: 'None / UPS Only',
        tooltip: 'How long can you run on generators? Slide right if you have no backup power or only UPS batteries.'
      },
      q2: () => ({
        id: 'facility_access',
        type: 'picker',
        label: 'Physical Access Redundancy',
        options: ['Multiple Routes/Entrances', 'Single Access Road', 'Flood Prone Zone'],
        tooltip: 'Can ambulances reach you in a flood? Select "Flood Prone Zone" if access can be cut off.'
      }),
      calculateScore: (power, access) => {
        let sev = normalize(power);
        let lat = 4;
        if (access === 'Flood Prone Zone') lat = 9;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: [],
      q1: {
        id: 'reimbursement_cycle',
        type: 'slider',
        label: 'Avg. Reimbursement Cycle',
        minLabel: 'Fast (< 30 Days)',
        maxLabel: 'Slow (> 90 Days)',
        tooltip: 'How fast do insurers pay? Slide right if you typically wait more than 90 days for reimbursement.'
      },
      q2: () => ({
        id: 'claim_denials',
        type: 'picker',
        label: 'First-Pass Claim Denial Rate',
        options: ['< 5% (Efficient)', '5-15% (Average)', '> 15% (Revenue Leak)'],
        tooltip: 'How many claims are denied? Select "> 15%" if you have a high rate of initial rejections.'
      }),
      calculateScore: (cycle, den) => {
        let sev = normalize(cycle);
        let lat = 5;
        if (den === '> 15% (Revenue Leak)') lat = 9;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'ehr_downtime',
        type: 'slider',
        label: 'Operational Dependency on EHR',
        minLabel: 'Can operate on Paper',
        maxLabel: 'Total Paralysis',
        tooltip: 'If the EHR goes down, can you treat patients? Slide right if operations stop completely.'
      },
      q2: () => ({ 
        id: 'cyber_insurance', 
        type: 'picker', 
        label: 'Cyber Insurance Coverage', 
        options: ['Comprehensive Policy', 'Basic Coverage', 'Self-Insured / None'],
        tooltip: 'Do you have cyber insurance? Select "Comprehensive Policy" if you are fully covered for ransomware/breaches.'
      }),
      calculateScore: (dep, ins) => ({ 
        severity: normalize(dep), 
        latency: ins === 'Comprehensive Policy' ? 3 : 8 
      })
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: [],
      q1: { 
        id: 'single_source', 
        type: 'slider', 
        label: 'Consumable Dependency', 
        minLabel: 'Generics Available',
        maxLabel: 'Proprietary / Single',
        tooltip: 'Can you use generic supplies? Slide right if you rely on single-source proprietary consumables.'
      },
      q2: () => ({
        id: 'emergency_stock',
        type: 'picker',
        label: 'Emergency Stockpile Status',
        options: ['> 1 Month On-Hand', '1-2 Weeks', 'Just-in-Time'],
        tooltip: 'How much stock do you hold? Select "JIT" if you have less than 2 weeks of critical supplies.'
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
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'manager_turnover',
        type: 'slider',
        label: 'Store Manager Turnover',
        minLabel: 'Stable (< 10%)',
        maxLabel: 'High (> 50%)',
        tooltip: 'Rate your manager churn. Slide right if more than 50% of your store managers leave annually.'
      },
      q2: () => ({
        id: 'seasonal_staffing',
        type: 'picker',
        label: 'Seasonal Hiring Protocol',
        options: ['Returning Alumni Pool', 'Just-in-Time Hiring', 'Always Short-Staffed'],
        tooltip: 'Can you staff up for holidays? Select "Always Short-Staffed" if you struggle to find seasonal help.'
      }),
      calculateScore: (turn, season) => {
        let lat = 5;
        if (season === 'Always Short-Staffed') lat = 9;
        return { severity: normalize(turn), latency: lat };
      }
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'pos_stability',
        type: 'slider',
        label: 'Platform Stability (POS/Web)',
        minLabel: 'Offline Capable',
        maxLabel: 'Cloud Only / Fragile',
        tooltip: 'Can you sell offline? Slide right if your POS requires an active internet connection to work.'
      },
      q2: () => ({
        id: 'payment_redundancy',
        type: 'picker',
        label: 'Payment Processing Backup',
        options: ['Cellular Backup + Offline', 'Single Connection', 'Cash Only Mode'],
        tooltip: 'If the internet dies, can you take cards? Select "Cash Only Mode" if you have no backup.'
      }),
      calculateScore: (stab, red) => {
        let sev = normalize(stab);
        let lat = 3;
        if (red === 'Cash Only Mode') lat = 9;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'geo_concentration',
        type: 'slider',
        label: 'Geographic Concentration',
        minLabel: 'Distributed National',
        maxLabel: 'Single Region / City',
        tooltip: 'Are all stores in one area? Slide right if a single regional event (hurricane) could close all locations.'
      },
      q2: () => ({
        id: 'bi_insurance',
        type: 'picker',
        label: 'Business Interruption Insurance',
        options: ['Full Coverage (Income)', 'Property Damage Only', 'None'],
        tooltip: 'Do you have income protection? Select "Property Damage Only" if insurance only covers repairs, not lost sales.'
      }),
      calculateScore: (conc, ins) => {
        let lat = 4;
        if (ins === 'Property Damage Only') lat = 7;
        if (ins === 'None') lat = 10;
        return { severity: normalize(conc), latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: [],
      q1: {
        id: 'seasonal_revenue',
        type: 'slider',
        label: 'Revenue Seasonality Impact',
        minLabel: 'Consistent Year-Round',
        maxLabel: '90% in Q4 (Holiday)',
        tooltip: 'How seasonal is your revenue? Slide right if you make almost all your profit in Q4.'
      },
      q2: () => ({
        id: 'margin_health',
        type: 'picker',
        label: 'Fixed Cost Coverage',
        options: ['Profitable Year-Round', 'Break-even', 'Loss Leader in Off-Season'],
        tooltip: 'Do you lose money off-season? Select "Loss Leader" if you rely on debt to survive until peak season.'
      }),
      calculateScore: (seas, marg) => {
        let lat = 5;
        if (marg === 'Loss Leader in Off-Season') lat = 9;
        return { severity: normalize(seas), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: [],
      q1: {
        id: 'inventory_depth',
        type: 'slider',
        label: 'Inventory Turnover Risk',
        minLabel: 'Optimized',
        maxLabel: 'Volatile',
        tooltip: 'Rate your inventory stability. Slide right if you frequently have too much stock or run out completely.'
      },
      q2: () => ({ 
        id: '3pl_backup', 
        type: 'picker', 
        label: 'Logistics / 3PL Redundancy',
        options: ['Multiple Active Carriers', 'Single Partner + Backup', 'Single Point of Failure'],
        tooltip: 'Do you have backup shippers? Select "Single Point of Failure" if you rely on one partner.'
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
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'operator_skill',
        type: 'slider',
        label: 'Operator Skill Gap',
        minLabel: 'Fully Trained / Cross-Trained',
        maxLabel: 'Push Button / Low Skill',
        tooltip: 'Rate your workforce skill level. Slide right if operators cannot troubleshoot basic issues.'
      },
      q2: () => ({
        id: 'shift_redundancy',
        type: 'picker',
        label: 'Shift Leadership Redundancy',
        options: ['3 Deep per Shift', 'Lead + Backup', 'Single Point of Failure'],
        tooltip: 'Do you have backup foremen? Select "Single Point of Failure" if one absence ruins a shift.'
      }),
      calculateScore: (skill, shift) => {
        let lat = 5;
        if (shift === 'Single Point of Failure') lat = 9;
        return { severity: normalize(skill), latency: lat };
      }
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'mes_reliance',
        type: 'slider',
        label: 'MES / MRP System Dependence',
        minLabel: 'Manual Backup Ready',
        maxLabel: '100% Digital Production',
        tooltip: 'If the MES goes down, does production stop? Slide right if you have no manual backup.'
      },
      q2: () => ({
        id: 'manual_override',
        type: 'picker',
        label: 'Manual Production Protocol',
        options: ['Paper Travelers Available', 'Slow Manual Entry', 'Line Stop / Blind'],
        tooltip: 'Can you build without the system? Select "Line Stop" if you cannot operate manually.'
      }),
      calculateScore: (rel, man) => {
        let sev = normalize(rel);
        let lat = 4;
        if (man === 'Line Stop / Blind') lat = 10;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'production_halt',
        type: 'slider',
        label: 'Downtime Cost Sensitivity',
        minLabel: 'Manageable',
        maxLabel: 'Catastrophic ($100k+/day)',
        tooltip: 'How costly is downtime? Slide right if a shutdown costs >$100k/day.'
      },
      q2: () => ({ 
        id: 'spare_parts', 
        type: 'picker', 
        label: 'Critical Spare Parts',
        options: ['Full On-Site Inventory', 'Key Parts Only', 'Order on Demand'],
        tooltip: 'Do you have spares? Select "Order on Demand" if you don\'t keep critical parts on shelf.'
      }),
      calculateScore: (sens, spare) => ({ 
        severity: normalize(sens), 
        latency: spare === 'Full On-Site Inventory' ? 3 : 8 
      })
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: [],
      q1: {
        id: 'inventory_cash',
        type: 'slider',
        label: 'Inventory Cash Lockup',
        minLabel: 'Lean / JIT',
        maxLabel: 'Heavy (Cash in Warehouse)',
        tooltip: 'How much cash is tied up in stock? Slide right if you hold large amounts of raw material.'
      },
      q2: () => ({
        id: 'cash_conversion',
        type: 'picker',
        label: 'Cash Conversion Gap',
        options: ['Customers Pay Fast', 'Neutral', 'We Pay Vendors Before Customers Pay Us'],
        tooltip: 'Do you pay vendors before you get paid? Select "We Pay Vendors Before..." if you finance the gap.'
      }),
      calculateScore: (lock, gap) => {
        let lat = 5;
        if (gap === 'We Pay Vendors Before Customers Pay Us') lat = 9;
        return { severity: normalize(lock), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: [],
      q1: {
        id: 'single_source_components',
        type: 'slider',
        label: 'Single-Source Components',
        helperText: 'Percentage of BOM (Bill of Materials) that comes from exactly 1 factory.',
        minLabel: 'Multi-Sourced',
        maxLabel: 'Single-Sourced',
        tooltip: 'How many single-source parts do you have? Slide right if key components come from only one factory.'
      },
      q2: (a1) => ({
        id: 'equipment_failure',
        type: 'picker',
        label: 'Critical Equipment Recovery',
        options: ['Rapid Repair (< 1 Wk)', 'Weeks (Parts Delay)', 'Months (Custom Import)'],
        tooltip: 'If a key machine breaks, how long to fix? Select "Months" if you need custom imported parts.'
      }),
      calculateScore: (dependency, time) => {
        let lat = 6;
        if (time === 'Rapid Repair (< 1 Wk)') lat = 3;
        if (time === 'Months (Custom Import)') lat = 10;
        return { severity: normalize(dependency), latency: lat };
      }
    }
  },

  // 9. FINANCIAL SERVICES / FINTECH
  'Financial Services / Fintech': {
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'hq_concentration',
        type: 'slider',
        label: 'HQ / Data Center Concentration',
        minLabel: 'Geo-Redundant',
        maxLabel: 'Single Location',
        tooltip: 'Are all ops in one city? Slide right if your HQ and Data Center are in the same region.'
      },
      q2: () => ({
        id: 'remote_compliance',
        type: 'picker',
        label: 'Remote Trading/Ops Capability',
        options: ['Fully Compliant Remote', 'Partial Capability', 'Office Mandatory'],
        tooltip: 'Can traders work from home legally? Select "Office Mandatory" if compliance blocks remote work.'
      }),
      calculateScore: (val, remote) => {
        let lat = 4;
        if (remote === 'Office Mandatory') lat = 10;
        return { severity: normalize(val), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: { // Mapped to TPRM
      contextTags: [],
      q1: {
        id: 'vendor_concentration',
        type: 'slider',
        label: 'Critical 3rd Party Dependency',
        minLabel: 'Redundant Systems',
        maxLabel: 'Single Critical Provider',
        tooltip: 'Rate your TPRM risk. Slide right if you rely on a single critical vendor (e.g. core processor).'
      },
      q2: () => ({
        id: 'exit_strategy',
        type: 'picker',
        label: 'Vendor Exit Strategy',
        options: ['Documented & Tested', 'Contractual Only', 'None / Vendor Lock-in'],
        tooltip: 'Can you leave your vendor? Select "None" if you are locked in with no exit plan.'
      }),
      calculateScore: (conc, exit) => {
        let lat = 5;
        if (exit === 'None / Vendor Lock-in') lat = 9;
        if (exit === 'Documented & Tested') lat = 3;
        return { severity: normalize(conc), latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: [],
      q1: {
        id: 'capital_runway',
        type: 'slider',
        label: 'Capital Adequacy / Runway',
        minLabel: 'Over-Capitalized',
        maxLabel: 'Regulatory Minimum',
        tooltip: 'Rate your capital reserves. Slide right if you are near the regulatory minimum.'
      },
      q2: () => ({
        id: 'liquidity_access',
        type: 'picker',
        label: 'Emergency Liquidity Access',
        options: ['Credit Line Available', 'Venture/Investor Backing', 'None / Frozen'],
        tooltip: 'Can you get cash fast? Select "None" if you have no credit lines or committed investors.'
      }),
      calculateScore: (cap, liq) => {
        let lat = 4;
        if (liq === 'None / Frozen') lat = 10;
        return { severity: normalize(cap), latency: lat };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'compliance_key_person',
        type: 'slider',
        label: 'Compliance/Key Person Risk',
        minLabel: 'Robust Team',
        maxLabel: 'Single Point of Failure',
        tooltip: 'Rate your key person risk. Slide right if losing one compliance officer stops operations.'
      },
      q2: () => ({
        id: 'succession_plan',
        type: 'picker',
        label: 'Succession Planning',
        options: ['Designated Successor', 'Interim Plan', 'Unfilled Vacancy'],
        tooltip: 'Do you have a successor? Select "Unfilled Vacancy" if no one is ready to step up.'
      }),
      calculateScore: (key, succ) => ({
        severity: normalize(key),
        latency: succ === 'Unfilled Vacancy' ? 9 : 4
      })
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'uptime_req',
        type: 'slider',
        label: 'Uptime Sensitivity',
        minLabel: 'Standard Business Hrs',
        maxLabel: '24/7/365 (99.999%)',
        tooltip: 'How critical is uptime? Slide right if you require 99.999% availability.'
      },
      q2: () => ({
        id: 'breach_response',
        type: 'picker',
        label: 'Cyber Breach Response',
        options: ['Automated SOC/SIEM', 'Manual IT Team', 'No Formal Plan'],
        tooltip: 'How fast can you stop a breach? Select "No Formal Plan" if you lack a response protocol.'
      }),
      calculateScore: (up, resp) => {
        let lat = 5;
        if (resp === 'Automated SOC/SIEM') lat = 2;
        if (resp === 'No Formal Plan') lat = 10;
        return { severity: normalize(up), latency: lat };
      }
    }
  },

  // 10. ENERGY & UTILITIES
  'Energy & Utilities': {
    [RiskCategory.WORKFORCE]: {
      contextTags: [],
      q1: {
        id: 'aging_workforce',
        type: 'slider',
        label: 'Field Force nearing Retirement',
        minLabel: 'Young / Balanced',
        maxLabel: '>50% Retiring soon',
        tooltip: 'Rate your retirement risk. Slide right if >50% of your field force will retire soon.'
      },
      q2: () => ({
        id: 'knowledge_transfer',
        type: 'picker',
        label: 'Knowledge Transfer Program',
        options: ['Formal Mentorship', 'Ad-Hoc', 'None / Tribal Knowledge'],
        tooltip: 'Is knowledge documented? Select "None" if experience lives only in workers\' heads.'
      }),
      calculateScore: (age, transfer) => {
        let lat = 5;
        if (transfer === 'None / Tribal Knowledge') lat = 9;
        return { severity: normalize(age), latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: [],
      q1: {
        id: 'grid_hardening',
        type: 'slider',
        label: 'Infrastructure Hardening',
        minLabel: 'Underground / Hardened',
        maxLabel: 'Exposed / Aging',
        tooltip: 'Is the grid hardened? Slide right if infrastructure is exposed and aging.'
      },
      q2: () => ({
        id: 'emergency_response',
        type: 'picker',
        label: 'Emergency Mutual Aid',
        options: ['Pre-Signed Contracts', 'Ad-Hoc Requests', 'Solo Response'],
        tooltip: 'Do you have aid contracts? Select "Solo Response" if you have no mutual aid agreements.'
      }),
      calculateScore: (hard, resp) => {
        let lat = 5;
        if (resp === 'Pre-Signed Contracts') lat = 3;
        if (resp === 'Solo Response') lat = 8;
        return { severity: normalize(hard), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: [],
      q1: {
        id: 'spare_lead_time',
        type: 'slider',
        label: 'Critical Spares Lead Time',
        minLabel: 'In Stock',
        maxLabel: '18+ Months',
        tooltip: 'How long to get spares? Slide right if large transformers/turbines take >18 months.'
      },
      q2: () => ({
        id: 'inventory_depth',
        type: 'picker',
        label: 'Critical Inventory Depth',
        options: ['N-1 Redundancy', 'Just-in-Time', 'Cannibalizing Parts'],
        tooltip: 'Do you have spares on hand? Select "Cannibalizing Parts" if you use old gear to fix new.'
      }),
      calculateScore: (lead, depth) => {
        let sev = normalize(lead);
        let lat = 5;
        if (depth === 'Cannibalizing Parts') lat = 10;
        if (depth === 'N-1 Redundancy') lat = 3;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: [],
      q1: {
        id: 'capex_funding',
        type: 'slider',
        label: 'CapEx Funding Stability',
        minLabel: 'Fully Funded',
        maxLabel: 'Unfunded Mandates',
        tooltip: 'Is CapEx funded? Slide right if you have regulatory mandates with no funding source.'
      },
      q2: () => ({
        id: 'rate_recovery',
        type: 'picker',
        label: 'Cost Recovery Mechanism',
        options: ['Auto-Pass Through', 'Lagged Rate Case', 'Fixed / No Recovery'],
        tooltip: 'Can you pass on costs? Select "Fixed / No Recovery" if rates are frozen despite cost hikes.'
      }),
      calculateScore: (fund, rate) => {
        let lat = 4;
        if (rate === 'Fixed / No Recovery') lat = 9;
        return { severity: normalize(fund), latency: lat };
      }
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: [],
      q1: {
        id: 'ot_security',
        type: 'slider',
        label: 'OT / IT Network Segmentation',
        minLabel: 'Air Gapped',
        maxLabel: 'Connected / Flat',
        tooltip: 'Is OT air-gapped? Slide right if operational tech is connected to the business network.'
      },
      q2: () => ({
        id: 'legacy_systems',
        type: 'picker',
        label: 'SCADA System Age',
        options: ['Modern / Supported', 'Legacy / EOL', 'Unsupported / Custom'],
        tooltip: 'Is SCADA supported? Select "Unsupported" if you run on obsolete OS (e.g. Windows XP).'
      }),
      calculateScore: (seg, age) => {
        let lat = 4;
        if (age === 'Unsupported / Custom') lat = 9;
        return { severity: normalize(seg), latency: lat };
      }
    }
  },

  'Other': GENERIC_FALLBACK,
  'default': GENERIC_FALLBACK
};