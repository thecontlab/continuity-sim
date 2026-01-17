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
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Site Super', 'Labor Shortage', 'Subcontractors'],
      q1: {
        id: 'super_depth',
        type: 'slider',
        label: 'Superintendent / PM Bench Strength',
        minLabel: 'Deep Bench',
        maxLabel: 'No Backups',
        tooltip: 'You can sub out labor, but you can\'t sub out site leadership. If a Super quits mid-project, does the job stall?'
      },
      q2: () => ({
        id: 'labor_availability',
        type: 'picker',
        label: 'General Labor Availability',
        options: ['On-Demand Staffing', '1-2 Week Lag', 'Chronic Shortage'],
        tooltip: 'When you need to ramp up for a new job, can you find crew? "Chronic shortage" creates a ceiling on your revenue growth.'
      }),
      calculateScore: (depth, labor) => {
        let lat = 5;
        if (labor === 'Chronic Shortage') lat = 9;
        return { severity: normalize(depth), latency: lat };
      }
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['Procore/Buildertrend', 'Connectivity', 'Blueprints'],
      q1: {
        id: 'pm_software_reliance',
        type: 'slider',
        label: 'Digital Project Management Reliance',
        minLabel: 'Paper / Hybrid',
        maxLabel: '100% Cloud (Procore)',
        tooltip: 'If Procore or Buildertrend goes down for 48 hours, does the job site know what to build? Or do they all go home?'
      },
      q2: () => ({
        id: 'offline_blueprints',
        type: 'picker',
        label: 'Offline Site Capability',
        options: ['Local Backups (iPad/Paper)', 'Slow Mobile Hotspots', 'Work Stoppage'],
        tooltip: 'Job sites often have poor connectivity. Reliance on "Always On" cloud tools without offline syncing creates massive latency.'
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
      contextTags: ['Site Access', 'Hurricane/Flood', 'Equipment Damage'],
      q1: {
        id: 'site_exposure',
        type: 'slider',
        label: 'Active Sites in High-Risk Zones',
        helperText: 'Percentage of active revenue in flood plains, fire zones, or hurricane paths.',
        minLabel: 'Safe / Indoor',
        maxLabel: '100% Exposed',
        tooltip: 'Construction revenue stops when the weather turns. Are your sites clustered in one vulnerable region?'
      },
      q2: () => ({
        id: 'weather_clauses',
        type: 'picker',
        label: 'Contract Protection (Force Majeure)',
        options: ['Day-for-Day + Costs', 'Time Extension Only', 'No Relief (We Eat Cost)'],
        tooltip: 'When work stops due to weather, who pays for the idle cranes and labor? "No Relief" clauses destroy margins.'
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
       contextTags: ['Project Delays', 'Retainage', 'Draw Schedules', 'Floating Materials'],
       q1: { 
         id: 'draw_delay', 
         type: 'slider', 
         label: 'Avg. Draw Payment Delay', 
         minLabel: 'Net 15 (Fast)',
         maxLabel: 'Net 90+ (Slow)',
         tooltip: 'The time between installing materials/paying labor and actually receiving the check from the developer/owner.'
       },
       q2: () => ({ 
         id: 'float_cash', 
         type: 'picker', 
         label: 'Payroll Float Capacity', 
         options: ['3+ Payrolls (Safe)', '1-2 Payrolls', 'Payroll-to-Payroll'],
         tooltip: 'If a major draw is frozen for 45 days, can you make payroll without tapping personal credit or high-interest loans?'
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
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['ServiceTitan', 'Dispatch', 'Mobile Connectivity'],
      q1: {
        id: 'fsm_dependence',
        type: 'slider',
        label: 'Field Service Software Reliance',
        minLabel: 'Paper / Whiteboard',
        maxLabel: '100% Digital (ServiceTitan)',
        tooltip: 'Tools like ServiceTitan are amazing for efficiency, but they are a single point of failure. If it goes down, can you dispatch?'
      },
      q2: () => ({
        id: 'manual_dispatch',
        type: 'picker',
        label: 'Manual Dispatch Protocol',
        options: ['Paper/Phone Backup', 'Chaotic / Ad-Hoc', 'Trucks Parked'],
        tooltip: 'If the cloud fails, do you have a "War Room" protocol to manually route calls and take payments?'
      }),
      calculateScore: (dep, man) => {
        let sev = normalize(dep);
        let lat = 4;
        if (man === 'Trucks Parked') lat = 10;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Fleet Safety', 'Road Conditions', 'Extreme Heat/Cold'],
      q1: {
        id: 'fleet_resilience',
        type: 'slider',
        label: 'Fleet All-Weather Capability',
        minLabel: '4WD / All-Weather',
        maxLabel: 'Fair Weather Only',
        tooltip: 'If it snows or floods, does your revenue go to zero because vans can\'t roll? Or do you have equipment to serve emergency calls?'
      },
      q2: () => ({
        id: 'surge_capacity',
        type: 'picker',
        label: 'Emergency Surge Capacity',
        options: ['Overtime/On-Call Ready', 'Stretched Thin', 'Rejecting Calls'],
        tooltip: 'Extreme weather often drives huge demand (burst pipes, broken AC). Can you capture this revenue, or do you have to turn it away?'
      }),
      calculateScore: (fleet, surge) => {
        let sev = normalize(fleet);
        let lat = 5;
        if (surge === 'Rejecting Calls') lat = 9;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['Aging Invoices', 'Bad Debt', 'Seasonality'],
      q1: {
        id: 'ar_aging',
        type: 'slider',
        label: 'Avg. Invoice Collection Time',
        minLabel: 'COD / Net 7',
        maxLabel: 'Net 60+',
        tooltip: 'Skilled trades often act as a bank for customers. If your AR aging averages >45 days, you are financing your customers.'
      },
      q2: () => ({
        id: 'credit_utilization',
        type: 'picker',
        label: 'Line of Credit Utilization',
        options: ['< 30% (Healthy)', '50-80% (Strained)', 'Maxed / Personal Cards'],
        tooltip: 'Are you using debt to grow, or using debt to survive? Maxed out credit lines leave zero room for emergency repairs or payroll shocks.'
      }),
      calculateScore: (aging, util) => {
        let lat = 4;
        if (util === 'Maxed / Personal Cards') lat = 10;
        return { severity: normalize(aging), latency: lat };
      }
    },
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
        maxLabel: 'Severe Backorders', 
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
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['Vendor Lock-in', 'Data Portability', 'Hosting Cost'],
      q1: {
        id: 'platform_lockin',
        type: 'slider',
        label: 'Platform / Cloud Lock-in',
        minLabel: 'Agnostic (K8s)',
        maxLabel: 'Proprietary (Walled Garden)',
        tooltip: 'If your hosting provider (AWS/GCP/Azure) changes pricing or policy, how hard is it to leave? "Walled Gardens" trap you.'
      },
      q2: () => ({
        id: 'data_sovereignty',
        type: 'picker',
        label: 'Data Portability',
        options: ['Full SQL Export', 'CSV Only', 'Vendor Proprietary Format'],
        tooltip: 'Can you get your customer data out in a usable format? If the vendor fails, do you own your data or just rent it?'
      }),
      calculateScore: (lock, data) => {
        let lat = 4;
        if (data === 'Vendor Proprietary Format') lat = 9;
        return { severity: normalize(lock), latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Data Center', 'Power Grid', 'Remote Work'],
      q1: {
        id: 'cloud_zones',
        type: 'slider',
        label: 'Cloud Region Redundancy',
        minLabel: 'Multi-Region (Geo-Redundant)',
        maxLabel: 'Single Availability Zone',
        tooltip: 'If US-EAST-1 goes down (again), does your app go dark? True resilience requires multi-region failover.'
      },
      q2: () => ({
        id: 'hq_dependency',
        type: 'picker',
        label: 'Physical Office Dependency',
        options: ['100% Remote Capable', 'Hybrid / VPN Dependent', 'On-Premises Servers'],
        tooltip: 'If the office burns down or loses internet, can the entire team keep working from home without security/access issues?'
      }),
      calculateScore: (zones, office) => {
        let sev = normalize(zones);
        let lat = 3;
        if (office === 'On-Premises Servers') lat = 10;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['High Burn', 'Churn', 'CAC Payback'],
      q1: {
        id: 'runway',
        type: 'slider',
        label: 'Runway (Current Burn Rate)',
        minLabel: 'Default Alive (>18m)',
        maxLabel: 'Default Dead (<3m)',
        tooltip: 'In SaaS, cash flow kills you before the product fails. How many months until zero cash if you raise no new capital?'
      },
      q2: () => ({
        id: 'payment_terms',
        type: 'picker',
        label: 'Customer Payment Structure',
        options: ['Annual Upfront', 'Quarterly Mix', 'Monthly (Net 30)'],
        tooltip: 'Annual upfront payments act as non-dilutive funding. Monthly payments leave you vulnerable to short-term churn shocks.'
      }),
      calculateScore: (runway, terms) => {
        let lat = 5;
        if (terms === 'Annual Upfront') lat = 3;
        if (terms === 'Monthly (Net 30)') lat = 8;
        return { severity: normalize(runway), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: { 
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
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['CRM', 'Data Privacy', 'Email'],
      q1: {
        id: 'tool_consolidation',
        type: 'slider',
        label: 'Tooling Fragmentation',
        minLabel: 'Centralized CRM/ERP',
        maxLabel: 'Spreadsheet Chaos',
        tooltip: 'Do you have a "Single Source of Truth"? If client data lives in 10 different spreadsheets, you have no visibility and high risk of data loss.'
      },
      q2: () => ({
        id: 'email_dependency',
        type: 'picker',
        label: 'Communication Redundancy',
        options: ['Slack/Teams + Email', 'Email Only', 'Personal Cell Phones'],
        tooltip: 'If Outlook/Gmail goes down, does business stop? Multi-channel communication is a basic resilience requirement.'
      }),
      calculateScore: (frag, comm) => {
        let lat = 4;
        if (comm === 'Personal Cell Phones') lat = 8;
        return { severity: normalize(frag), latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Office Access', 'Internet Outage', 'Data Center'],
      q1: {
        id: 'office_dependence',
        type: 'slider',
        label: 'Physical Office Reliance',
        minLabel: 'Digital Nomad Ready',
        maxLabel: 'Server Room on Prem',
        tooltip: 'If the office is flooded for a week, does billable work stop? Reliance on physical servers or paper files is a major risk.'
      },
      q2: () => ({
        id: 'remote_infra',
        type: 'picker',
        label: 'Remote Infrastructure',
        options: ['Cloud Native (Zero VPN)', 'VPN Required', 'Desktop Remote Desktop'],
        tooltip: 'VPNs bottleneck during crises. Cloud-native tools (M365, Slack, Zoom) allow for seamless transition to home work.'
      }),
      calculateScore: (dep, infra) => {
        let lat = 3;
        if (infra === 'Desktop Remote Desktop') lat = 8;
        return { severity: normalize(dep), latency: lat };
      }
    },
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
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['ELD', 'TMS', 'GPS'],
      q1: {
        id: 'tms_uptime',
        type: 'slider',
        label: 'TMS / ELD Reliance',
        minLabel: 'Paper Logs Ready',
        maxLabel: '100% Digital Lockout',
        tooltip: 'If your Transportation Management System (TMS) or Electronic Logging Device (ELD) fails, can you legally drive? Or is the fleet grounded?'
      },
      q2: () => ({
        id: 'routing_backup',
        type: 'picker',
        label: 'Manual Routing Capability',
        options: ['Drivers Know Routes', 'Dispatch Can Route Manually', 'Total Blindness'],
        tooltip: 'Without the GPS software, can your dispatchers still efficiently route trucks, or does velocity collapse?'
      }),
      calculateScore: (rel, backup) => {
        let sev = normalize(rel);
        let lat = 4;
        if (backup === 'Total Blindness') lat = 10;
        return { severity: sev, latency: lat };
      }
    },
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
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['Fuel Costs', 'Factoring Fees', 'Margin Compression'],
      q1: {
        id: 'fuel_recovery',
        type: 'slider',
        label: 'Fuel Surcharge Pass-Through',
        minLabel: '100% Pass-Through',
        maxLabel: '0% (Fixed Bids)',
        tooltip: 'When diesel prices spike, do you absorb the cost (bleeding cash) or does your customer pay? Fixed bids in volatile markets are a cash trap.'
      },
      q2: () => ({
        id: 'factoring',
        type: 'picker',
        label: 'Invoice Factoring Dependency',
        options: ['Cash Reserves', 'Line of Credit', 'Heavy Factoring (High Fees)'],
        tooltip: 'Factoring gets you cash fast but eats 3-5% of your margin. Heavy reliance suggests a structural cash flow problem.'
      }),
      calculateScore: (fuel, fact) => {
        let lat = 4;
        if (fact === 'Heavy Factoring (High Fees)') lat = 9;
        return { severity: normalize(fuel), latency: lat };
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
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Burnout', 'Specialized Staff', 'Ratios'],
      q1: {
        id: 'clinical_churn',
        type: 'slider',
        label: 'Clinical Staff Turnover',
        minLabel: 'Low (< 10%)',
        maxLabel: 'Crisis (> 30%)',
        tooltip: 'High turnover in clinical staff leads to burnout for the remaining team, creating a death spiral of departures and quality issues.'
      },
      q2: () => ({
        id: 'credentialing_lag',
        type: 'picker',
        label: 'New Hire Credentialing Lag',
        options: ['Fast (< 30 Days)', 'Standard (60 Days)', 'Slow (> 90 Days)'],
        tooltip: 'Hiring a doctor is only half the battle. If it takes 90 days to credential them with insurance, you are paying salary with no revenue.'
      }),
      calculateScore: (churn, lag) => {
        let lat = 5;
        if (lag === 'Slow (> 90 Days)') lat = 9;
        return { severity: normalize(churn), latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Flooding', 'Patient Access', 'Power Failure'],
      q1: {
        id: 'backup_power',
        type: 'slider',
        label: 'Backup Power Autonomy',
        minLabel: '> 96 Hours',
        maxLabel: 'None / UPS Only',
        tooltip: 'If the grid fails for 3 days, can you preserve critical samples and treat patients? UPS batteries only last minutes.'
      },
      q2: () => ({
        id: 'facility_access',
        type: 'picker',
        label: 'Physical Access Redundancy',
        options: ['Multiple Routes/Entrances', 'Single Access Road', 'Flood Prone Zone'],
        tooltip: 'If your only access road floods, you are effectively closed. Do emergency vehicles have secondary access?'
      }),
      calculateScore: (power, access) => {
        let sev = normalize(power);
        let lat = 4;
        if (access === 'Flood Prone Zone') lat = 9;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['Reimbursement Cycles', 'Denial Rates', 'Medicare'],
      q1: {
        id: 'reimbursement_cycle',
        type: 'slider',
        label: 'Avg. Reimbursement Cycle',
        minLabel: 'Fast (< 30 Days)',
        maxLabel: 'Slow (> 90 Days)',
        tooltip: 'The longer it takes insurance to pay, the larger the cash reserve you need to hold to cover payroll.'
      },
      q2: () => ({
        id: 'claim_denials',
        type: 'picker',
        label: 'First-Pass Claim Denial Rate',
        options: ['< 5% (Efficient)', '5-15% (Average)', '> 15% (Revenue Leak)'],
        tooltip: 'High denial rates increase administrative load and delay cash flow. It is a hidden tax on your revenue.'
      }),
      calculateScore: (cycle, den) => {
        let sev = normalize(cycle);
        let lat = 5;
        if (den === '> 15% (Revenue Leak)') lat = 9;
        return { severity: sev, latency: lat };
      }
    },
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
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Turnover', 'Seasonal Hiring', 'Theft'],
      q1: {
        id: 'manager_turnover',
        type: 'slider',
        label: 'Store Manager Turnover',
        minLabel: 'Stable (< 10%)',
        maxLabel: 'High (> 50%)',
        tooltip: 'Hourly staff churn is normal. Manager churn is lethal. It destroys culture, operations, and revenue.'
      },
      q2: () => ({
        id: 'seasonal_staffing',
        type: 'picker',
        label: 'Seasonal Hiring Protocol',
        options: ['Returning Alumni Pool', 'Just-in-Time Hiring', 'Always Short-Staffed'],
        tooltip: 'If you rely on Q4 for profit, being short-staffed in December is a disaster. Do you have a roster of returning seasonal staff?'
      }),
      calculateScore: (turn, season) => {
        let lat = 5;
        if (season === 'Always Short-Staffed') lat = 9;
        return { severity: normalize(turn), latency: lat };
      }
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['POS', 'E-commerce', 'Payments'],
      q1: {
        id: 'pos_stability',
        type: 'slider',
        label: 'Platform Stability (POS/Web)',
        minLabel: 'Offline Capable',
        maxLabel: 'Cloud Only / Fragile',
        tooltip: 'If your internet connection drops, can you still take money? "Cloud Only" POS systems are a vulnerability in retail.'
      },
      q2: () => ({
        id: 'payment_redundancy',
        type: 'picker',
        label: 'Payment Processing Backup',
        options: ['Cellular Backup + Offline', 'Single Connection', 'Cash Only Mode'],
        tooltip: '"Cash Only" signs cost you 80% of sales. Do you have a cellular backup or "Store and Forward" capability?'
      }),
      calculateScore: (stab, red) => {
        let sev = normalize(stab);
        let lat = 3;
        if (red === 'Cash Only Mode') lat = 9;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Store Damage', 'Foot Traffic', 'Spoilage'],
      q1: {
        id: 'geo_concentration',
        type: 'slider',
        label: 'Geographic Concentration',
        minLabel: 'Distributed National',
        maxLabel: 'Single Region / City',
        tooltip: 'If a hurricane hits your region, do 100% of your stores close? Geographic diversity protects revenue.'
      },
      q2: () => ({
        id: 'bi_insurance',
        type: 'picker',
        label: 'Business Interruption Insurance',
        options: ['Full Coverage (Income)', 'Property Damage Only', 'None'],
        tooltip: 'Property insurance pays to fix the roof. Business Interruption pays your lost revenue while the roof is being fixed.'
      }),
      calculateScore: (conc, ins) => {
        let lat = 4;
        if (ins === 'Property Damage Only') lat = 7;
        if (ins === 'None') lat = 10;
        return { severity: normalize(conc), latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['Seasonality', 'Inventory Costs', 'Ad Spend'],
      q1: {
        id: 'seasonal_revenue',
        type: 'slider',
        label: 'Revenue Seasonality Impact',
        minLabel: 'Consistent Year-Round',
        maxLabel: '90% in Q4 (Holiday)',
        tooltip: 'High seasonality means you have 9 months of "cash burn" and 3 months of "cash harvest". Can you survive the 9 months if Q4 is weak?'
      },
      q2: () => ({
        id: 'margin_health',
        type: 'picker',
        label: 'Fixed Cost Coverage',
        options: ['Profitable Year-Round', 'Break-even', 'Loss Leader in Off-Season'],
        tooltip: 'If you rely on debt to cover rent/payroll during the off-season, you are vulnerable to interest rate spikes.'
      }),
      calculateScore: (seas, marg) => {
        let lat = 5;
        if (marg === 'Loss Leader in Off-Season') lat = 9;
        return { severity: normalize(seas), latency: lat };
      }
    },
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
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Skill Gap', 'Retirement', 'Safety'],
      q1: {
        id: 'operator_skill',
        type: 'slider',
        label: 'Operator Skill Gap',
        minLabel: 'Fully Trained / Cross-Trained',
        maxLabel: 'Push Button / Low Skill',
        tooltip: 'If your master machinist retires, does the factory stop? Or do you have cross-trained operators ready to step up?'
      },
      q2: () => ({
        id: 'shift_redundancy',
        type: 'picker',
        label: 'Shift Leadership Redundancy',
        options: ['3 Deep per Shift', 'Lead + Backup', 'Single Point of Failure'],
        tooltip: 'If the 2nd shift foreman gets sick, does the line efficiency drop by 30%? You need redundancy in leadership, not just labor.'
      }),
      calculateScore: (skill, shift) => {
        let lat = 5;
        if (shift === 'Single Point of Failure') lat = 9;
        return { severity: normalize(skill), latency: lat };
      }
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['ERP', 'MES', 'SCADA'],
      q1: {
        id: 'mes_reliance',
        type: 'slider',
        label: 'MES / MRP System Dependence',
        minLabel: 'Manual Backup Ready',
        maxLabel: '100% Digital Production',
        tooltip: 'If your Manufacturing Execution System (MES) goes down, does the line stop? Or can you run on paper "Travelers"?'
      },
      q2: () => ({
        id: 'manual_override',
        type: 'picker',
        label: 'Manual Production Protocol',
        options: ['Paper Travelers Available', 'Slow Manual Entry', 'Line Stop / Blind'],
        tooltip: 'Digital is efficient, but paper is resilient. Do you have a physical backup of the production schedule?'
      }),
      calculateScore: (rel, man) => {
        let sev = normalize(rel);
        let lat = 4;
        if (man === 'Line Stop / Blind') lat = 10;
        return { severity: sev, latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Factory Shutdown', 'Supply Route', 'Machinery Damage'],
      q1: {
        id: 'production_halt',
        type: 'slider',
        label: 'Downtime Cost Sensitivity',
        minLabel: 'Manageable',
        maxLabel: 'Catastrophic ($100k+/day)',
        tooltip: 'How much money do you lose for every hour the line stops? High sensitivity requires aggressive redundancy.'
      },
      q2: () => ({ 
        id: 'spare_parts', 
        type: 'picker', 
        label: 'Critical Spare Parts',
        options: ['Full On-Site Inventory', 'Key Parts Only', 'Order on Demand'],
        tooltip: 'If a motor blows, do you have one on the shelf? "Order on demand" in 2024 is a massive risk.'
      }),
      calculateScore: (sens, spare) => ({ 
        severity: normalize(sens), 
        latency: spare === 'Full On-Site Inventory' ? 3 : 8 
      })
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['Inventory Lockup', 'CapEx', 'Payment Terms'],
      q1: {
        id: 'inventory_cash',
        type: 'slider',
        label: 'Inventory Cash Lockup',
        minLabel: 'Lean / JIT',
        maxLabel: 'Heavy (Cash in Warehouse)',
        tooltip: 'Raw material sitting on the floor is cash you can\'t use. High lockup reduces your ability to react to market changes.'
      },
      q2: () => ({
        id: 'cash_conversion',
        type: 'picker',
        label: 'Cash Conversion Gap',
        options: ['Customers Pay Fast', 'Neutral', 'We Pay Vendors Before Customers Pay Us'],
        tooltip: 'If you pay vendors Net 30 but customers pay Net 90, you are financing the gap. This "Negative Float" limits growth.'
      }),
      calculateScore: (lock, gap) => {
        let lat = 5;
        if (gap === 'We Pay Vendors Before Customers Pay Us') lat = 9;
        return { severity: normalize(lock), latency: lat };
      }
    },
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

  // 9. FINANCIAL SERVICES / FINTECH
  'Financial Services / Fintech': {
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Data Center', 'HQ Access', 'Remote Work'],
      q1: {
        id: 'hq_concentration',
        type: 'slider',
        label: 'HQ / Data Center Concentration',
        minLabel: 'Geo-Redundant',
        maxLabel: 'Single Location',
        tooltip: 'Are all your servers or key staff in one city? A hurricane or power outage there shouldn\'t stop your global ops.'
      },
      q2: () => ({
        id: 'remote_compliance',
        type: 'picker',
        label: 'Remote Trading/Ops Capability',
        options: ['Fully Compliant Remote', 'Partial Capability', 'Office Mandatory'],
        tooltip: 'If the office is closed, can your traders or compliance officers legally work from home (recorded lines, secure terminals)?'
      }),
      calculateScore: (val, remote) => {
        let lat = 4;
        if (remote === 'Office Mandatory') lat = 10;
        return { severity: normalize(val), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: { // Mapped to TPRM
      contextTags: ['Vendor Concentration', 'Cloud Failure', 'Regulatory Fines'],
      q1: {
        id: 'vendor_concentration',
        type: 'slider',
        label: 'Critical 3rd Party Dependency',
        minLabel: 'Redundant Systems',
        maxLabel: 'Single Critical Provider',
        tooltip: 'In Fintech, "Supply Chain" is TPRM. If your core banking processor or cloud host goes down, do you have a hot backup?'
      },
      q2: () => ({
        id: 'exit_strategy',
        type: 'picker',
        label: 'Vendor Exit Strategy',
        options: ['Documented & Tested', 'Contractual Only', 'None / Vendor Lock-in'],
        tooltip: 'Regulators require a "Living Will" for vendors. Can you actually migrate your data if your vendor fails?'
      }),
      calculateScore: (conc, exit) => {
        let lat = 5;
        if (exit === 'None / Vendor Lock-in') lat = 9;
        if (exit === 'Documented & Tested') lat = 3;
        return { severity: normalize(conc), latency: lat };
      }
    },
    [RiskCategory.CASH_FLOW]: {
      contextTags: ['Liquidity Crunch', 'Capital Adequacy', 'Market Volatility'],
      q1: {
        id: 'capital_runway',
        type: 'slider',
        label: 'Capital Adequacy / Runway',
        minLabel: 'Over-Capitalized',
        maxLabel: 'Regulatory Minimum',
        tooltip: 'Beyond operating expenses, do you have enough capital to meet regulatory reserve requirements during a market shock?'
      },
      q2: () => ({
        id: 'liquidity_access',
        type: 'picker',
        label: 'Emergency Liquidity Access',
        options: ['Credit Line Available', 'Venture/Investor Backing', 'None / Frozen'],
        tooltip: 'When the market freezes, cash is king. Do you have a pre-approved line of credit or committed investor capital?'
      }),
      calculateScore: (cap, liq) => {
        let lat = 4;
        if (liq === 'None / Frozen') lat = 10;
        return { severity: normalize(cap), latency: lat };
      }
    },
    [RiskCategory.WORKFORCE]: {
      contextTags: ['Compliance Officer', 'Key Trader', 'Misconduct'],
      q1: {
        id: 'compliance_key_person',
        type: 'slider',
        label: 'Compliance/Key Person Risk',
        minLabel: 'Robust Team',
        maxLabel: 'Single Point of Failure',
        tooltip: 'If your Chief Compliance Officer or Lead Trader quits, does your license to operate get suspended?'
      },
      q2: () => ({
        id: 'succession_plan',
        type: 'picker',
        label: 'Succession Planning',
        options: ['Designated Successor', 'Interim Plan', 'Unfilled Vacancy'],
        tooltip: 'Regulators look for continuity in leadership. An empty compliance seat is a red flag.'
      }),
      calculateScore: (key, succ) => ({
        severity: normalize(key),
        latency: succ === 'Unfilled Vacancy' ? 9 : 4
      })
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['Cybersecurity', 'Data Breach', 'Uptime'],
      q1: {
        id: 'uptime_req',
        type: 'slider',
        label: 'Uptime Sensitivity',
        minLabel: 'Standard Business Hrs',
        maxLabel: '24/7/365 (99.999%)',
        tooltip: 'Fintech allows zero downtime. A 1-hour outage can destroy trust permanently.'
      },
      q2: () => ({
        id: 'breach_response',
        type: 'picker',
        label: 'Cyber Breach Response',
        options: ['Automated SOC/SIEM', 'Manual IT Team', 'No Formal Plan'],
        tooltip: 'Speed of containment determines the fine. Do you have automated tools to detect and isolate threats?'
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
      contextTags: ['Aging Workforce', 'Linemen', 'Safety'],
      q1: {
        id: 'aging_workforce',
        type: 'slider',
        label: 'Field Force nearing Retirement',
        minLabel: 'Young / Balanced',
        maxLabel: '>50% Retiring soon',
        tooltip: 'The "Silver Tsunami". If half your linemen retire in 5 years, who keeps the lights on?'
      },
      q2: () => ({
        id: 'knowledge_transfer',
        type: 'picker',
        label: 'Knowledge Transfer Program',
        options: ['Formal Mentorship', 'Ad-Hoc', 'None / Tribal Knowledge'],
        tooltip: 'Is the knowledge of the grid written down, or is it all in the head of a 60-year-old foreman?'
      }),
      calculateScore: (age, transfer) => {
        let lat = 5;
        if (transfer === 'None / Tribal Knowledge') lat = 9;
        return { severity: normalize(age), latency: lat };
      }
    },
    [RiskCategory.WEATHER_PHYSICAL]: {
      contextTags: ['Wildfire', 'Hurricane', 'Grid Hardening'],
      q1: {
        id: 'grid_hardening',
        type: 'slider',
        label: 'Infrastructure Hardening',
        minLabel: 'Underground / Hardened',
        maxLabel: 'Exposed / Aging',
        tooltip: 'Is your grid built for the climate of 1990 or the climate of 2030?'
      },
      q2: () => ({
        id: 'emergency_response',
        type: 'picker',
        label: 'Emergency Mutual Aid',
        options: ['Pre-Signed Contracts', 'Ad-Hoc Requests', 'Solo Response'],
        tooltip: 'When the big storm hits, you can\'t do it alone. Do you have mutual aid contracts ready to trigger?'
      }),
      calculateScore: (hard, resp) => {
        let lat = 5;
        if (resp === 'Pre-Signed Contracts') lat = 3;
        if (resp === 'Solo Response') lat = 8;
        return { severity: normalize(hard), latency: lat };
      }
    },
    [RiskCategory.SUPPLY_CHAIN]: {
      contextTags: ['Spare Parts', 'Fuel Supply', 'Raw Materials'],
      q1: {
        id: 'spare_lead_time',
        type: 'slider',
        label: 'Critical Spares Lead Time',
        minLabel: 'In Stock',
        maxLabel: '18+ Months',
        tooltip: 'Large transformers and turbines are not "Prime Delivery". Lead times can exceed a year. Do you have spares?'
      },
      q2: () => ({
        id: 'inventory_depth',
        type: 'picker',
        label: 'Critical Inventory Depth',
        options: ['N-1 Redundancy', 'Just-in-Time', 'Cannibalizing Parts'],
        tooltip: 'Cannibalizing old equipment to keep the grid running is a sign of extreme fragility.'
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
      contextTags: ['CapEx', 'Rate Cases', 'Regulations'],
      q1: {
        id: 'capex_funding',
        type: 'slider',
        label: 'CapEx Funding Stability',
        minLabel: 'Fully Funded',
        maxLabel: 'Unfunded Mandates',
        tooltip: 'Infrastructure requires massive capital. Do you have the funding secured for required upgrades?'
      },
      q2: () => ({
        id: 'rate_recovery',
        type: 'picker',
        label: 'Cost Recovery Mechanism',
        options: ['Auto-Pass Through', 'Lagged Rate Case', 'Fixed / No Recovery'],
        tooltip: 'If fuel costs spike, how fast can you raise rates? A lag of 12 months can bankrupt a utility.'
      }),
      calculateScore: (fund, rate) => {
        let lat = 4;
        if (rate === 'Fixed / No Recovery') lat = 9;
        return { severity: normalize(fund), latency: lat };
      }
    },
    [RiskCategory.INFRASTRUCTURE_TOOLS]: {
      contextTags: ['SCADA', 'OT Security', 'Grid Modernization'],
      q1: {
        id: 'ot_security',
        type: 'slider',
        label: 'OT / IT Network Segmentation',
        minLabel: 'Air Gapped',
        maxLabel: 'Connected / Flat',
        tooltip: 'Operational Technology (OT) controlling the grid should never touch the internet directly.'
      },
      q2: () => ({
        id: 'legacy_systems',
        type: 'picker',
        label: 'SCADA System Age',
        options: ['Modern / Supported', 'Legacy / EOL', 'Unsupported / Custom'],
        tooltip: 'Running critical infrastructure on Windows XP is a massive liability.'
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