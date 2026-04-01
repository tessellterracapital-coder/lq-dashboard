export interface Supersector {
  code: string;
  label: string;
  description: string;
}

// 10 supersectors used for LQ computation (excludes Total Nonfarm and Total Private)
export const SUPERSECTORS: Supersector[] = [
  { code: "15000000", label: "Mining, Logging & Construction", description: "Includes mining, logging, and construction" },
  { code: "30000000", label: "Manufacturing", description: "Durable + nondurable goods" },
  { code: "40000000", label: "Trade, Transportation & Utilities", description: "Wholesale + retail + transport + utilities" },
  { code: "50000000", label: "Information", description: "Tech, media, telecom, data processing" },
  { code: "55000000", label: "Financial Activities", description: "Finance, insurance, real estate" },
  { code: "60000000", label: "Professional & Business Services", description: "Consulting, legal, defense contractors, management" },
  { code: "65000000", label: "Education & Health Services", description: "Private education + healthcare" },
  { code: "70000000", label: "Leisure & Hospitality", description: "Hotels, restaurants, entertainment, tourism" },
  { code: "80000000", label: "Other Services", description: "Associations, advocacy, repair, religious orgs" },
  { code: "90000000", label: "Government", description: "Federal + state + local government" },
];

export const TOTAL_NONFARM_CODE = "00000000";
