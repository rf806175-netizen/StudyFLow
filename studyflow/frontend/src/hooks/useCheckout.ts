import { useMutation, useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../api/client";

export function useCheckout() {
  const { data: prices } = useQuery({
    queryKey: ["payments", "prices"],
    queryFn: paymentsApi.getPrices,
    staleTime: 1000 * 60 * 10,
  });

  const checkoutMutation = useMutation({
    mutationFn: (priceId: string) => paymentsApi.createCheckout(priceId),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (err: any) => { alert("Erro ao iniciar pagamento: " + (err?.message || "Tente novamente")); },
  });

  function checkoutMonthly() {
    if (prices?.monthly?.priceId) {
      checkoutMutation.mutate(prices.monthly.priceId);
    }
  }

  function checkoutYearly() {
    if (prices?.yearly?.priceId) {
      checkoutMutation.mutate(prices.yearly.priceId);
    }
  }

  return {
    prices,
    isPending: checkoutMutation.isPending,
    checkoutMonthly,
    checkoutYearly,
  };
}
