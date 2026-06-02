export interface ReturnsRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  fairValue: number;
  acCarrying: number;
  ociReserve: number;
  unrealisedGL: number;
  returnPct: number;
}

export interface ReturnMetricsRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  eir: number;
  hpr: number;
  twr: number;
  mwr: number;
  projected: number;
  holdingYears: number;
  ytm: number;
}

export type Row = ReturnsRow & Record<string, unknown>;
export type MRow = ReturnMetricsRow & Record<string, unknown>;
