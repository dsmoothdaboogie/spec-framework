export type WidgetType = 'metricCard' | 'miniGrid' | 'statusDistribution' | 'activityFeed' | 'alertList';
export type MetricFormat = 'number' | 'currency' | 'percent';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface MetricCardConfig {
  type: 'metricCard';
  slot: string;
  label: string;
  metric: string;
  format: MetricFormat;
  trend?: TrendDirection;
  previousValue?: number;
}

export interface MiniGridConfig {
  type: 'miniGrid';
  slot: string;
  title: string;
  maxRows: number;
  dataSource: string;
}

export interface StatusDistributionConfig {
  type: 'statusDistribution';
  slot: string;
  title: string;
  groupBy: string;
}

export interface ActivityFeedConfig {
  type: 'activityFeed';
  slot: string;
  title: string;
  maxItems: number;
}

export interface AlertListConfig {
  type: 'alertList';
  slot: string;
  title: string;
  maxItems: number;
}

export type WidgetConfig =
  | MetricCardConfig
  | MiniGridConfig
  | StatusDistributionConfig
  | ActivityFeedConfig
  | AlertListConfig;

export interface DashboardRow {
  columns: WidgetConfig[];
}

export interface DashboardLayout {
  rows: DashboardRow[];
}

export interface ActivityEvent {
  id: string;
  timestamp: Date;
  description: string;
  actor?: string;
  dealId?: string;
}

export interface AlertItem {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
  dealId?: string;
}

export interface StatusSegment {
  label: string;
  count: number;
  variant: string;
}
