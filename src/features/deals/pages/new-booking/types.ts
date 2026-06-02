export type FormState = {
  instrumentType: string;
  isin: string;
  instrumentName: string;
  issuer: string;
  sector: string;
  currency: string;
  classification: string;
  ifrs13Level: string;
  faceValue: string;
  purchasePrice: string;
  purchaseYield: string;
  couponRate: string;
  couponFrequency: string;
  discountRate: string;
  purchaseDate: string;
  maturityDate: string;
  settlementDate: string;
  custodian: string;
  counterparty: string;
  dayCount: string;
  portfolio: string;
  notes: string;
};

export type SelectOption = string | { value: string; label: string };
