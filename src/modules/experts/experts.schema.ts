import {z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const createExpertBodySchema = z.object({
    expertise: z.string().array(),
    ratings: z.number().max(5),
    reviews: z.number()
})

export type CreateExpertsBody = z.infer<typeof createExpertBodySchema>

export const createExpertJsonSchema = {
    body: zodToJsonSchema(createExpertBodySchema, "createExpertBodySchema")
}

const createServiceBodySchema = z.object({
    type: z.enum(["1:1 Call","Priority DM","Webinar","Subscription","Digital Product"]),
    title: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    duration: z.number(),
    amount: z.number()
})

export type CreateServiceBody = z.infer<typeof createServiceBodySchema>

export const createServiceJsonSchema = {
    body: zodToJsonSchema(createServiceBodySchema,"createServiceBodySchema")
}

