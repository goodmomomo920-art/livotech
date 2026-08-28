import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Puzzle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Addon } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

export function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('addons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setAddons(data as Addon[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="page-wrap section-wrap">
      <div className="page-header">
        <p className="eyebrow">Add-ons</p>
        <h1>Powerful add-ons for your products</h1>
        <p className="page-subtitle">Extend your products with powerful features designed to work seamlessly with your existing setup.</p>
      </div>
      {loading ? (
        <div className="addon-grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : addons.length === 0 ? (
        <EmptyState icon={Puzzle} title="No add-ons available" description="Check back soon for new add-ons." />
      ) : (
        <div className="addon-grid">
          {addons.map((a) => (
            <div key={a.id} className="addon-card-detail">
              <div className="addon-card-icon"><Puzzle size={24} /></div>
              <h3>{a.name}</h3>
              <p>{a.description}</p>
              <div className="addon-card-price">
                <span>+${a.price}</span><small>/{a.billing_interval}</small>
              </div>
              <Link to="/products" className="btn btn-light btn-sm">Learn More <ArrowRight size={13} /></Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
