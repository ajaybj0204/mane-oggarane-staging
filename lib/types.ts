export type Category='veg'|'nonveg'|'combos'|'cafe';
export type Dish={id:string;name:string;description?:string|null;price:number;category:Category;image?:string|null;active:boolean;veg:boolean;featured?:boolean;stock_qty?:number|null;updated_at?:string};
export type CartLine={id:string;quantity:number};
export type Order={id:string;tracking_token?:string;status:string;payment_status:string;fulfillment_type:string;subtotal_paise:number;discount_paise:number;delivery_paise:number;total_paise:number;created_at:string;customer_name:string;customer_email:string;customer_phone:string;address?:Record<string,string>|null;items?:OrderItem[];razorpay_order_id?:string;customer_id?:string|null;coupon_code?:string|null};
export type OrderItem={product_id:string;name:string;quantity:number;unit_price_paise:number;line_total_paise:number};
export const categoryNames:Record<Category,string>={veg:'Vegetarian',nonveg:'Non-Veg',combos:'Family Combos',cafe:'Café & Chaats'};
export const rupees=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export const money=(p:number)=>rupees(p/100);
