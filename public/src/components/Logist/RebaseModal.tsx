import { ApiArrival } from '../../types/api';

interface RebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  arrivals: ApiArrival[];
  vehicleMap: Map<string, string>;
  driverMap: Map<string, string>;
  onSelect: (arrivalId: string) => void;
}

export function RebaseModal({
  isOpen,
  onClose,
  arrivals,
  vehicleMap,
  driverMap,
  onSelect
}: RebaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Select Target Arrival</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
            Choose an arrival to assign or move this request to.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {arrivals.map(a => (
              <button
                key={a.id}
                className="arrival-select-item"
                onClick={() => {
                  onSelect(a.id);
                  onClose();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>
                  {vehicleMap.get(a.transport_id) || 'Unknown Vehicle'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Driver: {driverMap.get(a.driver_id) || 'Unknown Driver'} | {a.id.slice(0, 8)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '20px' }}>
          <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
