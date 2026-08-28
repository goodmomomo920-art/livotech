import { useEffect, useState } from 'react';
import { Package, Plus, X, Image as ImageIcon, Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, ProductImage } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalProduct, setImageModalProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [savingImages, setSavingImages] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_types(*), categories(*)')
      .order('sort_order');
    setProducts(data as Product[] ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openImageModal = async (product: Product) => {
    setImageModalProduct(product);
    setShowImageModal(true);
    const { data } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order');
    setImages(data as ProductImage[] ?? []);
  };

  const addImage = async () => {
    if (!imageModalProduct || !newImageUrl.trim()) return;
    const { data } = await supabase
      .from('product_images')
      .insert({ product_id: imageModalProduct.id, url: newImageUrl.trim(), sort_order: images.length })
      .select('*')
      .single();
    if (data) {
      setImages([...images, data as ProductImage]);
      setNewImageUrl('');
    }
  };

  const removeImage = async (imageId: string) => {
    await supabase.from('product_images').delete().eq('id', imageId);
    setImages(images.filter((img) => img.id !== imageId));
  };

  const setThumbnail = async (productId: string, url: string) => {
    setSavingImages(true);
    await supabase.from('products').update({ thumbnail: url }).eq('id', productId);
    setSavingImages(false);
    await fetchProducts();
  };

  return (
    <div>
      <div className="dash-page-header">
        <h1>Products</h1>
        <button className="btn btn-dark btn-sm"><Plus size={14} /> Add Product</button>
      </div>
      {loading ? (
        <div className="dash-table"><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" description="Add products to your catalog." />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>Product</th><th>Type</th><th>Category</th><th>Price</th><th>Subscription</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-product-cell">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} className="admin-product-thumb" />
                      ) : (
                        <div className="admin-product-thumb-placeholder"><ImageIcon size={16} /></div>
                      )}
                      <b>{p.name}</b>
                    </div>
                  </td>
                  <td>{p.product_types?.name ?? '—'}</td>
                  <td>{p.categories?.name ?? '—'}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>{p.is_subscription ? `Yes (${p.billing_interval})` : 'No'}</td>
                  <td><StatusBadge status={p.is_active ? 'active' : 'suspended'} /></td>
                  <td>
                    <button className="btn btn-light btn-sm" onClick={() => openImageModal(p)}>
                      <ImageIcon size={13} /> Images
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showImageModal && imageModalProduct && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Images — {imageModalProduct.name}</h2>
              <button className="modal-close" onClick={() => setShowImageModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="image-thumb-section">
                <label>Thumbnail (main product image)</label>
                <div className="thumb-preview">
                  {imageModalProduct.thumbnail ? (
                    <img src={imageModalProduct.thumbnail} alt="" />
                  ) : (
                    <div className="thumb-placeholder"><ImageIcon size={28} /></div>
                  )}
                </div>
                <div className="thumb-input-row">
                  <input
                    type="url"
                    placeholder="Paste image URL..."
                    value={imageModalProduct.thumbnail ?? ''}
                    onChange={(e) => setImageModalProduct({ ...imageModalProduct, thumbnail: e.target.value })}
                  />
                  <button
                    className="btn btn-dark btn-sm"
                    onClick={() => setThumbnail(imageModalProduct.id, imageModalProduct.thumbnail ?? '')}
                    disabled={savingImages}
                  >
                    {savingImages ? <Check size={13} /> : <Save size={13} />} Save
                  </button>
                </div>
              </div>

              <div className="image-gallery-section">
                <label>Product Gallery Images</label>
                <div className="image-add-row">
                  <input
                    type="url"
                    placeholder="Paste image URL to add..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addImage()}
                  />
                  <button className="btn btn-dark btn-sm" onClick={addImage}><Plus size={13} /> Add</button>
                </div>
                {images.length > 0 ? (
                  <div className="image-gallery-grid">
                    {images.map((img) => (
                      <div key={img.id} className="image-gallery-item">
                        <img src={img.url} alt="" />
                        <div className="image-gallery-actions">
                          <button onClick={() => setThumbnail(imageModalProduct.id, img.url)} title="Set as thumbnail"><ImageIcon size={13} /></button>
                          <button onClick={() => removeImage(img.id)} title="Remove"><X size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dash-muted">No gallery images yet. Add image URLs above.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
