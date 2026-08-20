import type { ProductSearchIntent } from "@/lib/ai/product-intent";
import type { MatchedProduct } from "@/lib/db/products";

export interface ConciergeShoppingContext {
  lastIntent?: ProductSearchIntent | null;
  selectedProductId?: string | null;
  lastProducts?: MatchedProduct[];
  selectedSize?: string | null;
}
