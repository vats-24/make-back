import type { FastifyInstance } from "fastify";
import {
  createAppointmentHandler,
  getAllAppointmentsHandler,
  getAppointmentHandler,
  getAverageEarningsHandler,
  getExpertAppointmentsHandler,
  getMonthlyEarningsHandler,
  getMonthlyServiceBookingsHandler,
  getServiceDetailsHandler,
  getSessionsBookingsHandler,
  getStatsHandler,
} from "./appointments.controller";
import { verifyGoogleToken } from "../../middleware/verifyJwt";
import { createAppointmentJsonSchema } from "./appointments.schema";
import { verifyExpertRole } from "../../middleware/verifyRole";

export async function appointmentRoutes(app: FastifyInstance) {
  app.post(
    "/book-appointment/:expertId/:serviceId",
    { preHandler: [verifyGoogleToken, verifyExpertRole]},
    createAppointmentHandler
  );

  app.get("/get-expert-appointment/:expertId", getExpertAppointmentsHandler);

  app.get("/get-all-appointments", getAllAppointmentsHandler);

  app.get("/get-appointment/:appointmentId", getAppointmentHandler);

  app.get("/stats", { preHandler: [verifyGoogleToken, verifyExpertRole]}, getStatsHandler);

  app.get(
    "/monthly-earnings",
    { preHandler: [verifyGoogleToken, verifyExpertRole] },
    getMonthlyEarningsHandler
  );

  app.get(
    "/monthly-service-bookings",
    { preHandler: [verifyGoogleToken, verifyExpertRole] },
    getMonthlyServiceBookingsHandler
  );

  app.get( 
    "/session-bookings",
    { preHandler: [verifyGoogleToken, verifyExpertRole] }, 
    getSessionsBookingsHandler
  );

  app.get("/get-average-earnings",{ preHandler: [verifyGoogleToken, verifyExpertRole] },getAverageEarningsHandler)

  app.get("/get-service-details",{ preHandler: [verifyGoogleToken, verifyExpertRole] },getServiceDetailsHandler)
}
  