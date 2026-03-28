"use client";

import { useQuery } from "@tanstack/react-query";
import { getMoneyFlowSummary } from "@/actions/money-flow";

export function useMoneyFlowSummary(year?: number, month?: number) {
  return useQuery({
    queryKey: ["moneyFlow", year, month],
    queryFn: () => getMoneyFlowSummary(year, month),
  });
}
