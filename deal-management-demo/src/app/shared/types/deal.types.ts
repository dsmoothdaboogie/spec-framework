export type DealType =
  | 'IPO'
  | 'Follow-on'
  | 'M&A Advisory'
  | 'ECM'
  | 'DCM'
  | 'Leveraged Finance';

export type DealStage =
  | 'Origination'
  | 'Mandate'
  | 'Due Diligence'
  | 'Marketing'
  | 'Pricing'
  | 'Closed'
  | 'Withdrawn';

export type ConflictStatus = 'Cleared' | 'Pending' | 'Flagged' | 'Waived';

export type DealSizeCategory = 'small' | 'mid' | 'large' | 'jumbo';

export type StageRiskColor = 'success' | 'warning' | 'error';

export interface Deal {
  dealId: string;
  dealName: string;
  issuerName: string;

  dealType: DealType;
  stage: DealStage;
  currency: string;

  // Financials
  dealSizeUsd: number;           // millions
  grossSpreadBps: number;        // basis points
  managementFeePercent: number;
  underwritingFeePercent: number;
  sellingConcessionPercent: number;

  // Ownership
  coverageBankerId: string;
  coverageBankerName: string;
  syndicateDeskId: string;
  syndicateDeskName: string;

  // Timeline
  mandateDate: Date | null;
  expectedCloseDate: Date | null;
  pricingDate: Date | null;
  closedDate: Date | null;
  stageChangedDate: Date;
  createdDate: Date;
  lastModified: Date;
  auditTimestamp: Date;

  // Book-building
  bookbuildCoverageMultiple: number;
  syndicateAllocationUsd: number;  // millions

  // Execution milestones
  completedMilestones: number;
  totalMilestones: number;

  // Conflict / compliance
  conflictStatus: ConflictStatus;
  conflictReviewedBy: string | null;
  conflictReviewDate: Date | null;
  conflictNotes: string | null;
  mnpiFlag: boolean;
  infoBarrier: string | null;
}
