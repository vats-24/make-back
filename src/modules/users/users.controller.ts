import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateExpertsBody,
  CreateUserBody,
  LoginBody,
} from "./users.schemas";
import {
  createExpert,
  createExpertDetails,
  createUserDetails,
  generateAccessToken,
  getUserProfile,
  updateUserProfile,
} from "./users.services";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { generateAccessAndRefreshTokens } from "../../helper/generateToken";
import { oauth2Client, scopes } from "../../config/google";
import { google } from "googleapis";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { s3client } from "../../config/bucket";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
//tested
/*
export async function createUserHandler(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
) {
  const { ...data } = request.body;

  try {
    const user = await createUser(data);

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    reply.status(400).send({
      message: "User already exists",
    });
  }
}*/
//tested
export async function createExpertHandler(
  request: FastifyRequest<{ Body: CreateExpertsBody }>,
  reply: FastifyReply
) {
  const data = request.body;

  try {
    const user = await createExpert(data);
    return user;
  } catch (error) {
    console.error("Error creating expert:", error);
    reply.status(400).send({
      message: "User already exists",
    });
  }
}

export async function oAuthHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
    reply.redirect(url);
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    reply.status(500).send("An error occurred while generating OAuth URL");
  }
}

interface OAuthQuery {
  code?: string;
}

export async function oauthRedirectHandler(request: FastifyRequest<{Querystring: OAuthQuery}>, reply: FastifyReply) {
  try {
    const code = request.query.code;
    if (!code) {
      return reply.status(400).send('Code query parameter is missing');
    }

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens) {
      throw new Error('Failed to get tokens');
    }
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const userInfo = await oauth2.userinfo.get();
    const googleId = userInfo.data.id as any;

    if (!googleId) {
      throw new Error('Google ID is missing in the user info');
    }

    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));

    let isNewUser = false;

    if (!user) {
      const newUser = await db
        .insert(users)
        .values({
          //@ts-ignore
          googleId: googleId,
          name: userInfo.data.name,
          email: userInfo.data.email,
          role: 'expert',
        })
        .returning({
          id: users.id,
          email: users.email,
        });

      user = newUser[0] as any;
      isNewUser = true;
    }

    const tokenData = {
      id: user.id,
      email: user.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expires_in: tokens.expiry_date, 
      isNewUser
    };

    reply.send(tokenData);
  } catch (error) {
    console.error('Error during Google OAuth2 redirect:', error);
    reply.status(500).send('An error occurred during the OAuth process');
  }
}

export async function expertDetailsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;

    const { data } = request.body as any;

    const {
      firstName,
      lastName,
      phoneNumber,
      profileName,
      socialAccount,
      expertise,
      availability,
    } = data;

    const userData = {
      firstName,
      lastName,
      phoneNumber,
      profileName,
      socialAccount,
    };

    const userDetails = await createUserDetails(userData, userId);

    const expertData = {
      userId,
      expertise,
      availability,
    };

    const expertDetails = await createExpertDetails(expertData);

    return reply
      .status(200)
      .send({
        message: "Created Expert Successfully",
        userDetails,
        expertDetails,
      });
  } catch (error) {}
}
/*
export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;
  console.log(email, password);

  const user = await getUser({
    email,
    password,
  });

  if (!user) {
    return reply.code(400).send({
      message: "Invalid email and password",
    });
  }

  const { accessToken, refreshToken, normalToken } =
    await generateAccessAndRefreshTokens(user);

  /*reply.cookie("ACCESS_TOKEN", accessToken, {
		maxAge: 3600000,
		httpOnly: true,
		secure: true
	});

	reply.cookie("REFRESH_TOKEN", refreshToken, {
		maxAge: 360000000,
		httpOnly: true,
		secure: true
	});

  reply.status(200).send({
    message: "User logged in successfully",
    user,
    normalToken,
  });

  // const token = jwt.sign({
  //   id:user.id,
  //   role: user.role

  // },env.JWT_SECRET, {
  //   expiresIn: env.JWT_EXPIRY
  // } )

  // console.log(token)

  /*return reply.status(200).send({
		message: "Successful Login",
		user: user,
		accessToken,
		refreshToken,
	});*/


/*
export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    reply.clearCookie("ACCESS_TOKEN", {
      httpOnly: true,
      secure: true,
    });

    reply.clearCookie("REFRESH_TOKEN", {
      httpOnly: true,
      secure: true,
    });

    reply.status(200).send({
      message: "User logged out successfully",
    });
  } catch (error) {
    reply.status(500).send({
      message: "Error logging out",
      error: error.message,
    });
  }
*/

export async function getUserProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id

  const profile = getUserProfile(userId)

  return profile;
}

interface UserProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileName?: string;
  socialAccount?: string;
  profilePhoto?: string;
}

interface ExpertData {
  expertise?: string;
  availability?: string;
}

export async function updateUserProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;


  const data = request.body as Partial<UserProfileData & ExpertData>

  const {
    firstName,
    lastName, 
    phoneNumber,
    profileName,
    socialAccount,
    expertise,
    availability,
    profilePhoto
  } = data;

  const userData : UserProfileData = {
    firstName,
    lastName,
    phoneNumber,
    profileName,
    socialAccount,
    profilePhoto
  };

  const expertData : ExpertData = {
    expertise,
    availability
  }

  /*const file =  await request.file()

  const params = {
    Bucket: 'delta-factor',
    Key: `profile-photos/${Date.now()}-${file.filename}`,
    Body: await file.toBuffer(),
    ContentType: file.mimetype,
  }*/
  

  try {
   // await s3client.send(new PutObjectCommand(params));
    const updatedProfile = updateUserProfile(userId,userData,expertData);

    return updatedProfile;
  } catch (error) {
    console.error("Error updating user profile:", error);
    reply
      .status(500)
      .send({ message: "An error occurred while updating the profile" });
  }
}

export async function updateExpertProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {}

export async function generateToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { refreshToken } = request.cookies;

  try {
    if (!refreshToken) {
      throw {
        status: 403,
        message: "Verification error",
      };
    }

    jwt.verify(
      refreshToken,
      env.REFRESH_JWT_SECRET,
      async (err: Error | null, user) => {
        if (err) throw { status: 403, message: "Verification Failed" };
        const accessToken = await generateAccessToken(user as any);
        reply.status(200).send(accessToken);
      }
    );
  } catch (error) {}
}

interface FileQuery {
  fileType?: string;
}

export async function getSignedUrlHandler(request: FastifyRequest, reply: FastifyReply){
  const query = request.query as { fileType?: string };

  const { fileType } = query;

  if (!fileType) {
    return reply.status(400).send({ error: 'File type is required' });
  }

  const bucket = 'delta-factor';
  const key = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileType}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType
  }) 

  try {
    const signedUrl = await getSignedUrl(s3client,command)
    reply.send({signedUrl,key})
  } catch (error) {
    reply.status(500).send({error: 'Failed to generate URL'})
  }
}

export async function iAdmin(request: FastifyRequest, reply: FastifyReply) {
  reply.status(200).send({ message: "You are now admin" });
}
 