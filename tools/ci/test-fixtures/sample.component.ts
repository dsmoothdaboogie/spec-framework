// @spec ds/patterns/ag-grid-datatable v2.0.0
// @persona domain/personas/coverage-banker v1.0.0

import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { MatSort } from '@angular/material/sort'; // violation: direct material import
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'app-sample-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sample.component.html',
  styleUrls: ['./sample.component.scss'],
  imports: [AgGridAngular],
})
export class SampleGridComponent {
  private store = inject(SomeStore);

  entityId = input.required<string>();
  rowClicked = output<any>();

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<any[]>([]);

  columnDefs = [
    { field: 'dealName', pinned: 'left', headerName: 'Deal Name' },
    { field: 'issuer', headerName: 'Issuer' },
    {
      field: 'estimatedRevenue',
      headerName: 'Est. Revenue',
      valueGetter: (params) => params.data ? params.data.dealSize * params.data.spread : null,
    },
    { field: 'actions', pinned: 'right', headerName: '' },
  ];

  defaultColDef = { sortable: true, sort: 'asc' };

  retry() {
    this.loading.set(true);
    this.error.set(null);
  }
}
