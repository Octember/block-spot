"use client";

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { CheckIcon } from "@heroicons/react/20/solid";
import { forwardRef, useEffect, useRef } from "react";
import { cn } from "../../cn";

interface SelectOption {
  label: string;
  value: string | number;
}

type Size = "sm" | "md";

const sizeClasses: Record<Size, string> = {
  sm: "min-w-15",
  md: "min-w-30",
};

export const Select = forwardRef<
  HTMLSelectElement,
  {
    disabled?: boolean;
    options: SelectOption[];
    value: SelectOption;
    onChange: (value: SelectOption) => void;
    placeholder?: string;
    size?: Size;
  }
>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select...",
      size = "md",
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const selectedRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (selectedRef.current) {
        selectedRef.current.scrollIntoView({ block: "center" });
      }
    }, [selectedRef]);

    const sizeClass = sizeClasses[size];
    const cursorClass = disabled ? "cursor-not-allowed" : "cursor-pointer";

    return (
      <Listbox
        value={value}
        onChange={onChange}
        ref={ref}
        {...props}
        disabled={disabled}
      >
        <div className={`relative ${sizeClass}`}>
          <ListboxButton
            className={`grid w-full ${cursorClass} grid-cols-1 rounded-md bg-white py-0.5 pl-3 pr-2
               text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 
               focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-md
               h-8 items-center
              `}
          >
            <span className="col-start-1 row-start-1 truncate pr-6">
              {value.label || placeholder}
            </span>
            <ChevronUpDownIcon
              aria-hidden="true"
              className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
            />
          </ListboxButton>

          <ListboxOptions
            transition
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
          >
            {options.map((option) => (
              <SelectOption
                key={option.value}
                option={option}
                ref={option.value === value.value ? selectedRef : null}
                selected={option.value === value.value}
              />
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    );
  },
);

export const MultiSelect = forwardRef<
  HTMLDivElement,
  {
    disabled?: boolean;
    options: SelectOption[];
    value: SelectOption[];
    onChange: (value: SelectOption[]) => void;
    placeholder?: string;
    size?: Size;
  }
>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select...",
      size = "md",
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const sizeClass = sizeClasses[size];
    const cursorClass = disabled ? "cursor-not-allowed" : "cursor-pointer";

    return (
      <Listbox
        defaultValue={value}
        onChange={onChange}
        ref={ref}
        {...props}
        multiple
        disabled={disabled}
      >
        <div className={`relative ${sizeClass}`}>
          <ListboxButton
            className={`grid w-full ${cursorClass} grid-cols-1 rounded-md bg-white py-0.5 pl-3 pr-2 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
          >
            <span className="col-start-1 row-start-1 truncate pr-6">
              {value.map((v) => v.label).join(", ") || placeholder}
            </span>
            <ChevronUpDownIcon
              aria-hidden="true"
              className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
            />
          </ListboxButton>

          <ListboxOptions
            transition
            className="absolute z-10 mt-1 max-h-60 min-w-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
          >
            {options.map((option) => (
              <SelectOption key={option.value} option={option} />
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    );
  },
);

const SelectOption = forwardRef<
  HTMLDivElement,
  { option: SelectOption; selected?: boolean }
>(({ option, selected }, ref) => {
  return (
    <ListboxOption
      key={option.value}
      value={option}
      ref={ref}
      className={cn(
        "group relative cursor-pointer select-none min-w-60 py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-teal-500 data-[focus]:text-white data-[focus]:outline-none",
        selected && "bg-teal-600 data-[focus]:bg-teal-600 text-white",
      )}
    >
      <span
        className={cn(
          "block truncate font-normal group-data-[selected]:font-semibold",
          selected && "text-white font-semibold",
        )}
      >
        {option.label}
      </span>

      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-teal-600 group-[&:not([data-selected])]:hidden group-data-[focus]:text-white">
        <CheckIcon aria-hidden="true" className="size-5" />
      </span>
    </ListboxOption>
  );
});

Select.displayName = "Select";
MultiSelect.displayName = "MultiSelect";
SelectOption.displayName = "SelectOption";
