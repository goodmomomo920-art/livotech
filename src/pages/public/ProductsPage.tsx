import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/Skeleton';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const selectedCat = searchParams.get('cat') ?? 'all';

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*, product_types(*), categories(*)')
        .eq('is_active', true)
        .order('sort_order');

      if (selectedCat !== 'all') {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', selectedCat)
          .maybeSingle();
        if (cat) query = query.eq('category_id', cat.id);
      }

      const { data } = await query;
      setProducts(data as Product[] ?? []);

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setCategories(cats as Category[] ?? []);
      setLoading(false);
    })();
  }, [selectedCat]);

  return (
    <div className="page-wrap section-wrap">
      <div className="page-header">
        <p className="eyebrow">Products</p>
        <h1>Explore our products</h1>
        <p className="page-subtitle">Find the right digital products, tools and solutions for your business.</p>
      </div>

      <div className="filter-tabs">
        <button className={selectedCat === 'all' ? 'filter-tab active' : 'filter-tab'} onClick={() => window.location.href = '/products'}>All</button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={selectedCat === cat.slug ? 'filter-tab active' : 'filter-tab'}
            onClick={() => { window.location.href = `/products?cat=${cat.slug}`; }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="product-grid"><SkeletonGrid count={6} /></div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products found" description="Try a different category or check back soon." />
      ) : (
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
