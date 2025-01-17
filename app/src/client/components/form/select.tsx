"use client";

import { forwardRef, useEffect, useState } from "react";
import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { CheckIcon } from "@heroicons/react/20/solid";

interface SelectOption {
  label: string;
  value: string | number;
}

type Size = "sm" | "md";

const sizeClasses: Record<Size, string> = {
  sm: "min-w-20",
  md: "min-w-30",
}

export const Select = forwardRef<
  HTMLSelectElement,
  {
    options: SelectOption[];
    value: SelectOption;
    onChange: (value: SelectOption) => void;
    placeholder?: string;
    size?: Size;
  }
>(({ options, value, onChange, placeholder = "Select...", size = "md", ...props }, ref) => {
  const [selectedRef, setSelectedRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (selectedRef) {
      selectedRef.scrollIntoView({ block: "center" });
    }
  }, [selectedRef]);

  const sizeClass = sizeClasses[size];

  return (
    <Listbox value={value} onChange={onChange} ref={ref} {...props}>
      <div className={`relative ${sizeClass}`}>
        <ListboxButton className="grid w-full cursor-pointer grid-cols-1 rounded-md bg-white py-0.5 pl-3 pr-2 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
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
              ref={option.value === value.value ? setSelectedRef : null}
            />
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
});

export const MultiSelect = forwardRef<
  HTMLDivElement,
  {
    options: SelectOption[];
    value: SelectOption[];
    onChange: (value: SelectOption[]) => void;
    placeholder?: string;
    size?: Size;
  }
>(({ options, value, onChange, placeholder = "Select...", size = "md", ...props }, ref) => {

  const sizeClass = sizeClasses[size];

  return (
    <Listbox value={value} onChange={onChange} ref={ref} {...props} multiple>
      <div className={`relative ${sizeClass}`}>
        <ListboxButton className="grid w-full cursor-pointer grid-cols-1 rounded-md bg-white py-0.5 pl-3 pr-2 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
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
});

const SelectOption = forwardRef<HTMLDivElement, { option: SelectOption }>(
  ({ option }, ref) => {
    return (
      <ListboxOption
        key={option.value}
        value={option}
        ref={ref}
        className="group relative cursor-pointer select-none min-w-60 py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white data-[focus]:outline-none"
      >
        <span className="block truncate font-normal group-data-[selected]:font-semibold">
          {option.label}
        </span>

        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-[&:not([data-selected])]:hidden group-data-[focus]:text-white">
          <CheckIcon aria-hidden="true" className="size-5" />
        </span>
      </ListboxOption>
    );
  },
);
