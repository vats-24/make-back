import { string, z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const createUserBodySchema = z.object({
	name: z.string(),
	email: z.string().email(),
	password: z.string().min(6),
	role: z.string(),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;

export const createUserJsonSchema = {
	body: zodToJsonSchema(createUserBodySchema, "createUserBodySchema"),
};

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export type LoginBody = z.infer<typeof loginSchema>;

export const loginJsonSchema = {
	body: zodToJsonSchema(loginSchema, "loginSchema"),
};

const createExpertBodySchema = z.object({
	expertise: z.string().array(),
	ratings: z.number().max(5),
	reviews: z.number().default(0),
	availability: z.array(
		z.object({
			day: z.number(),
			slots: z.array(z.string()),
		}),
	),
});

export type CreateExpertsBody = z.infer<typeof createExpertBodySchema>;

export const createExpertJsonSchema = {
	body: zodToJsonSchema(createExpertBodySchema, "createExpertBodySchema"),
};
