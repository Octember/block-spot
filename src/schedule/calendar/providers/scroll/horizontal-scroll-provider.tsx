import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

interface HorizontalScrollContextType {
  scrolledPixels: number;
  setScrolledPixels: (pixels: number) => void;
}

const HorizontalScrollContext = createContext<
  HorizontalScrollContextType | undefined
>(undefined);

export const useHorizontalScroll = () => {
  const context = useContext(HorizontalScrollContext);
  if (!context) {
    throw new Error(
      "useHorizontalScroll must be used within a HorizontalScrollProvider",
    );
  }
  return context;
};

export const HorizontalScrollProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [scrolledPixels, setScrolledPixels] = useState(0);

  return (
    <HorizontalScrollContext.Provider
      value={{ scrolledPixels, setScrolledPixels }}
    >
      {children}
    </HorizontalScrollContext.Provider>
  );
};
