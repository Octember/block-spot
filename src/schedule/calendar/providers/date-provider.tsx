import { format, isValid, parseISO } from "date-fns";
import { createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { getStartOfDay, localToUTC } from "../date-utils";

const DateContext = createContext<{
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}>({ selectedDate: getStartOfDay(new Date()), setSelectedDate: () => { } });

function getDateOrDefault(date: string | null) {
  if (!date) {
    return getStartOfDay(new Date());
  }

  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    return getStartOfDay(new Date());
  }

  return getStartOfDay(parsedDate);
}

const DateProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentDate = getDateOrDefault(searchParams.get("selected_date"));

  return (
    <DateContext.Provider
      value={{
        selectedDate: currentDate,
        setSelectedDate: (date: Date) => {
          const utcDate = localToUTC(date);
          setSearchParams((prev) => {
            prev.set("selected_date", format(utcDate, "yyyy-MM-dd"));
            return prev;
          });
        },
      }}
    >
      {children}
    </DateContext.Provider>
  );
};

export function useSelectedDate() {
  return useContext(DateContext);
}

export default DateProvider;
