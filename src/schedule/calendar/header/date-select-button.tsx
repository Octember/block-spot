import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { formatInTimeZone } from "date-fns-tz";
import { FC, useState } from "react";
import { usePopper } from "react-popper";
import { useVenueContext } from "../providers/venue-provider";
import { CalendarSelectDate } from "./calendar-select-date";
import { LuCalendar } from "react-icons/lu";

export const DateSelectButton: FC = () => {
  const { selectedDate, setSelectedDate, venue } = useVenueContext();

  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  return (
    <Popover className="relative group">
      <PopoverButton
        ref={setReferenceElement}
        className="font-bold flex flex-row items-center gap-2"
        as="button"
      >
        {formatInTimeZone(selectedDate, venue.timeZoneId, "MMMM d, yyyy")}{" "}
        <ChevronDownIcon className="size-4" />
      </PopoverButton>

      <PopoverPanel
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
        className="bg-white z-999 rounded-md shadow-lg ring-1 ring-teal-800 ring-black/5 w-80 p-2"
      >
        <CalendarSelectDate
          selectedDate={selectedDate}
          onDateSelected={setSelectedDate}
        />
      </PopoverPanel>
    </Popover>
  );
};

export const DateSelectButtonMobile: FC = () => {
  const { selectedDate, setSelectedDate, venue } = useVenueContext();

  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  return (
    <Popover className="relative group">
      <PopoverButton
        ref={setReferenceElement}
        className="font-bold flex flex-row items-center gap-2 w-10 h-10 bg-teal-700/20 rounded-full justify-center"
        as="button"
      >
        <LuCalendar className="size-4" />
      </PopoverButton>

      <PopoverPanel
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
        className="bg-white z-999 rounded-md shadow-lg ring-1 ring-black/5 w-80 p-2"
      >
        <CalendarSelectDate
          selectedDate={selectedDate}
          onDateSelected={setSelectedDate}
        />
      </PopoverPanel>
    </Popover>
  );
};
