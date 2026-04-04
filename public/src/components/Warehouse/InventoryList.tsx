import React, { useEffect, useState } from 'react';
import { ApiSku, ApiProduct } from '../../types/api';
import { getProductById } from '../../services/api';

interface InventoryListProps {
  skus: ApiSku[];
  loading: boolean;
}

export const InventoryList: React.FC<InventoryListProps> = ({ skus, loading }) => {
  const [products, setProducts] = useState<Record<string, ApiProduct>>({});

  useEffect(() => {
    // Fetch product details for new SKUs
    const fetchNewProducts = async () => {
      const uniqueProductIds = Array.from(new Set((skus || []).map((s) => s.product_id)));
      const missingIds = uniqueProductIds.filter((id) => !products[id]);

      if (missingIds.length === 0) return;

      const productPromises = missingIds.map((id) => getProductById(id));
      try {
        const productResults = await Promise.all(productPromises);
        setProducts((prev) => {
          const next = { ...prev };
          productResults.forEach((p) => (next[p.id] = p));
          return next;
        });
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      }
    };

    fetchNewProducts();
  }, [skus, products]);

  return (
    <div className="inventory-panel">
      <div className="panel-header">
        <h3 className="panel-title">Warehouse Inventory</h3>
        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
          {(skus?.length || 0)} Items Total
        </span>
      </div>

      <div className="scrollable-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Loading inventory...</div>
        ) : (skus?.length || 0) === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No stock in this warehouse.</div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Weight</th>
                <th>Dimensions (H×W×L)</th>
              </tr>
            </thead>
            <tbody>
              {(skus || []).map((sku) => {
                const product = products[sku.product_id];
                return (
                  <tr key={sku.id}>
                    <td>{product ? product.name : 'Loading...'}</td>
                    <td>{product ? `${product.weight} kg` : '...'}</td>
                    <td>
                      {product 
                        ? `${product.height}×${product.width}×${product.length} cm` 
                        : '...'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
