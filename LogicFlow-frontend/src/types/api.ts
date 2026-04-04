// =====================================================
// API Type Definitions — matches the API documentation
// =====================================================

// --- Auth ---
export interface ApiLoginRequest {
  email: string;
  password: string;
}

export interface ApiLoginResponse {
  token: string;
  user: {
    id: string;
    type: 'employee' | 'client';
    role: ApiEmployeeRole | string;
  };
}

// --- Employees ---
export type ApiEmployeeRole = 'admin' | 'logistician' | 'driver' | 'warehouse_manager';

export interface ApiEmployee {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  role: ApiEmployeeRole;
}

export interface ApiCreateEmployeeRequest {
  fullname: string;
  email: string;
  password: string;
  phone: string;
  role: ApiEmployeeRole;
}

export interface ApiUpdateEmployeeRequest {
  fullname?: string;
  email?: string;
  phone?: string;
  role?: ApiEmployeeRole;
}

// --- Vehicles ---
export type FuelType = 'diesel' | 'gasoline' | 'electric';

export interface ApiVehicle {
  id: string;
  name: string;
  fuel_type: FuelType;
  fuel_consumption: number;
  max_weight: number;
  max_height: number;
  max_width: number;
  max_length: number;
  address: string;
}

// --- Delivery Points ---
export type DeliveryPointType = 'warehouse' | 'client_point' | 'provider';

export interface ApiDeliveryPoint {
  id: string;
  name: string;
  address: string;
  owner_id: string;
  type: DeliveryPointType;
  height: number;
  width: number;
  length: number;
}

// --- Products ---
export interface ApiProduct {
  id: string;
  name: string;
  weight: number;
  height: number;
  width: number;
  length: number;
}

// --- SKU (Stock Keeping Units) ---
export interface ApiSku {
  id: string;
  product_id: string;
  delivery_point_id: string;
}

// --- Requests (Orders) ---
export type RequestStatus = 'pending' | 'accepted' | 'shipped' | 'delivered' | 'cancelled';

export interface ApiRequest {
  id: string;
  product_id: string;
  quantity: number;
  delivery_point_id: string;
  sku_id: string;
  status: RequestStatus;
  emergency: boolean;
}

// --- Arrivals ---
export type ArrivalStatus = 'pending' | 'accepted' | 'shipped' | 'delivered' | 'cancelled';

export interface ApiArrival {
  id: string;
  transport_id: string;
  driver_id: string;
  time_to_arrival: string; // ISO datetime string
  status: ArrivalStatus;
}

export interface ApiCreateArrivalRequest {
  transport_id: string;
  driver_id: string;
  time_to_arrival: string;
}

export interface ApiUpdateArrivalRequest {
  transport_id?: string;
  driver_id?: string;
  time_to_arrival?: string;
  status?: ArrivalStatus;
}

// --- Arrival Requests (Dispatch mappings) ---
export interface ApiArrivalRequest {
  id: string;
  arrival_id: string;
  request_id: string;
  sku_id: string;
  priority: number;
}

// --- Paginated response wrapper ---
export interface ApiListResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  error: string;
}
