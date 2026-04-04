import { useState, FormEvent, useEffect } from 'react';
import type { Order, OrderStatus } from '../../types/api';
import type { ApiVehicle, ApiEmployee } from '../../types/api';
import '../../pages/AdminPage.css';

interface EditOrderModalProps {
  order?: Order | null;
  isOpen: boolean;
  vehicles: ApiVehicle[];
  employees: ApiEmployee[];   // driver employees only
  onClose: () => void;
  onSave: (order: Order) => void;
}

const STATUSES: OrderStatus[] = ['Pending', 'Accepted', 'In Transit', 'Delivered', 'Canceled'];

export function EditOrderModal({
  order,
  isOpen,
  vehicles,
  employees,
  onClose,
  onSave,
}: EditOrderModalProps) {
  const [formData, setFormData] = useState<Partial<Order>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (order) {
      setFormData(order);
    } else {
      setFormData({
        transportName: vehicles[0]?.name ?? '',
        driverName: employees[0]?.fullname ?? '',
        placeOfDeparture: 'N/A',
        timeToDeparture: 'N/A',
        timeOfArrival: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Pending',
        priority: 99,
        // Store raw IDs for POST /arrivals
        _raw: {
          id: '',
          transport_id: vehicles[0]?.id ?? '',
          driver_id: employees[0]?.id ?? '',
          time_to_arrival: new Date().toISOString(),
          status: 'pending',
        },
      });
    }
  }, [isOpen, order, vehicles, employees]);

  if (!isOpen) return null;

  const isEditing = !!order;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData as Order);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">{isEditing ? 'Edit Arrival' : 'Add New Arrival'}</h3>

        <form onSubmit={handleSubmit} className="login-form">

          {/* Vehicle selector — live from API */}
          <div className="input-group">
            <label>Transport / Vehicle</label>
            {vehicles.length > 0 ? (
              <select
                className="select-input"
                value={formData._raw?.transport_id ?? ''}
                onChange={e => {
                  const v = vehicles.find(v => v.id === e.target.value);
                  setFormData((prev: Partial<Order>) => ({
                    ...prev,
                    transportName: v?.name ?? e.target.value,
                    _raw: prev._raw
                      ? { ...prev._raw, transport_id: e.target.value }
                      : undefined,
                  }));
                }}
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="select-input"
                value={formData.transportName ?? ''}
                onChange={e => setFormData({ ...formData, transportName: e.target.value })}
                placeholder="Vehicle name"
              />
            )}
          </div>

          {/* Driver selector — live from API */}
          <div className="input-group">
            <label>Driver</label>
            {employees.length > 0 ? (
              <select
                className="select-input"
                value={formData._raw?.driver_id ?? ''}
                onChange={e => {
                  const emp = employees.find(emp => emp.id === e.target.value);
                  setFormData((prev: Partial<Order>) => ({
                    ...prev,
                    driverName: emp?.fullname ?? e.target.value,
                    _raw: prev._raw
                      ? { ...prev._raw, driver_id: e.target.value }
                      : undefined,
                  }));
                }}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullname}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="select-input"
                value={formData.driverName ?? ''}
                onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="Driver name"
              />
            )}
          </div>

          {/* Time of arrival */}
          <div className="input-group">
            <label>Time of Arrival</label>
            <input
              type="time"
              required
              value={formData.timeOfArrival ?? '12:00'}
              onChange={e => setFormData({ ...formData, timeOfArrival: e.target.value })}
            />
          </div>

          {/* Status */}
          <div className="input-group">
            <label>Status</label>
            <select
              className="select-input"
              value={formData.status ?? 'Pending'}
              onChange={e => setFormData({ ...formData, status: e.target.value as OrderStatus })}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Save Changes' : 'Create Arrival'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


