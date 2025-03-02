import { Button, Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { FC, useState } from 'react';
import { LuCalendar, LuMenu, LuUser2, LuUserCircle } from 'react-icons/lu';
import { usePopper } from 'react-popper';
import { routes, Link as WaspRouterLink } from 'wasp/client/router';

export const MobileMenu: FC = () => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  return (
    <Popover className="relative group h-full flex justify-center items-center">
      <PopoverButton
        ref={setReferenceElement}
        as="button"
      >
        <LuMenu className="size-5 text-white" />
      </PopoverButton>

      <PopoverPanel
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
        className="bg-white z-99999 rounded-md shadow-lg w-30 p-2"
      >
        <div className="flex flex-col gap-2">
          <WaspRouterLink to={routes.AccountRoute.to} className="w-full">
            <Button className="flex flex-row gap-2 items-center justify-between w-full">
              <LuUserCircle className="size-4" />
              Account
            </Button>
          </WaspRouterLink>
        </div>
      </PopoverPanel>
    </Popover>
  );
};



export const MobileHeader = () => {
  return (
    <p className="text-sm font-bold text-white text-nowrap flex flex-row items-center gap-1">
      Booking with
      <LuCalendar className="size-4" />
      BlockSpot
    </p>
  );
};
