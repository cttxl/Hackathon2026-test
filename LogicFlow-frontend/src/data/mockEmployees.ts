export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Logist' | 'Driver' | 'Warehouse Operator';
}

export const initialEmployees: Employee[] = [
  { id: '1', fullName: 'Alice Admin', email: 'admin@test.com', phone: '555-0101', role: 'Admin' },
  { id: '2', fullName: 'Bob Logistics', email: 'logist@test.com', phone: '555-0102', role: 'Logist' },
  { id: '3', fullName: 'Charlie Driver', email: 'driver@test.com', phone: '555-0103', role: 'Driver' },
  { id: '4', fullName: 'Diana Warehouse', email: 'warehouse@test.com', phone: '555-0104', role: 'Warehouse Operator' },
  { id: '5', fullName: 'Eve Logist', email: 'eve@test.com', phone: '555-0105', role: 'Logist' },
  { id: '6', fullName: 'Frank Driver', email: 'frank@test.com', phone: '555-0106', role: 'Driver' },
  { id: '7', fullName: 'Grace Warehouse', email: 'grace@test.com', phone: '555-0107', role: 'Warehouse Operator' },
  { id: '8', fullName: 'Henry Driver', email: 'henry@test.com', phone: '555-0108', role: 'Driver' },
  { id: '9', fullName: 'Ivy Logist', email: 'ivy@test.com', phone: '555-0109', role: 'Logist' },
  { id: '10', fullName: 'Jack Warehouse', email: 'jack@test.com', phone: '555-0110', role: 'Warehouse Operator' },
  { id: '11', fullName: 'Karen Driver', email: 'karen@test.com', phone: '555-0111', role: 'Driver' },
  { id: '12', fullName: 'Liam Logist', email: 'liam@test.com', phone: '555-0112', role: 'Logist' },
  { id: '13', fullName: 'Mia Warehouse', email: 'mia@test.com', phone: '555-0113', role: 'Warehouse Operator' },
  { id: '14', fullName: 'Noah Driver', email: 'noah@test.com', phone: '555-0114', role: 'Driver' },
  { id: '15', fullName: 'Olivia Logist', email: 'olivia@test.com', phone: '555-0115', role: 'Logist' },
  { id: '16', fullName: 'Peter Warehouse', email: 'peter@test.com', phone: '555-0116', role: 'Warehouse Operator' },
];
