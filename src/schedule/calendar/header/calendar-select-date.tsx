import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { cn } from '../../../client/cn'
import { isSameDay, isToday } from 'date-fns'

interface CalendarSelectDateProps {
  selectedDate: Date;
  onDateSelected: (date: Date) => void
}

interface DayItem {
  dateTime: Date
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

export function CalendarSelectDate({
  selectedDate,
  onDateSelected,
}: CalendarSelectDateProps) {
  // Start at the first day of the current month
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Generate a 6-week grid for the current month (Monday-first)
  function generateDays(): DayItem[] {
    const days: DayItem[] = []
    // Adjust so that Monday is the first day of the week.
    const startDayIndex = (currentMonth.getDay() + 6) % 7
    const startDate = new Date(currentMonth)
    startDate.setDate(startDate.getDate() - startDayIndex)

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
      days.push({
        dateTime: day,
        date: day.toISOString().split('T')[0],
        dayNumber: day.getDate(),
        isCurrentMonth,
        isToday: isToday(day),
        isSelected: isSameDay(selectedDate, day),
      })
    }
    return days
  }

  const days = generateDays()

  function handlePrevMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  function handleNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          type="button"
          className="p-1.5 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Previous month</span>
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <h2 className="text-sm font-semibold text-gray-900">
          {currentMonth.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </h2>
        <button
          onClick={handleNextMonth}
          type="button"
          className="p-1.5 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Next month</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-6 grid grid-cols-7 text-xs text-gray-500 text-center">
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
        <div>S</div>
      </div>
      <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200">
        {days.map((day, dayIdx) => {
          return (
            <button
              key={day.date + dayIdx}
              type="button"
              onClick={() => onDateSelected(day.dateTime)}
              className={cn(
                day.isCurrentMonth
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-50 text-gray-400',
                dayIdx === 0 && 'rounded-tl-lg',
                dayIdx === 6 && 'rounded-tr-lg',
                dayIdx === days.length - 7 && 'rounded-bl-lg',
                dayIdx === days.length - 1 && 'rounded-br-lg',
                'relative py-1.5 hover:bg-gray-100 focus:z-10'
              )}
            >
              <time
                dateTime={day.date}
                className={cn(
                  day.isToday && 'bg-orange-100 font-semibold text-orange-600',
                  day.isSelected && 'bg-teal-600 font-semibold text-white',

                  'mx-auto flex h-7 w-7 items-center justify-center rounded-full'
                )}
              >
                {day.dayNumber}
              </time>
            </button>
          )
        })}
      </div>
    </div>
  )
}
