// src/constants/index.ts

// UPDATED IMPORT: Now points up one level to ../types
import { RiskCategory } from '../types';

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
  const magnitude = x + y;
  
  // CRITICAL (15-20) - Immediate Threat
  if (magnitude >= 15) return '#DC2626'; // Red 600
  
  // HIGH (12-14) - Volatile
  if (magnitude >= 12) return '#EA580C'; // Orange 600
  
  // MODERATE (9-11) - Strained
  if (magnitude >= 9)  return '#CA8A04'; // Yellow 600
  
  // MANAGED (0-8) - Optimized
  return '#059669'; // Emerald 600
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

// Note: This static list is used for the Progress Bar or legacy display, 
// but the actual inputs are now driven by scenarios.ts.
export const RISK_CARDS = [
  {
    id: RiskCategory.SUPPLY_CHAIN,
    title: 'Supply Chain',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80',
    context: 'Single-source dependencies create fragile bottlenecks.',
    description: 'Physical goods and digital dependencies form the backbone of delivery.',
    q1: 'Component Redundancy',
    q1Question: 'If your primary supplier vanishes, does production halt?',
    q1Detail: 'Consider single points of failure.',
    q2: 'Recovery Latency',
    q2Question: 'Weeks to identify and vet a replacement?',
    q2Detail: 'Time-to-Recovery (TTR) is the silent killer.',
  },
  {
    id: RiskCategory.CASH_FLOW,
    title: 'Cash Flow',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80',
    context: 'Liquidity acts as a shock absorber.',
    description: 'Liquidity is the oxygen of the business.',
    q1: 'Customer Concentration',
    q1Question: 'Does a single client hold the keys to your payroll?',
    q1Detail: 'Revenue diversity protects against shocks.',
    q2: 'Liquidity Gap',
    q2Question: 'Months of runway in a zero-revenue scenario?',
    q2Detail: 'Burn rate vs. Reserves.',
  },
  {
    id: RiskCategory.WEATHER_PHYSICAL,
    title: 'Weather & Physical',
    imageUrl: 'https://images.unsplash.com/photo-1454789476662-53eb23ba5907?auto=format&fit=crop&q=80',
    context: 'Physical assets are under-insured against volatility.',
    description: 'Environmental volatility is increasing.',
    q1: 'Geographic Exposure',
    q1Question: 'Are you in a flood zone or hurricane path?',
    q1Detail: 'Assess physical location risks.',
    q2: 'Facility Redundancy',
    q2Question: 'Can you operate from a secondary location?',
    q2Detail: 'Disaster recovery plan status.',
  },
  {
    id: RiskCategory.INFRASTRUCTURE_TOOLS,
    title: 'Infrastructure & Tools',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef2bb6db879c?auto=format&fit=crop&q=80',
    context: 'Digital sovereignty is critical.',
    description: 'Platform risk is the new supply chain risk.',
    q1: 'Platform Dependency',
    q1Question: 'If AWS/Azure goes down, are you trapped?',
    q1Detail: 'Vendor lock-in risk.',
    q2: 'Digital Sovereignty',
    q2Question: 'Can you easily export your customer data?',
    q2Detail: 'Data ownership and portability.',
  },
  {
    id: RiskCategory.WORKFORCE,
    title: 'Workforce',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80',
    context: 'Tribal knowledge is a liability.',
    description: 'Human capital risk and undocumented knowledge.',
    q1: 'Tribal Knowledge',
    q1Question: 'If key leaders leave, does IP leave with them?',
    q1Detail: 'Undocumented processes.',
    q2: 'Founder Dependency',
    q2Question: 'Does every decision require the Founder?',
    q2Detail: 'Scalability bottlenecks.',
  },
];