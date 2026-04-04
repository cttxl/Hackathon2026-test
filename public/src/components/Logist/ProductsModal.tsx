import { useEffect, useState } from 'react';
import { getArrivalRequests, getRequestById, getProductById } from '../../services/api';
import '../../pages/AdminPage.css';

interface ProductEntry {
  name: string;
  quantity: number;
}

interface ProductsModalProps {
  arrivalId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductsModal({ arrivalId, isOpen, onClose }: ProductsModalProps) {
  const [products, setProducts] = useState<ProductEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !arrivalId) return;

    setLoading(true);
    setError(null);
    setProducts([]);

    (async () => {
      try {
        // 1. Get all arrival-requests linked to this arrival
        const arResp = await getArrivalRequests(arrivalId);
        const arrivalRequests = arResp.data;

        if (arrivalRequests.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // 2. For each arrival-request, fetch the base request to get product_id + quantity
        const entries = await Promise.all(
          arrivalRequests.map(async (ar) => {
            try {
              const req = await getRequestById(ar.request_id);
              const product = await getProductById(req.product_id);
              return { name: product.name, quantity: req.quantity } satisfies ProductEntry;
            } catch {
              return { name: `Product ${ar.request_id}`, quantity: 0 };
            }
          })
        );

        setProducts(entries);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, arrivalId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '480px' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="modal-title">Products in Transfer</h3>

        {loading && (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading products…</p>
        )}

        {error && (
          <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>
        )}

        {!loading && !error && products.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', opacity: 0.7 }}>
            No products linked to this transfer.
          </p>
        )}

        {!loading && products.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '50vh', overflowY: 'auto' }}>
            {/* Header row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '16px',
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
            }}>
              <span>Product</span>
              <span>Quantity</span>
            </div>

            {products.map((p, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '16px',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '15px',
              }}>
                <span>{p.name}</span>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>{p.quantity}</span>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

