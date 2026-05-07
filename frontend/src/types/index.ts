export enum PlanStatus {
  PLANNING = "PLANNING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ItemType {
  ATTRACTION = "ATTRACTION",
  RESTAURANT = "RESTAURANT",
  HOTEL = "HOTEL",
  TRANSPORTATION = "TRANSPORTATION",
}

export enum ExpenseCategory {
  TRANSPORTATION = "TRANSPORTATION",
  ACCOMMODATION = "ACCOMMODATION",
  DINING = "DINING",
  TICKETS = "TICKETS",
  SHOPPING = "SHOPPING",
  OTHER = "OTHER",
}

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatistics {
  citiesCount: number;
  citiesVisited: string[];
  totalDays: number;
  totalSpent: number;
  completedPlansCount: number;
}

export interface ItineraryItem {
  id: number;
  itineraryId: number;
  name: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  estimatedCost?: number;
  notes?: string;
  type: ItemType;
  icon?: string;
  sortOrder: number;
}

export interface Itinerary {
  id: number;
  planId: number;
  dayNumber: number;
  date: string;
  items: ItineraryItem[];
}

export interface Expense {
  id: number;
  planId: number;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  byCategory: Record<string, number>;
  count: number;
}

export interface PackingItem {
  id: number;
  packingListId: number;
  name: string;
  quantity: number;
  isPacked: boolean;
}

export interface PackingList {
  id: number;
  planId: number;
  items: PackingItem[];
}

export interface Plan {
  id: number;
  title: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  budget: number;
  coverImage?: string;
  status: PlanStatus;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  user?: { id: number; name: string; avatar?: string };
  itineraries?: Itinerary[];
  expenses?: Expense[];
  packingList?: PackingList;
  _count?: { favorites: number };
}

export interface PopularDestination {
  city: string;
  planCount: number;
}

export interface CityDistribution {
  city: string;
  count: number;
}

export interface MonthlyFrequency {
  month: string;
  count: number;
}

export interface ExpenseCategoryStat {
  category: string;
  amount: number;
}

export interface BudgetVsActual {
  title: string;
  budget: number;
  actual: number;
  difference: number;
}

export interface CreatePlanDto {
  title: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  budget: number;
  coverImage?: string;
  status?: PlanStatus;
  isPublic?: boolean;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

export interface CreateItineraryItemDto {
  name: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  estimatedCost?: number;
  notes?: string;
  type: ItemType;
  icon?: string;
}

export interface CreateExpenseDto {
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
}

export interface CreatePackingItemDto {
  name: string;
  quantity?: number;
  isPacked?: boolean;
}
