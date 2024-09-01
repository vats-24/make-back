import { number } from "zod";

export const ALL_ROLES = [
    "admin",
    "podcaster",
    "mentor",
    "user"
] as const


export const ROLES = ALL_ROLES.reduce((acc,role)=>{
    acc[role] = role;

    return acc;
}, {} as Record<(typeof ALL_ROLES)[number], (typeof ALL_ROLES)[number]>)