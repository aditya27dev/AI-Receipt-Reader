"use client";

import { useCurrency, CURRENCIES } from "@/lib/currency-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySelector() {
  const { currency, setCurrencyCode } = useCurrency();

  return (
    <Select
      value={currency.code}
      onValueChange={(v) => v && setCurrencyCode(v)}
    >
      <SelectTrigger className="h-8 w-[90px] glass border-white/20 text-zinc-300 text-xs focus:ring-0 focus:ring-offset-0">
        <SelectValue>
          <span className="font-mono">{currency.symbol}</span>
          <span className="ml-1 text-zinc-400">{currency.code}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="glass border-white/10 bg-zinc-900/90 backdrop-blur-xl">
        {CURRENCIES.map((c) => (
          <SelectItem
            key={c.code}
            value={c.code}
            className="text-zinc-300 focus:bg-white/10 focus:text-white cursor-pointer"
          >
            <span className="font-mono w-6 inline-block">{c.symbol}</span>
            <span className="ml-2 text-zinc-400 text-xs">{c.code}</span>
            <span className="ml-2 text-zinc-500 text-xs">{c.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
