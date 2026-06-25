// ─── Enums (matching Prisma) ─────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SHIPPER';
export type ShopStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BANNED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'COD' | 'VNPAY' | 'MOMO';
export type ShopOrderStatus = 'PENDING' | 'PREPARING' | 'READY_FOR_PICKUP' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  address_line: string;
  ward: string;
  district: string;
  city: string;
  is_default: boolean;
}

// ─── Shop ────────────────────────────────────────────────────────────────────

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  rating: number;
  status: ShopStatus;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  products?: Product[];
  _count?: { products: number };
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  parent?: Category;
  children?: Category[];
  _count?: { products: number };
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  shop_id: string;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  features?: string[];
  specifications?: ProductSpecification[];
  meta_title?: string | null;
  meta_description?: string | null;
  price: number;
  stock_quantity: number;
  sales_count: number;
  images: string[];
  created_at: string;
  updated_at: string;
  shop?: Shop;
  category?: Category;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

// ─── Home Content ────────────────────────────────────────────────────────────

export interface HomeBanner {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
  visual_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UpdateHomeBannerData = Partial<
  Pick<
    HomeBanner,
    | 'eyebrow'
    | 'title'
    | 'subtitle'
    | 'primary_label'
    | 'primary_href'
    | 'secondary_label'
    | 'secondary_href'
    | 'visual_label'
  >
>;

// ─── Order ───────────────────────────────────────────────────────────────────

export interface TrackingEvent {
  id: string;
  shop_order_id: string;
  shipper_id?: string;
  event_type: string;
  location?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  shop_order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product?: Product;
}

export interface ShopOrder {
  id: string;
  parent_order_id: string;
  shop_id: string;
  shipping_fee: number;
  status: ShopOrderStatus;
  created_at: string;
  updated_at: string;
  shop?: Shop;
  order_items?: OrderItem[];
  tracking_events?: TrackingEvent[];
}

export interface ParentOrder {
  id: string;
  user_id: string;
  total_payment: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  shop_orders?: ShopOrder[];
}

export interface CheckoutData {
  shipping_address: string;
  payment_method: PaymentMethod;
  coupon_code?: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface CartGroup {
  shop: Shop;
  items: CartItem[];
  subtotal?: number;
}

export interface Cart {
  groups: CartGroup[];
  total_items: number;
  total_amount: number;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ─── DTOs (for create/update requests) ───────────────────────────────────────

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CreateShopData {
  name: string;
  description?: string;
}

export interface CreateProductData {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  features?: string[];
  specifications?: ProductSpecification[];
  meta_title?: string;
  meta_description?: string;
  price: number;
  stock_quantity: number;
  images?: string[];
}

export interface UpdateProductData {
  category_id?: number;
  name?: string;
  slug?: string;
  description?: string;
  features?: string[];
  specifications?: ProductSpecification[];
  meta_title?: string;
  meta_description?: string;
  price?: number;
  stock_quantity?: number;
  images?: string[];
}

export interface ProductQuery {
  search?: string;
  category_id?: number;
  shop_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  parent_id?: number;
}
