import { RiskCategory } from './types';

export const COLORS = {
  background: '#0B0E14',
  card: '#161B22',
  accent: '#E8830C', // Orange
  textMain: '#F3F4F6',
  textMuted: '#9CA3AF',
  crimson: '#DC2626',
  safe: '#10B981',
  border: '#374151',
  riskLevels: {
    low: '#10B981',    // Green
    medium: '#EAB308', // Yellow
    high: '#F97316',   // Orange
    critical: '#EF4444' // Red
  }
};

/**
 * Generates a specific color based on criticality score (Severity + Latency).
 * Ensures darker/richer shades for higher criticality.
 * Max Score: 20 (10+10), Min Score: 2 (1+1)
 */
export const getRiskColor = (x: number, y: number): string => {
  const score = x + y;
  
  // CRITICAL ZONE (Score >= 15) -> Deep Reds
  if (score >= 19) return '#450a0a'; // Red 950 (Most Critical)
  if (score >= 18) return '#7f1d1d'; // Red 900
  if (score >= 17) return '#991b1b'; // Red 800
  if (score >= 16) return '#b91c1c'; // Red 700
  if (score >= 15) return '#dc2626'; // Red 600

  // HIGH ZONE (Score 12-14) -> Oranges
  if (score >= 14) return '#c2410c'; // Orange 700
  if (score >= 13) return '#ea580c'; // Orange 600
  if (score >= 12) return '#f97316'; // Orange 500

  // MEDIUM ZONE (Score 9-11) -> Yellows/Golds
  if (score >= 11) return '#854d0e'; // Yellow 800
  if (score >= 10) return '#ca8a04'; // Yellow 600
  if (score >= 9) return '#d97706';  // Amber 600 (Darker yellow to be visible)

  // LOW ZONE (Score < 9) -> Greens
  if (score >= 8) return '#047857'; // Emerald 700
  if (score >= 7) return '#059669'; // Emerald 600
  if (score >= 6) return '#10b981'; // Emerald 500
  return '#34d399'; // Emerald 400
};

export const INDUSTRIES = [
  "Manufacturing & Industrial",
  "SaaS / Software",
  "Professional Services",
  "Retail / E-commerce",
  "Construction & Real Estate",
  "Logistics & Transportation",
  "Healthcare / MedTech",
  "Financial Services / Fintech",
  "Energy & Utilities",
  "Other"
];

export const RISK_CARDS = [
  {
    id: RiskCategory.SUPPLY_CHAIN,
    title: 'Supply Chain',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80',
    context: 'Single-source dependencies create fragile bottlenecks. A 48-hour disruption in a key supplier can stall revenue for weeks.',
    description: 'Physical goods and digital dependencies form the backbone of delivery. A fracture here halts revenue immediately.',
    q1: 'Component Redundancy',
    q1Context: '', 
    q1Question: 'If your primary supplier or critical API vendor vanishes tomorrow, does production halt completely?',
    q1Detail: 'Dependence on a single source creates immediate fragility in the production line. Consider your single points of failure. Are there pre-vetted backups ready to ship, or would you be starting a search from scratch?',
    q2: 'Recovery Latency',
    q2Context: '', 
    q2Question: 'How many weeks would it take to identify, vet, and integrate a replacement source to reach 100% capacity?',
    q2Detail: 'Time-to-Recovery (TTR) is the silent killer of quarterly results. This includes negotiation, technical integration, and quality assurance testing.',
  },
  {
    id: RiskCategory.CASH_FLOW,
    title: 'Cash Flow',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80',
    context: 'Liquidity acts as a shock absorber. High customer concentration (>20%) exposes you to sudden cash flow freezing.',
    description: 'Liquidity is the oxygen of the business. Operational continuity is impossible without a runway during crises.',
    q1: 'Customer Concentration',
    q1Context: '',
    q1Question: 'Does a single client hold the keys to your payroll? If they churn, are you insolvent?',
    q1Detail: 'Revenue diversity protects against sudden market shocks. If a client providing >20% of revenue leaves, does it trigger immediate layoffs?',
    q2: 'Liquidity Gap',
    q2Context: '',
    q2Question: 'In a zero-revenue scenario, how many months do the lights stay on before credit lines break?',
    q2Detail: 'Reserves define your survival window during a total market freeze. Burn rate vs. Reserves. Calculate based on fixed costs only, assuming no incoming accounts receivable.',
  },
  {
    id: RiskCategory.WEATHER_PHYSICAL,
    title: 'Weather & Physical',
    imageUrl: 'https://images.unsplash.com/photo-1454789476662-53eb23ba5907?auto=format&fit=crop&q=80',
    context: 'Physical assets are often under-insured against modern volatility events (floods, grid failure, civil unrest).',
    description: 'Environmental volatility is increasing. Physical assets are often the most difficult to move during a disaster.',
    q1: 'Geographic Exposure',
    q1Context: '',
    q1Question: 'Assess your HQ or factory location. Are you in a flood zone, hurricane path, or seismic fault line?',
    q1Detail: 'Static assets are vulnerable to environmental volatility. Assess the physical location of your HQ, servers, or factories. Consider 100-year flood plains and grid stability.',
    q2: 'Facility Redundancy',
    q2Context: '',
    q2Question: 'Can you flip a switch and operate key business functions from a secondary location immediately?',
    q2Detail: 'Operational resilience requires mobility. Does your disaster recovery plan include a physical alternate site or fully remote capability?',
  },
  {
    id: RiskCategory.INFRASTRUCTURE_TOOLS,
    title: 'Infrastructure & Tools',
    // New reliable URL for Tech/Server
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef2bb6db879c?auto=format&fit=crop&q=80',
    context: 'Digital sovereignty is critical. Reliance on proprietary "walled gardens" limits your speed and data ownership.',
    description: 'Digital sovereignty vs. Convenience. Platform risk is the new supply chain risk.',
    q1: 'Platform Dependency',
    q1Context: '',
    q1Question: 'If AWS/Azure/GCP goes down, or a critical SaaS tool changes pricing 10x overnight, are you trapped?',
    q1Detail: 'Rented infrastructure (Walled Gardens) creates vendor lock-in risk. If AWS/Azure/GCP goes down, do you own the stack? Can you migrate, or is your business logic tied to their proprietary code?',
    q2: 'Digital Sovereignty',
    q2Context: '',
    q2Question: 'Can you easily export your customer data and history, or is it locked in a proprietary vendor format?',
    q2Detail: 'Data ownership determines your ability to migrate. If the tool shuts down, do you have a SQL dump of your customer interactions, or just a CSV of emails?',
  },
  {
    id: RiskCategory.WORKFORCE,
    title: 'Workforce',
    // New URL with Construction Worker / Hard Hat
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80',
    context: 'Tribal knowledge is a liability. If key decision-making cannot be delegated, the enterprise is not scalable.',
    description: 'Human capital risk. When knowledge is undocumented, it walks out the door every evening.',
    q1: 'Tribal Knowledge',
    q1Context: '',
    q1Question: 'The "Bus Factor": If your key engineers or operational leaders leave, does the IP leave with them?',
    q1Detail: 'Undocumented processes leave the building every evening. Is there a wiki or playbook? If the lead engineer is unreachable, can a junior deploy code?',
    q2: 'Founder Dependency',
    q2Context: '',
    q2Question: 'Does every critical decision require the Founder’s sign-off? Can the business function for 30 days without you?',
    q2Detail: 'Centralized decision-making creates a scalability bottleneck. Does the org chart collapse without the founder? This destroys enterprise value during an exit.',
  },
];