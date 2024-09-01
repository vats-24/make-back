import fastify from "fastify";
import { logger } from "./logger";
import jwt from "jsonwebtoken";
import guard from "fastify-guard";
import { userRoutes } from "../modules/users/users.route";
import { env } from "../config/env";
import fastifyGuard from "fastify-guard";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { FastifyCookie, type FastifyCookieOptions } from "@fastify/cookie";
import cookie from "@fastify/cookie";
import { readFileSync } from "fs";
import { join } from "path";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { appointmentRoutes } from "../modules/appointments/appointments.route";
import { expertRoutes } from "../modules/experts/experts.route";
type User = {
  id: string;
  role: string;
};

declare module "fastify" {
  interface FastifyRequest {
    user: User;
  }
}

export async function buildServer() {
  const app = fastify({
    logger,
  });

  app.decorateRequest("user", null);

  /*
  app.addHook("onRequest", async (request, reply) => {
    console.log(request.url);
    if (!request.url.startsWith("/api/users/login")) {
      const authHeader = request.headers.authorization || request.cookies;

      if (!authHeader) {
        return;
      }

      try {
        const token = authHeader.replace("bearer", "");
        const decoded = jwt.verify(token, env.ACCESS_JWT_SECRET) as User;
        console.log("decoded", decoded);
        request.user = decoded;
      } catch (error) {}
    } else {
      return;
    }
  });
  */
 
  app.register(fastifyGuard, {
    errorHandler(result, request, reply) {
      return reply.send("You can not do that");
    },
  });

  app.register(fastifyMultipart)

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        callbackURL: env.REDIRECT_URL,
      },
      async (accessToken, refreshToken, profile, cb) => {
      }
    )
  );

  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile"] }, () => {
    })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate(
      "google",
      { failureRedirect: "login" },
      function (req, reply) {
        reply.redirect("/");
      }
    )
  );

  app.register(userRoutes, { prefix: "/api/users" });
  app.register(expertRoutes, { prefix: "/api/experts" });
  app.register(appointmentRoutes, { prefix: "/api/appointment" });
  //app.register(,{prefix: "api/auth/google"})

  app.register(cookie, {
    secret: "my-secret", // for cookies signature
    parseOptions: {}, // options for parsing cookies
  } as FastifyCookieOptions);

  app.register(cors, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    credentials: true,
  });

  return app;
}
