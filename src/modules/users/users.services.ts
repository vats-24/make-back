import { type InferInsertModel, eq, and, SQL, SQLWrapper, Placeholder } from "drizzle-orm";
import { experts, users } from "../../db/schema";
import argon2 from "argon2";
import { db } from "../../db";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
//import { CreateExpertsBody } from "./users.schemas";

export type CreateExpertsBody = {
  name: string;
  email: string;
  password: string;
  expertise: Array<string>;
  availability: Array<{
    day: string;
    slots: string[];
  }>;
};

/*
export async function createUser(data: InferInsertModel<typeof users>) {
  const hashedPassword = await argon2.hash(data.password);

  const result = await db
    .insert(users)
    .values({
      ...data,
      password: hashedPassword,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

  return result[0];
}
*/

export async function createUserDetails(data: {
    id?: string | SQL<unknown> | undefined; googleId?: string | SQL<unknown> | null | undefined; firstName?: string | SQL<unknown> | null | undefined; lastName?: string | SQL<unknown> | null | undefined; phoneNumber?: string | SQL<unknown> | null //import { CreateExpertsBody } from "./users.schemas";
      | undefined; profileName?: string | SQL<unknown> | null | undefined; socialAccount?: string | SQL<unknown> | null | undefined; name?: string | SQL<unknown> | undefined; email?: string | SQL<unknown> | undefined; password?: string | SQL<unknown> | null | undefined; role?: SQL<unknown> | "admin" | "expert" | "user" | undefined; profilePhoto?: string | SQL<unknown> | null | undefined; createdAt?: SQL<unknown> | Date | undefined; updatedAt?: SQL<unknown> | Date | undefined;
  }, userId: string | SQLWrapper) {
  const result = await db.update(users).set(data).where(eq(users.id, userId));

  return result;
}

export async function createExpertDetails(data: { userId: string | SQL<unknown> | Placeholder<string, any>; id?: string | SQL<unknown> | Placeholder<string, any> | undefined; expertise?: string[] | SQL<unknown> | Placeholder<string, any> | null | undefined; ratings?: number | SQL<unknown> | Placeholder<string, any> | null | undefined; reviews?: number | SQL<unknown> | Placeholder<string, any> | null | undefined; availability?: SQL<unknown> | { [x: string]: any; day: number; slots: string[]; }[] | Placeholder<string, any> | null | undefined; upiId?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; }) {
  const result = await db.insert(experts).values(data);

  return result;
}

export async function createExpert(data: any) {
  const { name, email, password, expertise, availability } = data;

  const hashedPassword = await argon2.hash(password);

  const newExpert = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      role: "expert",
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.email,
      role: users.role,
    });

  const result = await db
    .insert(experts)
    .values({
      userId: newExpert[0].id,
      availability,
      expertise,
    })
    .returning({
      id: experts.id,
      expertise: experts.expertise,
    });

  return result[0];
}

/*
export async function getUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      password: users.password,
      role: users.role,
    })
    .from(users)
    .where(eq(users.email, email));

  const user = result[0];

  if (!user) {
    console.log("No user found with the provided email.");
  }

  const passwordIsValid = await argon2.verify(user.password, password);
  if (!passwordIsValid) {
    console.log("Password verification failed.");
    return null; // Or handle as per your error handling strategy
  }

  // console.log("User authenticated successfully:", user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
*/
export async function getUserProfile(userId: string) {
  const userResult = await db.select().from(users).where(eq(users.id, userId));
  const expertResult = await db
    .select()
    .from(experts)
    .where(eq(experts.userId, userId));

  if (userResult.length > 0 && expertResult.length > 0) {
    const result = { ...userResult[0], ...expertResult[0] };
    return result;
  } else if (userResult.length > 0) {
    return userResult[0];
  } else if (expertResult.length > 0) {
    return expertResult[0];
  } else {
    return null;
  }
}

export async function updateUserProfile(userID: string | SQLWrapper, userData: any, expertData : any) {
  const userResult = await db
    .update(users)
    .set(userData)
    .where(eq(users.id, userID))
    .returning({ updatedId: users.id });

  const expertResult = await db
    .update(experts)
    .set(expertData)
    .where(eq(experts.userId, userID))
    .returning({ updatedId: experts.id });

    if (userResult.length > 0 && expertResult.length > 0) {
      const result = { ...userResult[0], ...expertResult[0] };
      return result;
    } else if (userResult.length > 0) {
      return userResult[0];
    } else if (expertResult.length > 0) {
      return expertResult[0];
    } else {
      console.error("No data found for userId:", userID);
      return null;
    }
}

export async function updateExpertProfile() {}

export async function generateAccessToken(user: string | object) {
  return jwt.sign(user, env.ACCESS_JWT_SECRET, {
    expiresIn: env.ACCESS_JWT_EXPIRY,
  });
}
