import { pgEnum } from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum('roles', ['admin','expert','user'])

export const statusEnum = pgEnum('status', ['scheduled','rescheduled','completed'])

export const serviceEnum = pgEnum('service', ['1:1 Call', 'Priority DM', 'Webinar', 'Subscription', 'Digital Product'])

export const enum ResponseStatusCode{
    SUCCESS= 200,
    BAD_REQUEST= 400,
    UNAUTHORIZED= 401,
    FORBIDDEN= 403,
    NOT_FOUND= 404,
    INTERNAL_SERVER_ERROR= 500,
}