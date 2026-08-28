import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="page-btn" aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          className={`page-btn ${page === i + 1 ? 'page-btn-active' : ''}`}
          onClick={() => onPageChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="page-btn" aria-label="Next page">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
