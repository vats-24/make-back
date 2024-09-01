import { FastifyInstance } from "fastify";
import { verifyGoogleToken } from "../../middleware/verifyJwt";
import { createServiceHandler, deleteServiceHandler, getAllServicesHandler, getDynamicSvgHandler, setAvailabilityHandler, updateServiceHandler } from "./experts.controller";
import { verifyExpertRole } from "../../middleware/verifyRole";

export async function expertRoutes(app: FastifyInstance) {
    app.patch("/set-availability",{ preHandler: [verifyGoogleToken, verifyExpertRole] },setAvailabilityHandler)

    app.get("/get-all-services",{ preHandler: [verifyGoogleToken, verifyExpertRole]},getAllServicesHandler)  //set-jwt

    app.post("/create-service",{ preHandler: [verifyGoogleToken, verifyExpertRole] },createServiceHandler)

    app.patch("/update-service/:serviceId",{ preHandler: [verifyGoogleToken, verifyExpertRole] },updateServiceHandler)

    app.delete("/delete-service/:serviceId",{ preHandler: [verifyGoogleToken, verifyExpertRole] },deleteServiceHandler)

    app.post("/generate-svg",getDynamicSvgHandler);
}  