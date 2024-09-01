import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env";
import { db } from "../db";
import { users } from "../db/schema";
import { ConsoleLogWriter, eq } from "drizzle-orm";
import { oauth2Client } from "../config/google";
import { google } from "googleapis";

/*
export const verifyJWT = async (
  request: FastifyRequest,
  reply: FastifyReply,
  next: Function
) => {
  try {
    const token =
      request.cookies?.token ||
      request.headers.authorization?.replace("Bearer ", "") || request.headers.token;

    if (!token) {
      throw new Error("Unauthorized request"); 
    }

    const decodedToken: any = jwt.verify(token, env.JWT_SECRET);

    const [user] = await db
      .select({ id: users.id})
      .from(users)
      .where(eq(decodedToken.id, users.id));

      //decodedToken?.id[0] || 

    if (!user) {
      throw new Error("Invalid Access Token"); 
    }

    request.user = user;
    console.log(request.user)
    next();
  } catch (error: any) {
    throw new Error("Invalid access token");
  }
};
*/

export const verifyGoogleToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const accessToken : any = request.cookies?.token || request.headers.authorization?.replace('Bearer ', '') || request.headers.token;

    if (!accessToken) {
      throw new Error('Unauthorized request');
    }

    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const tokenInfo = await oauth2.tokeninfo({ access_token: accessToken });

    if (!tokenInfo || !tokenInfo.data || !tokenInfo.data.user_id) {
      throw new Error('Invalid access token');
    }
    const googleId = tokenInfo.data.user_id;

    const [user] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.googleId, googleId));

    if (!user) {
      throw new Error('Invalid Access Token');
    }

    request.user = user;

    if (user.role === 'user') {
      request.user.role = 'user';
    } else if (user.role === 'expert') {
      request.user.role = 'expert';
    } else {
      throw new Error('User role not recognized');
    }
  } catch (error: any) {
    return reply.status(401).send('Invalid access token');
  }
}; 