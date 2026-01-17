export interface Store {
  id: string;
  name: string;
  distance: string;
  rating: number;
  image: string;
  tags: string[];
  price: number;
  location: string;
}

export interface Order {
  id: string;
  storeName: string;
  seatName: string;
  date: string;
  timeRange: string;
  price: number;
  status: 'active' | 'completed' | 'cancelled';
  image: string;
  remainingTime?: string;
  qrCode?: string;
}

export enum SeatStatus {
  Available = 'available',
  Selected = 'selected',
  Occupied = 'occupied',
}

export interface Seat {
  id: string;
  label: string;
  status: SeatStatus;
  type: 'standard' | 'window' | 'vip';
}
