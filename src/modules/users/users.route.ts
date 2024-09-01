import fastify, { type FastifyInstance } from "fastify";
import { createUserJsonSchema, loginJsonSchema } from "./users.schemas";
import {
  createExpertHandler,
  expertDetailsHandler,
  generateToken,
  getSignedUrlHandler,
  getUserProfileHandler,
  iAdmin,
  oAuthHandler,
  oauthRedirectHandler,
  updateUserProfileHandler,
} from "./users.controller";
import { ROLES } from "../../config/roles";
import { verifyExpertRole } from "../../middleware/verifyRole";
import {
  getExpertAppointmentsHandler,
  getExpertAvailabilityHandler,
  refreshTokenHandler,
} from "../appointments/appointments.controller";
import { verifyGoogleToken } from "../../middleware/verifyJwt";
import { tokenValidationMiddleware } from "../../middleware/tokenValidation";

export async function userRoutes(app: FastifyInstance) {
  /*app.post(
    "/registerUser",
    {
      schema: createUserJsonSchema,
    },
    createUserHandler
  );*/

  app.post("/registerExpert", createExpertHandler);

  /*
  app.post(
    "/login",
    {
      schema: loginJsonSchema,
    },
    loginHandler
  );
*/
  app.get("/assign-podcasters", iAdmin);

  app.get("/google/users", oAuthHandler);

  app.get("/google/redirect", oauthRedirectHandler);

  app.get(
    "/protected",
    { preHandler: tokenValidationMiddleware },
    async (request, reply) => {
      return reply.send("This is a protected route");
    }
  );

  app.post("/auth/refresh-token",refreshTokenHandler)

  app.get("/get-available-slots", getExpertAvailabilityHandler);

  app.post(
    "/user-details",
    { preHandler: [verifyGoogleToken, verifyExpertRole] },
    expertDetailsHandler
  );

  //app.patch("set-availability", { preHandler: verifyJWT },);

  // app.get("/google/expert/redirect",)

  // { preHandler: roleGuard(['super']) },

  app.post("/generateToken", generateToken);

  app.get(
    "/me",
    { preHandler: [verifyGoogleToken, verifyExpertRole] },
    getUserProfileHandler
  );

  app.patch(
    "/update-profile",
    { preHandler: [verifyGoogleToken, verifyExpertRole] },
    updateUserProfileHandler
  );

  app.get("/s3/signed-url",{ preHandler: [verifyGoogleToken, verifyExpertRole] },getSignedUrlHandler)
}
