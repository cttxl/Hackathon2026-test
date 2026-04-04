import { useState, FormEvent, useEffect } from 'react';
import { Order, OrderStatus, mockWarehouses, mockTransports } from '../../data/mockOrders';
import { getVehicles, getDeliveryPoints } from '../../services/api';
import type { ApiVehicle, ApiDeliveryPoint } from '../../types/api';
import '../../pages/AdminPage.css';

interface EditOrderModalProps {
  order?: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
}

// Map API arrival status to UI status
const API_TO_UI_STATUS: Record<string, OrderStatus> = {
  pending:   'Pending',
  accepted:  'Accepted',
  shipped:   'In Transit',
  delivered: 'Delivered',
  cancelled: 'Canceled',
};

const UI_TO_API_STATUS: Record<OrderStatus, string> = {
  'Pending':    'pending',
  'Accepted':   'accepted',
  'In Transit': 'shipped',
  'Delivered':  'delivered',
  'Canceled':   'cancelled',
};

export { UI_TO_API_STATUS, API_TO_UI_STATUS };

export function EditOrderModal({ order, isOpen, onClose, onSave }: EditOrderModalProps) {
  const [formData, setFormData] = useState<Partial<Order>>({});

  // API-sourced dropdown options
  const [vehicles,  setVehicles]  = useState<ApiVehicle[]>([]);
  const [warehouses, setWarehouses] = useState<ApiDeliveryPoint[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Vehicle names for dropdown (fall back to mock list)
  const vehicleNames  = vehicles.length  > 0 ? vehicles.map(v => v.name)  : mockTransports;
  const warehouseNames = warehouses.length > 0 ? warehouses.map(w => w.name) : mockWarehouses;

  useEffect(() => {
    if (!isOpen) return;

    // Populate form
    if (order) {
      setFormData(order);
    } else {
      setFormData({
        transportName:    vehicleNames[0] ?? '',
        driverName:       '',
        placeOfDeparture: warehouseNames[0] ?? '',
        timeToDeparture:  '0h 0m',
        timeOfArrival:    '12:00',
        status:           'Pending',
        priority:         99,
      });
    }

    // Load dropdowns from API
    setLoadingDropdowns(true);
    Promise.all([
      getVehicles().then(r => setVehicles(r.data)).catch(() => {}),
      getDeliveryPoints('warehouse').then(r => setWarehouses(r.data)).catch(() => {}),
    ]).finally(() => setLoadingDropdowns(false));
  }, [isOpen, order]);

  if (!isOpen) return null;

  const isEditing = !!order;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData as Order);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">{isEditing ? 'Edit Order' : 'Add New Order'}</h3>

        <form onSubmit={handleSubmit} className="login-form">

          <div className="input-group">
            <label>Driver Name</label>
            <input
              type="text"
              required
              value={formData.driverName || ''}
              onChange={e => setFormData({ ...formData, driverName: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Transport / Car {loadingDropdowns && <span style={{ opacity: 0.5, fontSize: 12 }}>(loading…)</span>}</label>
            <select
              className="select-input"
              value={formData.transportName}
              onChange={e => setFormData({ ...formData, transportName: e.target.value })}
            >
              {vehicleNames.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Place of Departure {loadingDropdowns && <span style={{ opacity: 0.5, fontSize: 12 }}>(loading…)</span>}</label>
            <select
              className="select-input"
              value={formData.placeOfDeparture}
              onChange={e => setFormData({ ...formData, placeOfDeparture: e.target.value })}
            >
              {warehouseNames.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Time of Arrival</label>
            <input
              type="time"
              required
              value={formData.timeOfArrival || '12:00'}
              onChange={e => setFormData({ ...formData, timeOfArrival: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Order Status</label>
            <select
              className="select-input"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as OrderStatus })}
            >
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
