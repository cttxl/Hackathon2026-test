import type {
  ApiLoginRequest,
  ApiLoginResponse,
  ApiEmployee,
  ApiCreateEmployeeRequest,
  ApiUpdateEmployeeRequest,
  ApiVehicle,
  ApiDeliveryPoint,
  DeliveryPointType,
  ApiProduct,
  ApiArrival,
  ApiCreateArrivalRequest,
  ApiUpdateArrivalRequest,
  ApiArrivalRequest,
  ApiSku,
  ApiRequest,
  RequestStatus,
  ApiListResponse,
  ApiCreateArrivalRequestEntry,
} from '../types/api';

// In production (Docker), VITE_API_BASE_URL is '' → relative URLs proxied by nginx.
// In local dev, set VITE_API_BASE_URL=http://localhost:8080 in public/.env
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('authToken');
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as unknown as T;

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return body as T;
}

export async function loginApi(email: string, password: string): Promise<ApiLoginResponse> {
  return apiFetch<ApiLoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password } satisfies ApiLoginRequest),
  });
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function createClient(data: { name: string, email: string, phone: string, password: string }): Promise<any> {
  return apiFetch<any>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Employees ───────────────────────────────────────────────────────────────

export async function getEmployees(page = 1, limit = 50): Promise<ApiListResponse<ApiEmployee>> {
  return apiFetch<ApiListResponse<ApiEmployee>>(`/employees?page=${page}&limit=${limit}`);
}

export async function createEmployee(data: ApiCreateEmployeeRequest): Promise<ApiEmployee> {
  return apiFetch<ApiEmployee>('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchEmployee(id: string, data: ApiUpdateEmployeeRequest): Promise<ApiEmployee> {
  return apiFetch<ApiEmployee>(`/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteEmployee(id: string): Promise<void> {
  return apiFetch<void>(`/employees/${id}`, { method: 'DELETE' });
}

export async function resetEmployeePassword(id: string): Promise<void> {
  // The API docs don't specify a dedicated reset-password endpoint for employees.
  // We send a PATCH with a placeholder — replace with actual endpoint when available.
  return apiFetch<void>(`/employees/${id}/reset-password`, { method: 'POST' });
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

export async function getVehicles(page = 1, limit = 100): Promise<ApiListResponse<ApiVehicle>> {
  return apiFetch<ApiListResponse<ApiVehicle>>(`/vehicles?page=${page}&limit=${limit}`);
}

// ─── Delivery Points ─────────────────────────────────────────────────────────

export async function getDeliveryPoints(type?: DeliveryPointType): Promise<ApiListResponse<ApiDeliveryPoint>> {
  const query = type ? `?type=${type}&limit=100` : '?limit=100';
  return apiFetch<ApiListResponse<ApiDeliveryPoint>>(`/delivery-points${query}`);
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<ApiListResponse<ApiProduct>> {
  return apiFetch<ApiListResponse<ApiProduct>>('/products?limit=200');
}

export async function getProductById(id: string): Promise<ApiProduct> {
  return apiFetch<ApiProduct>(`/products/${id}`);
}

// ─── Arrivals ────────────────────────────────────────────────────────────────

export async function getArrivals(): Promise<ApiListResponse<ApiArrival>> {
  return apiFetch<ApiListResponse<ApiArrival>>('/arrivals?limit=100');
}

export async function createArrival(data: ApiCreateArrivalRequest): Promise<ApiArrival> {
  return apiFetch<ApiArrival>('/arrivals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchArrival(id: string, data: ApiUpdateArrivalRequest): Promise<ApiArrival> {
  return apiFetch<ApiArrival>(`/arrivals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─── Arrival-Requests (Dispatch mappings) ────────────────────────────────────

export async function getArrivalRequests(arrivalId: string): Promise<ApiListResponse<ApiArrivalRequest>> {
  return apiFetch<ApiListResponse<ApiArrivalRequest>>(`/arrivals-requests?arrival_id=${arrivalId}&limit=100`);
}

export async function getAllArrivalRequests(page = 1, limit = 1000): Promise<ApiListResponse<ApiArrivalRequest>> {
  return apiFetch<ApiListResponse<ApiArrivalRequest>>(`/arrivals-requests?page=${page}&limit=${limit}`);
}

export async function createArrivalRequest(data: ApiCreateArrivalRequestEntry): Promise<ApiArrivalRequest> {
  return apiFetch<ApiArrivalRequest>('/arrivals-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteArrivalRequest(id: string): Promise<void> {
  return apiFetch<void>(`/arrivals-requests/${id}`, { method: 'DELETE' });
}

export async function getRecommendedArrivalRequests(): Promise<ApiListResponse<ApiArrivalRequest>> {
  return apiFetch<ApiListResponse<ApiArrivalRequest>>('/arrivals-requests/recommended');
}

// ─── SKU / Requests ──────────────────────────────────────────────────────────

export async function getSkus(pointId: string, page = 1, limit = 10): Promise<ApiListResponse<ApiSku>> {
  return apiFetch<ApiListResponse<ApiSku>>(`/sku?delivery_point_id=${pointId}&page=${page}&limit=${limit}`);
}

export async function getRequests(filters?: { delivery_point_id?: string; sku_id?: string; status?: RequestStatus }): Promise<ApiListResponse<ApiRequest>> {
  let query = '?limit=1000';
  if (filters?.delivery_point_id) query += `&delivery_point_id=${filters.delivery_point_id}`;
  if (filters?.sku_id) query += `&sku_id=${filters.sku_id}`;
  if (filters?.status) query += `&status=${filters.status}`;

  return apiFetch<ApiListResponse<ApiRequest>>(`/requests${query}`);
}

export async function getRequestById(id: string): Promise<ApiRequest> {
  return apiFetch<ApiRequest>(`/requests/${id}`);
}

export async function patchRequest(id: string, data: { status: RequestStatus }): Promise<ApiRequest> {
  return apiFetch<ApiRequest>(`/requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
