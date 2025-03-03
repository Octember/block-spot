
export function timeToMinutes(time: Date) {
  return time.getHours() * 60 + time.getMinutes();
}

export function minutesToTime(date: Date, minutes: number) {
  const newDate = new Date(date);
  newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return newDate;
}