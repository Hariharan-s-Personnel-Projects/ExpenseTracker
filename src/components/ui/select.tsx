"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  className?: string;
}

function Select({
  value,
  options,
  onChange,
  placeholder,
  id,
  className,
}: SelectProps) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        id={id}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none flex items-center justify-between gap-2 cursor-pointer focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">
          {value || (placeholder ?? "Select...")}
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          className="isolate z-50 outline-none"
          side="bottom"
          sideOffset={4}
          align="start"
        >
          <MenuPrimitive.Popup className="z-50 max-h-60 w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95">
            {options.map((opt) => (
              <MenuPrimitive.Item
                key={opt}
                className="group/select-item relative flex cursor-default items-center gap-2 rounded-md px-1.5 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                onClick={() => onChange(opt)}
              >
                <CheckIcon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    value === opt ? "opacity-100" : "opacity-0",
                  )}
                />
                {opt}
              </MenuPrimitive.Item>
            ))}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

export { Select };
