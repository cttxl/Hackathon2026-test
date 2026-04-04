export type OrderStatus = 'Pending' | 'Accepted' | 'In Transit' | 'Delivered' | 'Canceled';

export interface Order {
  id: string;
  transportName: string;
  driverName: string;
  placeOfDeparture: string;
  timeToDeparture: string; // e.g. "2h 30m"
  timeOfArrival: string; // e.g. "14:30"
  status: OrderStatus;
  priority: number; // For sorting
}

export const mockWarehouses = [
  "Central Hub Lviv",
  "Kyiv North Node",
  "Odesa Port Warehouse",
  "Dnipro Logistics Center",
  "Warsaw Relay Point"
];

export const mockTransports = [
  "Ford Transit A12",
  "Mercedes Sprinter B09",
  "Volvo Long-Haul V90",
  "Renault Kangoo R2",
  "DAF Truck Heavy 4"
];

export const initialOrders: Order[] = [
  {
    id: "101",
    transportName: "Ford Transit A12",
    driverName: "Charlie Driver",
    placeOfDeparture: "Central Hub Lviv",
    timeToDeparture: "0h 15m",
    timeOfArrival: "16:45",
    status: "In Transit",
    priority: 1
  },
  {
    id: "102",
    transportName: "Volvo Long-Haul V90",
    driverName: "Frank Driver",
    placeOfDeparture: "Kyiv North Node",
    timeToDeparture: "1h 30m",
    timeOfArrival: "22:00",
    status: "Accepted",
    priority: 2
  },
  {
    id: "103",
    transportName: "Mercedes Sprinter B09",
    driverName: "Henry Driver",
    placeOfDeparture: "Warsaw Relay Point",
    timeToDeparture: "3h 00m",
    timeOfArrival: "04:30",
    status: "Pending",
    priority: 3
  },
  {
    id: "104",
    transportName: "Renault Kangoo R2",
    driverName: "Karen Driver",
    placeOfDeparture: "Odesa Port Warehouse",
    timeToDeparture: "0h 0m",
    timeOfArrival: "12:00",
    status: "Delivered",
    priority: 4
  },
  {
    id: "105",
    transportName: "DAF Truck Heavy 4",
    driverName: "Noah Driver",
    placeOfDeparture: "Dnipro Logistics Center",
    timeToDeparture: "0h 0m",
    timeOfArrival: "08:15",
    status: "Canceled",
    priority: 5
  }
];
