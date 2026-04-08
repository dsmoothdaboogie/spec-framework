import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-mini-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './mini-grid.component.html',
  styleUrl: './mini-grid.component.scss',
})
export class MiniGridComponent {
  columnDefs = input.required<ColDef[]>();
  rowData = input.required<any[]>();
  maxRows = input(5);
  title = input<string>();
  viewAllLabel = input('View all');

  viewAllClicked = output<void>();

  readonly visibleData = computed(() =>
    this.rowData().slice(0, this.maxRows())
  );

  readonly hasMore = computed(() =>
    this.rowData().length > this.maxRows()
  );

  readonly gridOptions: GridOptions = {
    headerHeight: 36,
    rowHeight: 36,
    domLayout: 'autoHeight',
    suppressHorizontalScroll: true,
    suppressCellFocus: true,
    animateRows: false,
  };
}
