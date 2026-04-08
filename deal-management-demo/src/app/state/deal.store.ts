import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Deal, DealStage, ConflictStatus } from '../shared/types/deal.types';
import { MOCK_DEALS, MOCK_ACTIVITY, MOCK_ALERTS } from '../shared/mock/deal-mock-data';
import type { StatusSegment } from '../shared/types/dashboard.types';

export type RequestState = 'idle' | 'loading' | 'success' | 'error';

export interface DealState {
  items: Deal[];
  requestState: RequestState;
  error: string | null;
}

const initialState: DealState = {
  items: [],
  requestState: 'idle',
  error: null,
};

const ACTIVE_STAGES: DealStage[] = ['Origination', 'Mandate', 'Due Diligence', 'Marketing', 'Pricing'];

const STAGE_VARIANT: Record<DealStage, string> = {
  Origination: 'info', Mandate: 'info', 'Due Diligence': 'warning',
  Marketing: 'warning', Pricing: 'success', Closed: 'neutral', Withdrawn: 'error',
};

const CONFLICT_VARIANT: Record<ConflictStatus, string> = {
  Pending: 'warning', Flagged: 'error', Cleared: 'success', Waived: 'neutral',
};

export const DealStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(({ items, requestState }) => {
    const activeDeals = computed(() =>
      items().filter(d => ACTIVE_STAGES.includes(d.stage))
    );

    return {
      // Existing
      isLoading: computed(() => requestState() === 'loading'),
      hasError:  computed(() => requestState() === 'error'),
      isEmpty:   computed(() => requestState() === 'success' && items().length === 0),

      // Dashboard: counts
      activeDeals,
      activeDealCount: computed(() => activeDeals().length),
      totalDealCount: computed(() => items().length),

      // Dashboard: pipeline value (sum of dealSizeUsd for active deals, in millions)
      totalPipelineValue: computed(() =>
        activeDeals().reduce((sum, d) => sum + d.dealSizeUsd, 0)
      ),

      // Dashboard: average deal size
      avgDealSize: computed(() => {
        const active = activeDeals();
        return active.length > 0
          ? active.reduce((sum, d) => sum + d.dealSizeUsd, 0) / active.length
          : 0;
      }),

      // Dashboard: deals by stage (for StatusDistribution)
      dealsByStage: computed((): StatusSegment[] => {
        const counts = new Map<DealStage, number>();
        for (const d of items()) {
          counts.set(d.stage, (counts.get(d.stage) ?? 0) + 1);
        }
        return Array.from(counts.entries()).map(([label, count]) => ({
          label,
          count,
          variant: STAGE_VARIANT[label],
        }));
      }),

      // Dashboard: deals by conflict status (for StatusDistribution)
      dealsByConflictStatus: computed((): StatusSegment[] => {
        const counts = new Map<ConflictStatus, number>();
        for (const d of items()) {
          counts.set(d.conflictStatus, (counts.get(d.conflictStatus) ?? 0) + 1);
        }
        return Array.from(counts.entries()).map(([label, count]) => ({
          label,
          count,
          variant: CONFLICT_VARIANT[label],
        }));
      }),

      // Dashboard: pending conflicts count
      pendingConflicts: computed(() =>
        items().filter(d => d.conflictStatus === 'Pending').length
      ),

      // Dashboard: flagged conflicts count
      flaggedConflicts: computed(() =>
        items().filter(d => d.conflictStatus === 'Flagged').length
      ),

      // Dashboard: MNPI flagged deals count
      mnpiFlaggedCount: computed(() =>
        items().filter(d => d.mnpiFlag).length
      ),

      // Dashboard: avg milestone completion (percent)
      avgMilestonePercent: computed(() => {
        const active = activeDeals();
        if (active.length === 0) return 0;
        const total = active.reduce((sum, d) =>
          sum + (d.totalMilestones > 0 ? (d.completedMilestones / d.totalMilestones) * 100 : 0), 0
        );
        return Math.round(total / active.length);
      }),

      // Dashboard: top deals by size (for MiniGrid)
      topDealsBySize: computed(() =>
        [...activeDeals()].sort((a, b) => b.dealSizeUsd - a.dealSizeUsd).slice(0, 5)
      ),

      // Dashboard: approaching close deals (next 30 days)
      approachingClose: computed(() =>
        activeDeals()
          .filter(d => d.expectedCloseDate != null)
          .sort((a, b) => a.expectedCloseDate!.getTime() - b.expectedCloseDate!.getTime())
          .slice(0, 5)
      ),

      // Static mock data references (no transformation needed)
      activityFeed: computed(() => MOCK_ACTIVITY),
      alerts: computed(() => MOCK_ALERTS),
    };
  }),

  withMethods((store) => ({
    loadDeals(): void {
      patchState(store, { requestState: 'loading', error: null });
      setTimeout(() => {
        patchState(store, { items: MOCK_DEALS, requestState: 'success' });
      }, 300);
    },
  })),
);
