import { FC, PropsWithChildren } from "react";
import { useHorizontalScroll } from "./horizontal-scroll-provider";

export const ScrollableContainer: FC<PropsWithChildren> = ({ children }) => {
  const { setScrolledPixels } = useHorizontalScroll();

  return (
    <div
      className={`relative overflow-x-auto snap-x flex-1`}
      onScroll={(e) => {
        setScrolledPixels(e.currentTarget.scrollLeft);
      }}
    >
      {children}
    </div>
  );
};
