export type Role = 'ADMIN' | 'MANAGER' | 'FIELD_EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  profilePhoto?: string;
  employeeCode?: string;
  joiningDate?: string;
  createdAt: string;
  orgId?: string;
  departmentId?: string;
  department?: Department;
  managerId?: string;
  manager?: {
    id: string;
    name: string;
  };
  orgMembership?: {
    id: string;
    name: string;
  };
}

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  batteryLevel?: number;
  timestamp: string;
}

export interface LiveEmployee extends User {
  location: LocationData;
}

export interface Site {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  punchInTime: string;
  punchInLat: number;
  punchInLng: number;
  punchOutTime?: string;
  punchOutLat?: number;
  punchOutLng?: number;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE';
  totalHours?: number;
  selfieUrl?: string;
  user?: { name: string; employeeCode?: string };
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: { id: string, name: string };
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user?: { name: string, employeeCode?: string };
}

export interface Client {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  contactPerson?: string;
  phone?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId?: string;
  client?: Client;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  assignedToId: string;
  assignedById: string;
  clientId?: string;
  projectId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  geoRadius: number;
  client?: Client;
  project?: Project;
  assignedTo?: { id: string, name: string };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    organization?: {
      id: string;
      name: string;
    };
  };
}

export interface ExpenseClaim {
  id: string;
  userId: string;
  orgId: string;
  date: string;
  type: 'FUEL' | 'FOOD' | 'OTHER';
  amount: number;
  claimedDistance?: number | null;
  actualDistance?: number | null;
  billUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  managerNote?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; employeeCode: string | null };
}

export interface VehicleRate {
  id: string;
  orgId: string;
  vehicleType: string;
  perKmRate: number;
  createdAt: string;
  updatedAt: string;
}
