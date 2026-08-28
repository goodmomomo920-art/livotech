import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  const typeName = product.product_types?.name ?? 'Product';
  const catName = product.categories?.name ?? '';
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discount = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      <div className="product-image">
        {product.thumbnail && <img src={product.thumbnail} alt={product.name} />}
        <span className="product-type-badge">{typeName}</span>
        {hasDiscount && <span className="product-discount-badge">-{discount}%</span>}
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p>{product.short_description ?? ''}</p>
        <div className="product-bottom">
          <strong>
            {product.is_subscription ? (
              <>From <span>${product.price}</span><small>/{product.billing_interval}</small></>
            ) : (
              <>From <span>${product.price}</span></>
            )}
          </strong>
          <span className="small-button">View <ArrowRight size={13} /></span>
        </div>
      </div>
    </Link>
  );
}
