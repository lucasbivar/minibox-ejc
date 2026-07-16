import { OrderStatus, PaymentCondition, PaymentMethod } from "./enums";

export interface TeamDto {
  id: string;
  name: string;
  createdAt: string;
}

export interface ParticipantDto {
  id: string;
  name: string;
  phone: string | null;
  teamId: string;
  teamName: string;
  photoUrl: string | null;
  createdAt: string;
}

export type StockSeverity = "critical" | "warning" | "ok";

export interface MenuItemDto {
  id: string;
  number: number;
  description: string;
  price: number;
  stock: number;
  warningThreshold: number;
  criticalThreshold: number;
  severity: StockSeverity;
  available: boolean;
  createdAt: string;
}

export type StockAlertItemDto = MenuItemDto;

export interface StockAlertsResponse {
  items: StockAlertItemDto[];
  criticalCount: number;
  warningCount: number;
}

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderInput {
  participantId: string;
  condition: PaymentCondition;
  paymentMethod?: PaymentMethod | null;
  items: OrderItemInput[];
}

export interface OrderItemDto {
  id: string;
  menuItemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  dateTime: string;
}

export interface OrderDto {
  id: string;
  orderNumber: number;
  participantId: string;
  participantName: string;
  participantPhone: string | null;
  teamId: string;
  teamName: string;
  dateTime: string;
  condition: PaymentCondition;
  paymentMethod: PaymentMethod | null;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItemDto[];
}

export interface SettlementDto {
  id: string;
  participantId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  dateTime: string;
}

export interface CreateSettlementInput {
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface ParticipantFileDto {
  participant: ParticipantDto;
  totalConsumed: number;
  totalPaid: number;
  outstandingBalance: number;
  orders: OrderDto[];
  settlements: SettlementDto[];
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUserDto;
}

export interface DashboardSummaryDto {
  totalCollected: number;
  totalOutstanding: number;
  averageTicket: number;
  totalOrders: number;
}

export interface RankingEntryDto {
  participantId: string;
  participantName: string;
  teamName: string;
  value: number;
}

export interface DebtorDto {
  participantId: string;
  participantName: string;
  teamId: string;
  teamName: string;
  phone: string | null;
  outstandingBalance: number;
}

export type DebtorSortBy = "name" | "team" | "value";
export type SortDirection = "asc" | "desc";

export interface ListDebtorsQuery {
  teamId?: string;
  search?: string;
  sortBy?: DebtorSortBy;
  sortDir?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface BestSellingItemDto {
  menuItemId: string;
  description: string;
  quantitySold: number;
  revenue: number;
}

export interface TeamConsumptionDto {
  teamId: string;
  teamName: string;
  totalConsumed: number;
  totalOutstanding: number;
}

export interface PaymentMethodDistributionDto {
  method: PaymentMethod;
  totalAmount: number;
  count: number;
}

export type DayPeriod = "MANHA" | "TARDE" | "NOITE";

export interface SalesByHourEntryDto {
  day: string;
  period: DayPeriod;
  hour: number;
  totalAmount: number;
  orderCount: number;
}

export interface DashboardInsightsDto {
  topConsumers: RankingEntryDto[];
  bestSellingItemsByQuantity: BestSellingItemDto[];
  bestSellingItemsByRevenue: BestSellingItemDto[];
  championItem: BestSellingItemDto | null;
  teamConsumption: TeamConsumptionDto[];
  topConsumingTeams: TeamConsumptionDto[];
  leastConsumingTeams: TeamConsumptionDto[];
  paymentMethodDistribution: PaymentMethodDistributionDto[];
  salesByPeriod: SalesByHourEntryDto[];
  creditToPaidConversionRate: number;
  zeroedDebtors: RankingEntryDto[];
  topSettlers: RankingEntryDto[];
}

export interface ApiErrorResponse {
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListOrdersQuery {
  page?: number;
  pageSize?: number;
  teamId?: string;
  participantId?: string;
  search?: string;
  condition?: PaymentCondition;
  status?: OrderStatus;
}

export interface ListParticipantsQuery {
  page?: number;
  pageSize?: number;
  teamId?: string;
  search?: string;
}
