import { FastifyRequest, FastifyReply } from 'fastify';
import { google } from 'googleapis';
import { oauth2Client } from '../config/google';

export async function tokenValidationMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authorizationHeader = request.headers.authorization;
    const accessToken = authorizationHeader?.split(' ')[1];

    if (!accessToken) {
      reply.status(401).send('Access token is missing');
      return;
    }

    oauth2Client.setCredentials({ access_token: accessToken });

    try {
      const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
      await oauth2.tokeninfo({ access_token: accessToken });
    } catch (err) {
      const refreshToken = request.headers['x-refresh-token'] as string | undefined;

      if (!refreshToken) {
        reply.status(401).send('Refresh token is missing');
        return;
      }

      oauth2Client.setCredentials({ refresh_token: refreshToken });
      


      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        const newAccessToken = credentials.access_token;
        const newRefreshToken = credentials.refresh_token;

        request.headers.authorization = `Bearer ${newAccessToken}`;
        reply.header('Authorization', `Bearer ${newAccessToken}`);
        if (newRefreshToken) {
          reply.header('x-refresh-token', newRefreshToken);
        }
      } catch (error) { 
        reply.status(401).send('Invalid refresh token');
        return;
      }
    }
  } catch (error) {
    console.error('Error during token validation:', error);
    reply.status(500).send('An error occurred during token validation');
    return;
  }
}