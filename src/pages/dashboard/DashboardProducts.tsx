import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CustomerProduct } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

export function DashboardProducts() {
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from('customer_products')
        .select('*, products(*, product_types(*), categories(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setProducts(data as CustomerProduct[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="dash-page-header"><h1>My Products</h1><Link to="/products" className="btn btn-dark btn-sm">Browse Products <ArrowRight size={14} /></Link></div>
      {loading ? (
        <div className="product-grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" description="You haven't purchased any products yet." action={<Link to="/products" className="btn btn-dark">Explore Products</Link>} />
      ) : (
        <div className="dash-product-grid">
          {products.map((cp) => (
            <div key={cp.id} className="dash-product-card">
              {cp.products?.thumbnail && <img src={cp.products.thumbnail} alt="" />}
              <div className="dash-product-card-body">
                <span className="product-type-badge">{cp.products?.product_types?.name}</span>
                <h3>{cp.products?.name}</h3>
                <p>{cp.products?.short_description}</p>
                <div className="dash-product-card-footer">
                  <StatusBadge status={cp.status} />
                  {cp.plan && <span className="dash-plan">{cp.plan}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
