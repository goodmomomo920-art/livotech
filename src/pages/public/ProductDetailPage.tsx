import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Addon } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

export function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: prod } = await supabase
        .from('products')
        .select('*, product_types(*), categories(*), product_features(*), product_faqs(*)')
        .eq('slug', slug)
        .maybeSingle();
      setProduct(prod as Product | null);

      if (prod) {
        const { data: pa } = await supabase
          .from('product_addons')
          .select('addons(*)')
          .eq('product_id', prod.id);
        setAddons((pa ?? []).map((x: { addons: Addon[] }) => x.addons).flat().filter(Boolean) as Addon[]);

        const { data: rel } = await supabase
          .from('products')
          .select('*, product_types(*), categories(*)')
          .eq('category_id', prod.category_id)
          .neq('id', prod.id)
          .eq('is_active', true)
          .limit(3);
        setRelated(rel as Product[] ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="page-wrap section-wrap"><div className="product-grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div></div>;

  if (!product) {
    return (
      <div className="page-wrap section-wrap">
        <EmptyState icon={Package} title="Product not found" description="This product may have been removed or is no longer available." action={<Link to="/products" className="btn btn-dark">Back to Products</Link>} />
      </div>
    );
  }

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discount = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  return (
    <div className="page-wrap section-wrap">
      <div className="breadcrumb"><Link to="/">Home</Link> <ChevronDown size={12} className="rotate-[-90deg]" /> <Link to="/products">Products</Link> <ChevronDown size={12} className="rotate-[-90deg]" /> <span>{product.name}</span></div>

      <div className="product-detail-grid">
        <div className="product-detail-left">
          <div className="product-detail-image">
            {product.thumbnail && <img src={product.thumbnail} alt={product.name} />}
            {hasDiscount && <span className="product-discount-badge">-{discount}%</span>}
          </div>
          <div className="product-detail-section">
            <h3>Description</h3>
            <p>{product.description ?? product.short_description}</p>
          </div>
          {product.product_features && product.product_features.length > 0 && (
            <div className="product-detail-section">
              <h3>Features</h3>
              <div className="features-grid">
                {product.product_features.map((f) => (
                  <div key={f.id} className="feature-item"><Check size={15} /> {f.feature}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="product-detail-right">
          <span className="product-type-badge large">{product.product_types?.name ?? 'Product'}</span>
          <h1>{product.name}</h1>
          <p className="product-detail-short">{product.short_description}</p>
          <div className="product-detail-pricing">
            {hasDiscount && <span className="compare-price">${product.compare_at_price}</span>}
            <span className="current-price">${product.price}</span>
            {product.is_subscription && <span className="billing-interval">/{product.billing_interval}</span>}
            {hasDiscount && <span className="discount-tag">Save {discount}%</span>}
          </div>
          <Link to="/register" className="btn btn-dark btn-lg w-full">Get Started <ArrowRight size={16} /></Link>
          <Link to="/contact" className="btn btn-outline btn-lg w-full">Contact Sales</Link>
          <div className="product-trust"><Check size={13} /> 14-day money-back guarantee</div>
        </div>
      </div>

      {addons.length > 0 && (
        <div className="product-detail-section">
          <h3>Available Add-ons</h3>
          <div className="addon-list">
            {addons.map((a) => (
              <div key={a.id} className="addon-list-item">
                <div className="addon-list-info"><b>{a.name}</b><p>{a.description}</p></div>
                <div className="addon-list-price"><span>+${a.price}</span><small>/{a.billing_interval}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.product_faqs && product.product_faqs.length > 0 && (
        <div className="product-detail-section">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-list">
            {product.product_faqs.map((faq, i) => (
              <div key={faq.id} className="faq-item">
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.question}
                  <ChevronDown size={16} className={openFaq === i ? 'rotate-180' : ''} />
                </button>
                {openFaq === i && <div className="faq-answer">{faq.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div className="product-detail-section">
          <h3>Related Products</h3>
          <div className="product-grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
