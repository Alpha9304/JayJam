import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { z } from "zod";
import fs from 'fs';
import { getMajor, getName, getEmail, getProfilePic, getPronouns, updateMajor, updateName, updateProfile, updatePronouns } from "../scripts/user";
import { nameSchema, majorSchema, pronounsSchema } from "../validators/profile";

let defaultBlob : Buffer;
fs.readFile('../server/src/tests/test_data/after.jpg', (err, data) => {
    defaultBlob = data;
})

export const profileRouter = router({
    getName: protectedProcedure
        .meta({ openapi: {method: 'GET', path: '/getName'}})
        .input(z.void())
        .output(z.object({name: z.string()}))
        .query(async ({ctx}) => {
            const userId = ctx.session?.userId!;
            const ret = await getName(userId);
            return ret ? {name: ret} : {name: ""};
        }),

    getEmail: protectedProcedure
        .meta({ openapi: {method: 'GET', path: '/getEmail'}})
        .input(z.void())
        .output(z.object({email: z.string()}))
        .query(async ({ctx}) => {
            const userId = ctx.session?.userId!;
            const ret = await getEmail(userId);
            return ret ? {email: ret} : {email: ""};
        }),

    getProfilePic: protectedProcedure
        .meta({ openapi: {method: 'GET', path: '/getPic'}})
        .input(z.void())
        .output(z.object({pic: z.string()}))
        .query(async ({ctx}) => {
            const userId = ctx.session?.userId!;
            const profileBuffer = await getProfilePic(userId);

            if (Buffer.isBuffer(profileBuffer)) {
                return { pic: profileBuffer.toString("base64")};
            }
            
            return { pic: "" };
        }),

    getPronouns: protectedProcedure
        .meta({ openapi: {method: 'GET', path: '/getPro'}})
        .input(z.void())
        .output(z.object({pronouns: z.string()}))
        .query(async ({ctx}) => {
            const userId = ctx.session?.userId!;
            const ret = await getPronouns(userId);
            return ret ? {pronouns: ret} : {pronouns: ""};
        }),

    getMajor: protectedProcedure
        .meta({ openapi: {method: 'GET', path: '/getMajor'}})
        .input(z.void())
        .output(z.object({major: z.string()}))
        .query(async ({ctx}) => {
            const userId = ctx.session?.userId!;
            const ret = await getMajor(userId);
            return ret ? {major: ret} : {major: ""};
        }),

    checkNameSchema: publicProcedure
        .meta({ openapi: {method: 'PUT', path: '/checkName'}})
        .input(nameSchema)
        .output(z.object({success: z.boolean(), name: z.string(), message: z.string()}))
        .mutation(async ({ctx, input}) => {
            return {
                success: true,
                name: input.newName,
                message: "Name is correctly formatted"
            }
        }),

    updateName: protectedProcedure
        .meta({ openapi: {method: 'PUT', path: '/pushName'}})
        .input(nameSchema)
        .output(z.object({success: z.boolean(), name: z.string(), message: z.string()}))
        .mutation(async ({ctx, input}) => {
            try {
                updateName(ctx.session?.userId!, input.newName);
                return {success: true, name: input.newName, message: "Updated name"};
            } catch (error) {
                return {success: false, name: "", message: "Could not update name"}
            }
        }),

    updateProfilePic: protectedProcedure
        .meta({ openapi: {method: 'PUT', path: '/pushPic'}})
        .input(z.object({newPic: z.string()}))
        .output(z.object({success: z.boolean(), message: z.string()}))
        .mutation(async ({ctx, input}) => {     
            try {
                const buffer = Buffer.from(input.newPic, "base64")
                updateProfile(ctx.session?.userId!, buffer);
                return {success: true, message: "Updated profile pic"};
            } catch (error) {
                return {success: false, message: "Could not update profile pic"}
            }
        }),
    
    updatePronouns: protectedProcedure
        .meta({ openapi: {method: 'PUT', path: '/pushPro'}})
        .input(pronounsSchema)
        .output(z.object({success: z.boolean(), pronouns: z.string(), message: z.string()}))
        .mutation(async ({ctx, input}) => {
            try {
                updatePronouns(ctx.session?.userId!, input.newPronouns);
                return {success: true, pronouns: input.newPronouns, message: "Updated pronouns"};
            } catch (error) {
                return {success: false, pronouns: "", message: "Could not update pronouns"}
            }
        }),

    updateMajor: protectedProcedure
        .meta({ openapi: {method: 'PUT', path: '/pushMajor'}})
        .input(majorSchema)
        .output(z.object({success: z.boolean(), major: z.string(), message: z.string()}))
        .mutation(async ({ctx, input}) => {
            try {
                updateMajor(ctx.session?.userId!, input.newMajor);
                return {success: true, major: input.newMajor, message: "Updated major"};
            } catch (error) {
                return {success: false, major: "", message: "Could not update major"}
            }
        }),            
})
