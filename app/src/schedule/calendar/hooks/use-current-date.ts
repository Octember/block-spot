import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {format, isValid, parseISO, startOfToday} from 'date-fns';


export function useCurrentDate() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());

  useEffect(() => {
    const urlSelectedDate = parseISO(searchParams.get('selected_date') ?? '')

    if (urlSelectedDate && !isValid(urlSelectedDate)) {
      setSearchParams((prev) => {
        prev.delete('selected_date')
        return prev
      })
    } else if (urlSelectedDate && isValid(urlSelectedDate)) {
      setSelectedDate(urlSelectedDate)
    }
  }, [])


  return {
    selectedDate, setSelectedDate: (date: Date) => {
      setSearchParams((prev) => {
        prev.set('selected_date', format(date, 'yyyy-MM-dd'))
        return prev
      })
      setSelectedDate(date);
    }
  };
}
