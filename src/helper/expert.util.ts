import { eq } from "drizzle-orm";
import { db } from "../db";
import { appointments, experts } from "../db/schema";

export const getAvailableSlots = async (expertId: any, date: Date) => {
  const expert = await db
    .select()
    .from(experts)
    .where(eq(experts.id, expertId));


  const day: number = new Date(date).getDay();

  const availables = expert[0].availability?.find((item) => item.day === day);
  const available_slots = availables?.slots;

  if (available_slots) {
    const appointmentsOnDay = await db
      .select()
      .from(appointments)
      .where(eq(appointments.expertId, expertId));

    const slots = available_slots.filter(
      (slot) =>
        !appointmentsOnDay.some(
          (appointment) => appointment.startTime === slot?.split("-")[0]
        )
    );

    return Promise.resolve(slots);
  }
  return null;
};

export const getSlotAvailability = async ( 
  expertId: any,
  date: Date,
  startTime: string,
  endTime: string
) => { 
  const availability: any = await getAvailableSlots(expertId, date); 
  const slots = availability?.find((slot: { split: (arg0: string) => [any, any]; }) => {
    const [start, end] = slot.split("-");
    return start.trim() === startTime.trim() && end.trim() === endTime.trim();
  });
  
  if (slots) {
    return true;
  } else {
    return false;
  }
};
