import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateAppointmentBody } from "./appointments.schema";
import {
  createAppointment,
  getAppointments,
  getExpertAppointments,
  getExpertAvailability,
  getAppointment,
  getStatistics,
  getMonthlyServiceBookings,
  getSessionsBookings,
  getMonthlyEarnings,
  getAverageEarnings,
  getServiceDetails,
} from "./appointments.service";
import { getSlotAvailability } from "../../helper/expert.util";
import { ApiError } from "../../helper/apiError";
import { ResponseStatusCode } from "../../constants/constants";
import { ApiResponse } from "../../helper/apiResponse";
import { db } from "../../db";
import { experts, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { oauth2Client } from "../../config/google";

//tested
//<{ Body: CreateAppointmentBody }>

interface CreateAppointment {
  date: Date;
  startTime: string;
  endTime: string;
  amount: number;
  paymentStatus: string;
  status: string;
}
export async function createAppointmentHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { expertId, serviceId } = request.params as {
    expertId: string;
    serviceId: string;
  };

  const userId = request.user.id;
  const { date, startTime, endTime, amount, paymentStatus, status } =
    request.body as CreateAppointment;

  if (!date || !startTime || !endTime || !amount || !paymentStatus || !status) {
    throw new ApiError(
      ResponseStatusCode.BAD_REQUEST,
      "All fields are required"
    );
  }

  const data = {
    expertId,
    userId,
    serviceId,
    date,
    startTime,
    endTime,
    amount,
    paymentStatus,
    // status,
  };
  try {
    const isSlotAvailable = await getSlotAvailability(
      expertId,
      date,
      startTime,
      endTime
    );

    if (!isSlotAvailable) {
      throw new ApiError(
        ResponseStatusCode.BAD_REQUEST,
        "Slot not available for given date"
      );
    }

    const appointment = createAppointment(data);

    if (!appointment) {
      throw new ApiError(ResponseStatusCode.NOT_FOUND, "No appointment found");
    }

    return reply.send(
      new ApiResponse(
        ResponseStatusCode.SUCCESS,
        appointment,
        "Appointment created successfully"
      )
    );
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw new ApiError(
      ResponseStatusCode.INTERNAL_SERVER_ERROR,
      "Error creating an appointment"
    );
  }
}

//tested for admin for particular paraexpert
export async function getExpertAppointmentsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { expertId } = request.params as { expertId: string };

    if (!expertId) {
      throw new ApiError(
        ResponseStatusCode.BAD_REQUEST,
        "ExpertId is required"
      );
    }

    const appointments = await getExpertAppointments(expertId);

    if (!appointments) {
      throw new ApiError(ResponseStatusCode.NOT_FOUND, "No appointments found");
    }

    return reply.send(
      new ApiResponse(
        ResponseStatusCode.SUCCESS,
        appointments,
        "Appointments fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching expert appointments:", error);
    throw new ApiError(
      ResponseStatusCode.BAD_REQUEST,
      "Error fetching expert appointments"
    );
  }
}

//tested
export async function getAllAppointmentsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { status } = request.query as { status: string };

    const appointment = getAppointments(status);

    if (!appointment) {
      throw new ApiError(ResponseStatusCode.BAD_REQUEST);
    }

    return reply.send(
      new ApiResponse(
        ResponseStatusCode.SUCCESS,
        appointment,
        "Appointment fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    reply.status(500).send({ message: "Error fetching all appointments" });
  }
}

export async function getAppointmentHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { appointmentId } = request.params as { appointmentId: string };
    const appointment = getAppointment(appointmentId);

    if (!appointment) {
      throw new ApiError(
        ResponseStatusCode.NOT_FOUND,
        "Apppointment not found"
      );
    }

    return reply.send(
      new ApiResponse(
        ResponseStatusCode.SUCCESS,
        appointment,
        "Appointment fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching appointment:", error);
    reply.status(500).send({ message: "Error fetching appointment" });
  }
}

//testing-done
export async function getExpertAvailabilityHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { expertId, date } = request.query as { expertId: string; date: Date };

  if (!expertId || !date) {
    throw new ApiError(
      ResponseStatusCode.BAD_REQUEST,
      "Missing required paramneters"
    );
  }

  try {
    const availability = getExpertAvailability(expertId, date);

    if (!availability) {
      throw new ApiError(
        ResponseStatusCode.NOT_FOUND,
        "Availability not found"
      );
    }

    return availability;
  } catch (error) {
    console.error("Error fetching expert availability:", error);
    reply.status(500).send({ message: "Error fetching expert availability" });
  }
}

//testing-done
// export async function getAllAppointmentsHandler (request: FastifyRequest, reply: FastifyRequest) {
//     try {

//         const appointments = getAppointments();

//         return appointments;

//     } catch (error) {

//     }
// }

export async function getStatsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { range } = request.query as {range :string};
  const userId = request.user.id;

  const expertId = await db
    .select()
    .from(experts)
    .where(eq(experts.userId, userId));

  const endDate = new Date();
  let startDate;

  switch (range) {
    case "7days":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "30days":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 30);
      break;
    case "12months":
      startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 12);
      break;
    case "alldate":
      startDate = new Date(0);
      break;
    default:
      return reply.status(400).send({ error: "Invalid range specified" });
  }

  try {
    const stats = await getStatistics({
      startDate,
      endDate,
      expertId: expertId[0].id,
    });
    reply.send(stats);
  } catch (error) {
    return reply.status(500).send({ error: "internal Server error" });
  }
}

interface User {
  id: string;
  role: string;
}

interface RequestWithUser extends FastifyRequest {
  user: User;
}

interface Expert {
  id: string;
  userId: string;
}

interface Booking {
  month: string;
  serviceName: any;
  totalBookings: any;
}

interface SBooking {
  serviceTitle: any;
  totalBookings: any;
}

interface FormattedBooking {
  name: string;
  [key: string]: number | string; 
}

export async function getMonthlyServiceBookingsHandler(
  request: RequestWithUser,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;

    const expertId = await db
      .select()
      .from(experts)
      .where(eq(experts.userId, userId));
    const bookings: Booking[] = await getMonthlyServiceBookings({
      expertId: expertId[0].id,
    });

    const formattedBookings: FormattedBooking[] = bookings.reduce<FormattedBooking[]>((acc, booking) => {
      const monthData = acc.find((item) => item.name === booking.month);
      if (monthData) {
        monthData[booking.serviceName] = parseInt(booking.totalBookings, 10);
      } else {
        acc.push({
          name: booking.month,
          [booking.serviceName]: parseInt(booking.totalBookings, 10),
        });
      }
      return acc;
    }, []);

    return reply.send(formattedBookings);
  } catch (error) {
    return reply.status(500).send({ error: "Internal Server Error" });
  }
}
//Performance
export async function getSessionsBookingsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;

    const expertId = await db
      .select()
      .from(experts)
      .where(eq(experts.userId, userId));

    const bookings: SBooking[] = await getSessionsBookings({ expertId: expertId[0].id });
    const maxBooking = Math.max(
      ...bookings.map((booking) => booking.totalBookings)
    );
    const maxRounded = Math.ceil(maxBooking / 100) * 100;

    const formattedBookings = bookings.map((booking) => ({
      title: booking.serviceTitle,
      totalBookings: parseInt(booking.totalBookings, 10),
      performance: Math.round(
        (parseInt(booking.totalBookings, 10) / maxRounded) * 100
      ),
    }));

    return reply.send(formattedBookings);
  } catch (error) {
    return reply.status(500).send({ error: "Internal Server Error" });
  }
}

export async function getMonthlyEarningsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;

    const expertId = await db
      .select()
      .from(experts)
      .where(eq(experts.userId, userId));

    const earnings = await getMonthlyEarnings({ expertId: expertId[0].id });

    return reply.send(earnings);
  } catch (error) {
    return reply.status(500).send({ error: "Internal Server Error" });
  }
}

//Services Page
export async function getAverageEarningsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { range } = request.query as {range :string};
  const userId = request.user.id;

  const expertId = await db
    .select()
    .from(experts)
    .where(eq(experts.userId, userId));

  const endDate = new Date();
  let startDate;

  switch (range) {
    case "7days":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "30days":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 30);
      break;
    case "12months":
      startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 12);
      break;
    default:
      startDate = new Date(0);
  }

  try {
    const averageEarnings = await getAverageEarnings({
      startDate,
      endDate,
      expertId: expertId[0].id,
    });

    return reply.send(averageEarnings);
  } catch (error) {}
}

export async function getServiceDetailsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;

  const expertId = await db
    .select()
    .from(experts)
    .where(eq(experts.userId, userId));

  try {
    const serviceDetails = await getServiceDetails({
      expertId: expertId[0].id,
    });

    reply.send(serviceDetails);
  } catch (error) {}
}

export async function refreshTokenHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { refreshToken } = request.body as {refreshToken : string};

  if (!refreshToken) {
    return reply.status(400).send("Refresh token is missing");
  }

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token;
    const newRefreshToken = credentials.refresh_token;

    return reply.send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken || refreshToken,
    });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return reply.status(401).send("Invalid refresh token");
  }
}

//doubt
export async function rescheduleAppointmentsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const data = request.body;

  try {
    const reschedule = "";
  } catch (error) {}
}
