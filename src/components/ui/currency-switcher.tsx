'use client';

import { useCurrencyStore } from "@/stores/currency.store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <div className="flex items-center gap-2">
      <DollarSign className="h-4 w-4 text-gray-500" />
      <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
        <SelectTrigger className="w-24 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AED">AED - Dirham</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}