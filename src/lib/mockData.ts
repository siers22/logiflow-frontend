export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'delivered' | 'cancelled';
export type DriverStatus = 'available' | 'busy' | 'offline';

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  pickupAddress: string;
  deliveryAddress: string;
  cargoType: string;
  weight: number;
  distance: number;
  price: number;
  status: OrderStatus;
  driverId?: string;
  driverName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  status: DriverStatus;
  rating: number;
  completedOrders: number;
  currentLocation?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    clientId: '1',
    clientName: 'Иван Петров',
    pickupAddress: 'Москва, ул. Ленинская, 15',
    deliveryAddress: 'Санкт-Петербург, пр. Невский, 28',
    cargoType: 'Электроника',
    weight: 150,
    distance: 700,
    price: 25000,
    status: 'in_progress',
    driverId: '3',
    driverName: 'Сергей Водитель',
    createdAt: '2025-11-05T10:00:00',
    updatedAt: '2025-11-06T14:30:00',
  },
  {
    id: 'ORD-002',
    clientId: '1',
    clientName: 'Иван Петров',
    pickupAddress: 'Москва, ул. Тверская, 5',
    deliveryAddress: 'Казань, ул. Баумана, 12',
    cargoType: 'Мебель',
    weight: 300,
    distance: 800,
    price: 35000,
    status: 'delivered',
    driverId: '3',
    driverName: 'Сергей Водитель',
    createdAt: '2025-11-01T09:00:00',
    updatedAt: '2025-11-03T18:00:00',
  },
  {
    id: 'ORD-003',
    clientId: '6',
    clientName: 'ООО "Торговый дом"',
    pickupAddress: 'Нижний Новгород, ул. Покровская, 3',
    deliveryAddress: 'Екатеринбург, ул. Вайнера, 9',
    cargoType: 'Продукты питания',
    weight: 500,
    distance: 1200,
    price: 45000,
    status: 'pending',
    createdAt: '2025-11-07T11:00:00',
    updatedAt: '2025-11-07T11:00:00',
  },
  {
    id: 'ORD-004',
    clientId: '7',
    clientName: 'ИП Сидоров',
    pickupAddress: 'Ростов-на-Дону, пр. Буденновский, 45',
    deliveryAddress: 'Краснодар, ул. Красная, 76',
    cargoType: 'Стройматериалы',
    weight: 800,
    distance: 300,
    price: 28000,
    status: 'assigned',
    driverId: '8',
    driverName: 'Дмитрий Иванов',
    createdAt: '2025-11-06T15:00:00',
    updatedAt: '2025-11-07T09:00:00',
  },
  {
    id: 'ORD-005',
    clientId: '9',
    clientName: 'ООО "Электроснаб"',
    pickupAddress: 'Самара, ул. Московское шоссе, 18',
    deliveryAddress: 'Уфа, ул. Ленина, 25',
    cargoType: 'Оборудование',
    weight: 1200,
    distance: 450,
    price: 52000,
    status: 'in_progress',
    driverId: '10',
    driverName: 'Александр Петров',
    createdAt: '2025-11-05T08:00:00',
    updatedAt: '2025-11-06T16:00:00',
  },
];

export const mockDrivers: Driver[] = [
  {
    id: '3',
    name: 'Сергей Водитель',
    phone: '+7 (999) 123-45-67',
    vehicleType: 'Газель',
    vehicleNumber: 'А123БВ777',
    status: 'busy',
    rating: 4.8,
    completedOrders: 156,
    currentLocation: 'Тверь',
  },
  {
    id: '8',
    name: 'Дмитрий Иванов',
    phone: '+7 (999) 234-56-78',
    vehicleType: 'КАМАЗ',
    vehicleNumber: 'В456ГД777',
    status: 'available',
    rating: 4.9,
    completedOrders: 203,
    currentLocation: 'Ростов-на-Дону',
  },
  {
    id: '10',
    name: 'Александр Петров',
    phone: '+7 (999) 345-67-89',
    vehicleType: 'Фура',
    vehicleNumber: 'С789ЕЖ777',
    status: 'busy',
    rating: 4.7,
    completedOrders: 178,
    currentLocation: 'Казань',
  },
  {
    id: '11',
    name: 'Николай Сидоров',
    phone: '+7 (999) 456-78-90',
    vehicleType: 'Газель',
    vehicleNumber: 'Д012ЗИ777',
    status: 'available',
    rating: 4.6,
    completedOrders: 142,
    currentLocation: 'Москва',
  },
  {
    id: '12',
    name: 'Михаил Кузнецов',
    phone: '+7 (999) 567-89-01',
    vehicleType: 'МАН',
    vehicleNumber: 'Е345КЛ777',
    status: 'available',
    rating: 4.9,
    completedOrders: 189,
    currentLocation: 'Санкт-Петербург',
  },
  {
    id: '13',
    name: 'Владимир Морозов',
    phone: '+7 (999) 678-90-12',
    vehicleType: 'КАМАЗ',
    vehicleNumber: 'Ж678МН777',
    status: 'offline',
    rating: 4.5,
    completedOrders: 134,
    currentLocation: 'Нижний Новгород',
  },
];

export const mockMessages: Message[] = [
  {
    id: 'MSG-001',
    senderId: '2',
    senderName: 'Анна Смирнова',
    receiverId: '3',
    text: 'Сергей, как продвигается доставка ORD-001?',
    timestamp: '2025-11-07T10:15:00',
    read: true,
  },
  {
    id: 'MSG-002',
    senderId: '3',
    senderName: 'Сергей Водитель',
    receiverId: '2',
    text: 'Уже в Твери, прибуду в СПб примерно через 4 часа',
    timestamp: '2025-11-07T10:20:00',
    read: true,
  },
  {
    id: 'MSG-003',
    senderId: '2',
    senderName: 'Анна Смирнова',
    receiverId: '3',
    text: 'Отлично, держите связь',
    timestamp: '2025-11-07T10:22:00',
    read: false,
  },
];
