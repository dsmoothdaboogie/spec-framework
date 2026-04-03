// @spec-reads: ds/patterns/deal-grid-calculations v1.0.0
// Pure functions only — no side effects, no injection.

import { DealStage, StageRiskColor } from '../types/deal.types';

// ── §3.1 formatDealSize ──────────────────────────────────────────────────────
export function formatDealSize(millions: number): string {
  if (millions >= 1000) {
    return `$${(millions / 1000).toFixed(1)}bn`;
  }
  return `$${Math.round(millions)}m`;
}

// ── §3.2 calcGrossRevenue ────────────────────────────────────────────────────
export function calcGrossRevenue(dealSizeM: number, grossSpreadBps: number): number {
  return dealSizeM * (grossSpreadBps / 10000);
}

// ── §3.3 calcManagementFeeRevenue ────────────────────────────────────────────
export function calcManagementFeeRevenue(
  grossRevenue: number,
  managementFeePercent: number,
): number {
  return grossRevenue * (managementFeePercent / 100);
}

// ── §3.4 calcDaysInStage ─────────────────────────────────────────────────────
export function calcDaysInStage(stageChangedDate: Date, today?: Date): number {
  const reference = today ?? new Date();
  const ms = reference.getTime() - new Date(stageChangedDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ── §3.5 calcDaysToClose ─────────────────────────────────────────────────────
export function calcDaysToClose(
  expectedCloseDate: Date | null,
  today?: Date,
): number | null {
  if (!expectedCloseDate) return null;
  const reference = today ?? new Date();
  const ms = new Date(expectedCloseDate).getTime() - reference.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// ── §3.6 calcDealAging ───────────────────────────────────────────────────────
export function calcDealAging(createdDate: Date, today?: Date): number {
  const reference = today ?? new Date();
  const ms = reference.getTime() - new Date(createdDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ── §3.7 formatBps ───────────────────────────────────────────────────────────
export function formatBps(value: number): string {
  return `${value}bps`;
}

// ── §3.8 calcCoverageRatio ───────────────────────────────────────────────────
export function calcCoverageRatio(allocated: number, demanded: number): number {
  if (demanded === 0) return 0;
  return allocated / demanded;
}

// ── §3.9 formatCoverageMultiple ──────────────────────────────────────────────
export function formatCoverageMultiple(multiple: number): string {
  return `${multiple.toFixed(1)}x`;
}

// ── §3.10 dealSizeCategory ───────────────────────────────────────────────────
export function dealSizeCategory(
  millions: number,
): 'small' | 'mid' | 'large' | 'jumbo' {
  if (millions < 100) return 'small';
  if (millions < 500) return 'mid';
  if (millions < 2000) return 'large';
  return 'jumbo';
}

// ── §3.11 calcMilestonesPercent ──────────────────────────────────────────────
export function calcMilestonesPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// ── §3.12 stageRiskColor ─────────────────────────────────────────────────────
const STAGE_WARNING_DAYS: Partial<Record<DealStage, number>> = {
  Origination: 30,
  Mandate: 14,
  'Due Diligence': 21,
  Marketing: 7,
  Pricing: 3,
};

const STAGE_ERROR_DAYS: Partial<Record<DealStage, number>> = {
  Origination: 60,
  Mandate: 30,
  'Due Diligence': 45,
  Marketing: 14,
  Pricing: 7,
};

export function stageRiskColor(daysInStage: number, stage: DealStage): StageRiskColor {
  if (stage === 'Closed' || stage === 'Withdrawn') return 'success';
  const errorThreshold = STAGE_ERROR_DAYS[stage];
  const warnThreshold = STAGE_WARNING_DAYS[stage];
  if (errorThreshold !== undefined && daysInStage >= errorThreshold) return 'error';
  if (warnThreshold !== undefined && daysInStage >= warnThreshold) return 'warning';
  return 'success';
}
