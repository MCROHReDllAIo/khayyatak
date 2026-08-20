import { Suspense } from "react";
import CheckoutPage from "./CheckoutPage";

export default function CheckoutRoute() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
