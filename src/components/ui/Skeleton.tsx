export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img" />
      <div className="skeleton-line w-70" />
      <div className="skeleton-line w-100" />
      <div className="skeleton-line w-50" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="skeleton-row">
      <div className="skeleton-circle" />
      <div className="skeleton-line w-30" />
      <div className="skeleton-line w-40" />
      <div className="skeleton-line w-20" />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </>
  );
}
