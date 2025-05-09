import { db } from "../db";
import { randomInts } from "../db/schema";
import { publicProcedure, router } from "../lib/trpc";
import { eq } from "drizzle-orm";
import {z} from 'zod'; //uses zod for input validation

export const helloWorldRouter = router({
    hello: publicProcedure
        .meta({ openapi: { method: 'GET', path: '/hello' } }) //expose the procedure as a REST endpoint, so access at localhost:3000/hello
        .input(z.object({name: z.string()}))
        .output(z.object({greeting: z.string()}))
        .query(({input}) => { //procedure  is a function that will be exported
            const stuffFromDB = "Hello"; //query is the equivalent of get, can get and return stuff from the db; in mutation (put) can change the db
            return { greeting: `${stuffFromDB} ${input.name}!` };
        }),
    luckyNumber: publicProcedure
        .meta({ openapi: { method: 'GET', path: '/luckynumber' } })
        .input(z.void())
        .output(z.object({number: z.number().positive()}))
        .query(async () => {
            const randId = Math.floor(Math.random() * 100) + 1; // find random index from 1-100
            const number = await db // get number at randomly-generated index
                .select()
                .from(randomInts)
                .where(eq(randomInts.id, randId))
                .get()
            if (!number) {
                return { number: 0 }; // return 0 as lucky number if number was not found
            }

            return { number: number.randInt };
        }),
    // otherFunction: (multiple functions go in a route)
})