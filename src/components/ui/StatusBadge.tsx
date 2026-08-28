interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  active: 'badge-green',
  pending: 'badge-amber',
  processing: 'badge-blue',
  completed: 'badge-green',
  paid: 'badge-green',
  cancelled: 'badge-red',
  expired: 'badge-gray',
  suspended: 'badge-red',
  failed: 'badge-red',
  refunded: 'badge-gray',
  open: 'badge-blue',
  'in_progress': 'badge-amber',
  resolved: 'badge-green',
  closed: 'badge-gray',
  trial: 'badge-purple',
  'past_due': 'badge-red',
  paused: 'badge-gray',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/ /g, '_');
  const colorClass = statusColors[normalized] ?? 'badge-gray';
  return <span className={`status-badge ${colorClass}`}>{status}</span>;
}
