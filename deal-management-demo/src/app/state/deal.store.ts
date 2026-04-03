import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Deal } from '../shared/types/deal.types';
import { MOCK_DEALS } from '../shared/mock/deal-mock-data';

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

export const DealStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(({ items, requestState }) => ({
    isLoading: computed(() => requestState() === 'loading'),
    hasError:  computed(() => requestState() === 'error'),
    isEmpty:   computed(() => requestState() === 'success' && items().length === 0),
  })),

  withMethods((store) => ({
    loadDeals(): void {
      patchState(store, { requestState: 'loading', error: null });
      // Simulate async load with setTimeout
      setTimeout(() => {
        patchState(store, { items: MOCK_DEALS, requestState: 'success' });
      }, 300);
    },
  })),
);
