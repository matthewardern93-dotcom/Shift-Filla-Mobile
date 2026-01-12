import { parse } from 'date-fns';

export const combineDateAndTime = (date: Date, timeString: string): Date => {
  const time = parse(timeString, 'HH:mm', new Date());
  const newDate = new Date(date);
  newDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return newDate;
};