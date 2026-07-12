export type PlanId = "relax" | "balance" | "active";
export type DayKey = "day1" | "day2" | "day3";
export type ActivityCategory = "관광지" | "식당" | "숙소" | "이동";

export type TripPreferences = {
  destination: string;
  startDate: string;
  endDate: string;
  companion: "혼자" | "연인" | "친구" | "가족";
  interests: string[];
  budgetPerPerson: string;
  pace: "여유롭게" | "적당히" | "알차게";
};

export type Activity = {
  id?: string;
  time: string;
  type: ActivityCategory;
  title: string;
  description: string;
  meta: string;
  cost: string;
  marker: { x: string; y: string };
  placeName?: string;
  placeId?: string;
  address?: string;
  roadAddress?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  category?: string;
  phone?: string;
  placeUrl?: string;
};

export type TripDay = {
  id?: DayKey;
  label: string;
  area: string;
  summary: string;
  route: string;
  items: Activity[];
};

export type TripPlan = {
  id: PlanId;
  title: string;
  subtitle: string;
  destination: string;
  dateRange: string;
  budget: string;
  movement: string;
  hotel: string;
  tags: string[];
  days: Record<DayKey, TripDay>;
};

export type PlanSummary = Omit<TripPlan, "days"> & {
  highlights: string[];
};

export type GeneratePlansResponse = {
  preferences: TripPreferences;
  plans: PlanSummary[];
  generatedAt: string;
};

export type GenerateItineraryRequest = {
  preferences: TripPreferences;
  plan: PlanSummary;
};

export type GenerateItineraryResponse = {
  plan: TripPlan;
  generatedAt: string;
};

export type ItineraryChange = {
  dayId: DayKey;
  summary: string;
  before: string[];
  after: string[];
};

export type ModifyItineraryRequest = {
  planId: PlanId;
  message: string;
  currentItinerary: TripDay[];
};

export type ModifyItineraryResponse = {
  plan: TripPlan;
  changes: ItineraryChange[];
  message: string;
  modifiedAt: string;
};
