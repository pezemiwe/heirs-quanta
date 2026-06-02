export type HoldingRow = {
  id: string;
  name: string;
  instrumentType: string;
  issuer: string;
  sector: string;
  classification: string;
  currency: string;
  faceValue: number;
  bookValueNGN: number;
  eirPct: number;
  couponRate: number;
  maturityDate: string | null;
  stage: string;
  status: string;
  [key: string]: unknown;
};
