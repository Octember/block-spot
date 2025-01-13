import { createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { parseISO, isValid, startOfToday, format } from "date-fns";

const DateContext = createContext<{
  selectedDate: Date,
  setSelectedDate: (date: Date) => void
}
>({ selectedDate: startOfToday(), setSelectedDate: () => { } });

function getDateOrDefault(date: string | null) {
  if (!date) {
    return startOfToday();
  }

  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    return startOfToday();
  }

  return parsedDate;
}

const DateProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentDate = getDateOrDefault(searchParams.get('selected_date'))

  return <DateContext.Provider value={{
    selectedDate: currentDate, setSelectedDate: (date: Date) => {
      setSearchParams((prev) => {
        prev.set('selected_date', format(date, 'yyyy-MM-dd'))
        return prev
      })
    }
  }}>{children}</DateContext.Provider>
}

export function useSelectedDate() {
  return useContext(DateContext);
}

export default DateProvider;
