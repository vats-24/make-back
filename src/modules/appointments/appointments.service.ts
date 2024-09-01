import {
  eq,
  type InferInsertModel,
  gte,
  lte,
  ConsoleLogWriter,
  and,
  count,
  sql,
} from "drizzle-orm";
import { appointments, experts, services, users } from "../../db/schema";
import { db } from "../../db";
import dayjs from "dayjs";
import { google } from "googleapis";
import { calendar } from "../../config/google";
import { oauth2Client } from "../../config/google";
import { v4 as uuid } from "uuid";
import { stat } from "fs";

export async function createAppointment(
  data: any
) {
  const result = await db.insert(appointments).values(data).returning({
    id: appointments.id,
    userId: appointments.userId,
    expertId: appointments.expertId,
    date: appointments.date,
    startTime: appointments.startTime,
    endTime: appointments.endTime,
    amount: appointments.amount,
    paymentStatus: appointments.paymentStatus,
  });

  /*
	const { expertId } = data;

	const expert = await db
		.select({
			expertEmail: users.email,
		})
		.from(experts)
		.innerJoin(users, eq(experts.userId, users.id))
		.where(eq(experts.id, expertId));

	 after Oauth
	calendar.events.insert({
		calendarId: "primary",
		auth: oauth2Client,
		conferenceDataVersion: 1,
		requestBody: {
			summary: "This is 1:1 booking with Delta Factor",
			description: "Science&Technology",
			start: {
				dateTime: `${data.date}T${data.startTime}`,
				timeZone: "Asia/Kolkata",
			},
			end: {
				dateTime: `${data.date}T${data.endTime}`,
				timeZone: "Asia/Kolkata",
			},
			conferenceData: {
				createRequest: { requestId: uuid() },
			},
			attendees: [{ email: expert[0].expertEmail }],
		},
	});
	*/

  return result;
}

export async function getExpertAvailability(expertId: any, date: Date) {
  const expert = await db
    .select()
    .from(experts)
    .where(eq(experts.id, expertId));

  const day: number = new Date(date).getDay();
  const availables = expert[0].availability?.find((item) => item.day === day);
  const available_slots = availables?.slots;

  /*
	const startOfDay = new Date(date).setHours(0, 0, 0);
	const endOfDay = new Date(date).setHours(23, 59, 59, 999);
	*/

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

    return Promise.resolve(expert[0].availability);
  }
  return;
}

export async function createSchedule(
  data: Array<{
    day: number;
    slots: string[];
  }>,
  expertId: string
) {
  const result = await db
    .update(experts)
    .set({
      availability: data,
    })
    .where(eq(experts.id, expertId));

  return result;
}

export async function updateExpertSchedule() {}

//admin
export async function getAppointments(status: any) {
  if (!status) {
    const result = await db.select().from(appointments);
    return result;
  } else {
    const result = await db
      .select()
      .from(appointments)
      .where(eq(appointments.status, status));
    return result;
  }
}

//expert
export async function getExpertAppointments(expertId: string) {
  const result = await db
    .select()
    .from(appointments)
    .where(eq(appointments.expertId, expertId));

  return result;
}

export async function getAppointment(id: string) {
  const result = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id));

  return result;
}

export async function rescheduleAppointments(
  id: string,
  newStartTime: string,
  newEndTime: string
) {
  const result = await db
    .update(appointments)
    .set({ startTime: newStartTime, endTime: newEndTime })
    .where(eq(appointments.id, id));

  return result;
}

export async function getStatistics({ startDate, endDate, expertId } : {startDate: any, endDate:any, expertId :string}) {
  const sessionsCompleted = await db
    .select({
      count: sql<number>`count(${appointments.id})`,
    })
    .from(appointments)
    .where(
      and(
        sql`(${appointments.date} >= ${startDate} AND ${appointments.date} <= ${endDate})`,
        eq(appointments.expertId, expertId),
        eq(appointments.status, "completed")
      )
    );
  const totalBookings = await db
    .select({
      count: sql<number>`count(${appointments.id})`,
    })
    .from(appointments)
    .where(
      and(
        sql`(${appointments.date} >= ${startDate} AND ${appointments.date} <= ${endDate})`,
        eq(appointments.expertId, expertId)
      )
    );

  const mentoringTime = await db
    .select({
      totalDuration: sql<number>`SUM(${services.duration})`,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        sql`(${appointments.date} >= ${startDate} AND ${appointments.date} <= ${endDate})`,
        eq(appointments.expertId, expertId)
      )
    )
    .then((result) => result[0]?.totalDuration || 0);

  return {
    sessionsCompleted: sessionsCompleted[0].count,
    totalBookings: totalBookings[0].count,
    mentoringTime,
  };
}

export async function getMonthlyEarnings({ expertId }: {expertId: string}) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const year = startOfMonth.getFullYear();
  const month = String(startOfMonth.getMonth() + 1).padStart(2, "0");
  const day = String(startOfMonth.getDate()).padStart(2, "0");

  const startMonth = `${year}-${month}-${day}`;

  const earnings = await db
    .select({
      name: sql<string>`to_char(${appointments.date}, 'Mon')`,
      value: sql<number>`SUM(${appointments.amount})`,
    })
    .from(appointments)
    .where(
      and(sql`${appointments.date}::date >= ${startMonth}::date`, eq(appointments.expertId, expertId))
    )
    .groupBy(sql`to_char(${appointments.date}, 'Mon')`)
    .orderBy(sql`to_char(${appointments.date}, 'Mon')`);

  return earnings;
}

export async function getMonthlyServiceBookings({ expertId }: {expertId: string}) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const year = startOfMonth.getFullYear();
  const month = String(startOfMonth.getMonth() + 1).padStart(2, "0");
  const day = String(startOfMonth.getDate()).padStart(2, "0");

  const startMonth = `${year}-${month}-${day}`;

  const bookings = await db
    .select({
      month: sql<string>`to_char(${appointments.date}::date, 'Mon')`,
      serviceName: services.shortDescription, // Use column name directly
      totalBookings: sql<number>`COUNT(${appointments.id})`,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(sql`${appointments.date}::date >= ${startMonth}::date`, eq(appointments.expertId, expertId))
    )
    .groupBy(
      sql`to_char(${appointments.date}, 'Mon'), ${services.shortDescription}`
    )
    .orderBy(sql`to_char(${appointments.date}, 'Mon')`);

  return bookings;
}

export async function getSessionsBookings({ expertId }: {expertId: string}) {
  const bookings = await db
    .select({
      serviceTitle: services.shortDescription,
      totalBookings: sql<number>`COUNT(${appointments.id})`,
    })
    .from(services)
    .leftJoin(appointments, eq(appointments.serviceId, services.id))
    .where(eq(appointments.expertId, expertId))
    .groupBy(services.shortDescription)
    .orderBy(services.shortDescription);

  return bookings;
}

export async function getAverageEarnings({
  startDate,
  endDate,
  expertId,
}: {
  startDate: Date;
  endDate: Date;
  expertId: string;
}) {
  
  const start = new Date(startDate).toISOString().split("T")[0];
  const end = new Date(endDate).toISOString().split("T")[0];
  const totalEarningsResult = await db
    .select({
      total_earnings: sql`SUM(${appointments.amount})`,
      count: sql`COUNT(*)`,
    })
    .from(appointments)
    .where(
      and(
        sql`(${appointments.date} >= ${start} AND ${appointments.date} <= ${end})`,
        eq(appointments.expertId, expertId)
      )
    );

  const serviceEarningsResult = await db
    .select({
      service: services.shortDescription,
      earnings: sql`SUM(${appointments.amount})`,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        sql`(${appointments.date} >= ${startDate} AND ${appointments.date} <= ${endDate})`,
        eq(appointments.expertId, expertId)
      )
    )
    .groupBy(services.shortDescription);

  const totalEarnings : any = totalEarningsResult[0].total_earnings || 0;
  const totalCount: any = totalEarningsResult[0].count || 1;
  const averageEarnings = totalEarnings / totalCount;

  return {
    averageEarnings,
    serviceEarnings: serviceEarningsResult,
  };
}

export async function getServiceDetails({ expertId }: {expertId: string}) {
  const servicesWithStats = await db
    .select({
      serviceId: services.id,
      title: services.title,
      duration: services.duration,
      amount: services.amount,
      totalBookings: sql<number>`count(${appointments.id})`,
      totalEarnings: sql<number>`sum(${appointments.amount})`,
    })
    .from(services)
    .leftJoin(appointments, eq(services.id, appointments.serviceId))
    .where(eq(services.expertId, expertId))
    .groupBy(services.id)
    .execute();

  const formattedServices = servicesWithStats.map((service) => ({
    id: service.serviceId,
    title: service.title,
    duration: `${service.duration} mins`,
    price: `₹${service.amount}`,
    totalBookings: service.totalBookings,
    totalEarnings: `₹${
      service.totalEarnings != null ? service.totalEarnings : 0
    }`,
  }));
  return formattedServices;
}
