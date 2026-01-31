import api from "./api";

export interface CheckoutSessionResponse {
  url: string;
}

export async function createCheckoutSession(priceId: string) {
  const response = await api.post<CheckoutSessionResponse>("/payments/checkout", {
    priceId,
  });
  return response.data;
}
