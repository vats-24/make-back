import { eq, sql, type InferInsertModel, Placeholder, SQL } from "drizzle-orm";
import { db } from "../../db";
import { appointments, experts, services } from "../../db/schema";

export async function createExpert(data: InferInsertModel<typeof experts>) {
  const result = await db.insert(experts).values(data).returning({
    id: experts.id,
    expertise: experts.expertise,
  });

  return result[0];
}

export async function getServices({ type, expertId }: {type: any, expertId: string}) {
  if (!type) {
    const result = await db
      .select({
        services: services,
        totalBookings: sql<number>`COUNT(${appointments.id})`,
      })
      .from(services)
      .leftJoin(appointments, eq(appointments.serviceId, services.id))
      .where(eq(services.expertId, expertId))
      .groupBy(services.id);
    return result;
  } else { 
    const result = await db
      .select()
      .from(services)
      .where(eq(services.type, type));
    return result;
  }
}

export async function getService(id: string) {
  const result = await db.select().from(services).where(eq(services.id, id));

  return result;
}
//: InferInsertModel<typeof services>
export async function createService(data: any) {
  const result = await db.insert(services).values(data).returning({
    id: services.id,
    expertId: services.expertId,
    type: services.type,
    title: services.title,
    shortDescription: services.shortDescription,
    description: services.description,
    duration: services.duration,
    amount: services.amount,
  });
  return result[0];
}

export async function updateService(
  serviceId: any,
  data: any
) {
  const result = await db
    .update(services)
    .set(data)
    .where(eq(services.id, serviceId))
    .returning({ updatedId: services.id });

  return result;
} 

export async function deleteService(id: string) {
  const deletedService = await db
    .delete(services)
    .where(eq(services.id, id))
    .returning({ deletedService: services.id });
 
  return deletedService;
}
