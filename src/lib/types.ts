export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: UserRole;
  status: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  product_type_id: string | null;
  category_id: string | null;
  thumbnail: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  is_subscription: boolean;
  billing_interval: string | null;
  is_downloadable: boolean;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_types?: ProductType;
  categories?: Category;
  product_features?: ProductFeature[];
  product_images?: ProductImage[];
  product_faqs?: ProductFaq[];
}

export interface ProductFeature {
  id: string;
  product_id: string;
  feature: string;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
}

export interface ProductFaq {
  id: string;
  product_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface Addon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  billing_interval: string | null;
  icon: string | null;
  image: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CustomerProduct {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  status: string;
  plan: string | null;
  purchase_date: string;
  activation_date: string | null;
  expiration_date: string | null;
  subscription_id: string | null;
  products?: Product;
}

export interface CustomerAddon {
  id: string;
  user_id: string;
  addon_id: string;
  product_id: string | null;
  website_id: string | null;
  order_id: string | null;
  subscription_id: string | null;
  status: string;
  start_date: string;
  renewal_date: string | null;
  cancelled_date: string | null;
  addons?: Addon;
  products?: Product;
}

export interface Website {
  id: string;
  user_id: string;
  name: string;
  product_id: string | null;
  domain: string | null;
  deployment_url: string | null;
  custom_domain: string | null;
  status: string;
  plan: string | null;
  created_at: string;
  updated_at: string;
  products?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string | null;
  coupon_id: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  addon_id: string | null;
  product_name_snapshot: string;
  product_type_snapshot: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  product_id: string | null;
  order_id: string | null;
  plan: string | null;
  status: string;
  price: number;
  currency: string;
  billing_interval: string | null;
  start_date: string;
  next_billing_date: string | null;
  cancelled_date: string | null;
  expiration_date: string | null;
  products?: Product;
}

export interface Payment {
  id: string;
  order_id: string | null;
  subscription_id: string | null;
  user_id: string;
  provider: string | null;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export interface Download {
  id: string;
  user_id: string;
  product_id: string | null;
  product_file_id: string | null;
  file_name: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string | null;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  resource: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Settings {
  id: string;
  brand_name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  currency: string;
  contact_email: string;
  support_email: string;
  social_links: Record<string, string> | null;
  maintenance_mode: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minimum_order: number;
  maximum_discount: number | null;
  start_date: string;
  expiration_date: string | null;
  usage_limit: number | null;
  per_customer_limit: number;
  times_used: number;
  is_active: boolean;
}
