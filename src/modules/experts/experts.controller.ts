import type { FastifyRequest, FastifyReply } from "fastify";
import type { CreateExpertsBody, CreateServiceBody } from "./experts.schema";
import { db } from "../../db";
import { experts } from "../../db/schema";
import { eq } from "drizzle-orm";
import {
  createService,
  deleteService,
  getServices,
  updateService,
} from "./experts.services";
import { ApiError } from "../../helper/apiError";
import { ResponseStatusCode } from "../../constants/constants";
import { ApiResponse } from "../../helper/apiResponse";

//<{ Body: CreateServiceBody }>

interface ServiceData {
  title: string;
  description: string;
  shortDescription: string;
  amount: string;  // Or number, depending on the actual type
  duration: string;  // Or number, depending on the actual type
}

export async function createServiceHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;

  const expertId = await db
    .select()
    .from(experts)
    .where(eq(experts.userId, userId));

  const data =
    request.body;

    const { title, description, shortDescription, amount, duration }  = data as ServiceData;


  const sdata = {
    expertId: expertId[0].id,
    type: "1:1 Call",
    title,
    description,
    shortDescription,
    amount: parseInt(amount),
    duration: parseInt(duration),
  };


  try {
    const result = await createService(sdata);

    if (!result) {
      throw new ApiError(
        ResponseStatusCode.INTERNAL_SERVER_ERROR,
        "Error creating in a service"
      );
    }

    return reply.send(
      new ApiResponse(
        ResponseStatusCode.SUCCESS,
        result,
        "Services Created Successfully"
      )
    );
  } catch (error) {
    return reply.status(500).send("Error creating service");
  }
}

export async function getAllServicesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { type } = request.query as { type: string };
  const userId = request.user.id;

  const expertId = await db
    .select()
    .from(experts)
    .where(eq(experts.userId, userId));

  try {
    const service = getServices({ type, expertId: expertId[0].id });

    return service;
  } catch (error) {
    console.error("Error fetching services:", error);
    reply.status(500).send({ message: "Error fetching services" });
  }
}

export async function updateServiceHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const data = request.body;

  const { serviceId } = request.params as { serviceId: string };

  try {
    const updatedService = updateService(serviceId, data);

    return reply.send(
      new ApiResponse(
        ResponseStatusCode.SUCCESS,
        updatedService,
        "Service updated successfully"
      )
    );
  } catch (error) {
    console.error("Error updating service:", error);
    reply.status(500).send({ message: "Error updating service" });
  }
}

export async function deleteServiceHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { serviceId } = request.params as { serviceId: string };

  try {
    const deletedService = deleteService(serviceId);

    if (!deletedService) {
      throw new ApiError(
        ResponseStatusCode.INTERNAL_SERVER_ERROR,
        "Error deleting the service"
      );
    }

    return reply.send(
      new ApiResponse(
        ResponseStatusCode.SUCCESS,
        deletedService,
        "Service deleted Successfully"
      )
    );
  } catch (error) {
    console.error("Error deleting service:", error);
    reply.status(500).send({ message: "Error deleting service" });
  }
}

export async function setAvailabilityHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { availability } = request.body as {
    availability: [{ day: number; slots: [string] }];
  };

  const userId = request.user.id;

  if (!availability) {
    throw new Error("ALl fields are required");
  }

  if (availability.filter((item) => item.day < 0 || item.day > 6).length > 0) {
    return reply.send("Invalid Day");
  }
 
  try {
    await db
      .update(experts)
      .set({ availability })
      .where(eq(experts.userId, userId));

    return reply.send({ message: "Updated Successfully" });
  } catch (error) {
    console.error("Error updating availability:", error);
    return reply.status(500).send("Error updating availability");
  }
}

interface SvgContent {
  title: string;
  description: string;
  duration: string;
  price:string
}

export async function getDynamicSvgHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { title, description, duration, price } = request.body as SvgContent;
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 1200 630">
      <rect width="100%" height="100%" fill="#eadef8" />
      
      <!-- Background elements -->
      <circle cx="1100" cy="100" r="50" fill="#E9D5FF" opacity="0.5" />
      <rect x="50" y="500" width="100" height="100" fill="#E9D5FF" opacity="0.5" />
      <circle cx="1150" cy="550" r="30" fill="#E9D5FF" opacity="0.5" />

      <!-- Main content -->
      <text x="60" y="80" font-family="Arial" font-size="36" fill="#1A1A1A">Join my 1-1 session on</text>
      <text x="60" y="150" font-family="Arial" font-size="64" font-weight="bold" fill="#6425FE">${title}</text>
      
      <text x="60" y="220" font-family="Arial" font-size="24" fill="#4B5563">Where we will discuss about:</text>
      <foreignObject x="60" y="240" width="600" height="100">
        <p xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial; font-size: 28px; color: #1A1A1A;">
        ${description}
        </p>
      </foreignObject>

      <g transform="translate(60, 360)">
        
        <text x="50" y="28" font-family="Arial" font-size="24" fill="#4B5563">⏰${duration} mins</text>
        
        
        <text x="230" y="28" font-family="Arial" font-size="24" fill="#4B5563">₹${price}</text>
      </g>

      <!-- Illustration -->
      <image href="https://res.cloudinary.com/dspuxs2c0/image/upload/fl_preserve_transparency/v1723577938/share_rafc6w.jpg?_s=public-apps" x="500" y="0" width="650" height="650" />

      <!-- Bottom bar -->
      <rect x="0" y="530" width="1200" height="100" fill="#6425FE" />
      <text x="60" y="590" font-family="Arial" font-size="32" fill="#FFFFFF">Connect with me on "Delta factor"</text>
    </svg>
  `;

  reply.send({ svg: svgContent });
}
