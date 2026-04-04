import React from 'react';
import { ApiDeliveryPoint } from '../../types/api';

interface WarehouseSelectorProps {
  warehouses: ApiDeliveryPoint[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
}

export const WarehouseSelector: React.FC<WarehouseSelectorProps> = ({ 
  warehouses, 
  selectedId, 
  onSelect, 
  loading 
}) => {
  return (
    <div className="warehouse-selector-container">
      <span className="warehouse-selector-label">Warehouse:</span>
      {loading ? (
        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>Loading...</span>
      ) : (
        <select 
          className="warehouse-select"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {warehouses.length === 0 && <option value="">No warehouses available</option>}
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
