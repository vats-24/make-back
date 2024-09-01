import {z} from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const createAppointmentBodySchema = z.object({
    date: z.date(),
    startTime : z.string(),
    endTime : z.string(),
    amount : z.number(),
    paymentStatus: z.string(),
    status: z.enum(['scheduled','rescheduled','completed']),
})

export type CreateAppointmentBody = z.infer<typeof createAppointmentBodySchema>

export const createAppointmentJsonSchema = {
    body: zodToJsonSchema(createAppointmentBodySchema)
}


const createScheduleBodySchema = z.object({
    day: z.number(),
    startTime: z.string(),

})
