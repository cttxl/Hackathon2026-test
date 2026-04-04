import type { Order } from '../../types/api';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../../pages/AdminPage.css';
import '../../pages/LogistPage.css';

interface PriorityModalProps {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
  onSavePriority: (newOrderList: Order[]) => void;
}

function SortableOrderItem({ order }: { order: Order }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="sortable-item">
      <span>{order.transportName} <span style={{ opacity: 0.5 }}>- {order.driverName}</span></span>
      <span className="badge-pending" style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
        Priority: {order.priority}
      </span>
    </div>
  );
}

export function PriorityModal({ orders, isOpen, onClose, onSavePriority }: PriorityModalProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!isOpen) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = orders.findIndex((o) => o.id === active.id);
      const newIndex = orders.findIndex((o) => o.id === over?.id);

      const newArray = arrayMove(orders, oldIndex, newIndex);
      // Remap priorities to ensure list state matches visual order properly
      const priorityMappedArray = newArray.map((o, idx) => ({ ...o, priority: idx + 1 }));

      onSavePriority(priorityMappedArray);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <h3 className="modal-title">Edit Order Priority</h3>

        <div className="sortable-list-bg">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orders} strategy={verticalListSortingStrategy}>
              {orders.map(order => (
                <SortableOrderItem key={order.id} order={order} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

