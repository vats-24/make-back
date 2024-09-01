import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from "jsonwebtoken"
import { env } from '../config/env';

/*
export function roleGuard(allowedRole: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers.authorization?.split(' ')[0];
    console.log(token);

    if (!token) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      const user = extractUserFromToken(token);

      if (!user || !user.role || !allowedRole.some((role) => user.role.includes(role))) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      request.user = user;
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  };
}
*/

export function extractUserFromToken(token: string) {
    try {
      const decodedToken = jwt.verify(token, env.REFRESH_JWT_SECRET);
      return decodedToken as { id: string; role: string[] };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  export const verifyUserRole = async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.user.role !== 'user') {
      return reply.status(403).send('Forbidden: You are not authorized to access this resource.');
    }
    
  };
  
  export const verifyExpertRole = async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.user.role !== 'expert') {
      return reply.status(403).send('Forbidden: You are not authorized to access this resource.');
    }
    
  };