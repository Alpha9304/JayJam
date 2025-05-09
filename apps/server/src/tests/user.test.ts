import fs from 'fs';
import { test, expect } from '@playwright/test';
import {getCreatedAt, getEmail, getHashId, getMajor, getName, getProfilePic, getPronouns, getSisLink, getUpdatedAt, getVerified, updateHashId, updateMajor, updateName, updatePassword, updateProfile, updatePronouns} from '../scripts/user'
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

let userId: number

let initBlob: Buffer;
let afterBlob: Buffer;

test.beforeAll(async () => {
    initBlob = fs.readFileSync('../server/src/tests/test_data/initial.jpg');
    afterBlob = fs.readFileSync('../server/src/tests/test_data/after.jpg');
    fs.unlink('../server/src/tests/test_data/initialConverted.jpg', () => {})
    fs.unlink('../server/src/tests/test_data/afterConverted.jpg', () => {})
    await db
        .delete(users)
        .where(eq(users.email, "test@jh.edu"))

})

test.beforeEach(async () => {
    await db
        .delete(users)
        .where(eq(users.email, "test@jh.edu"))

    const [user] = await db
        .insert(users)
        .values({
            name: "test",
            email: "test@jh.edu",
            password: "12345",
            hashId: 'test',
            sisLink: "test",
            createdAt: new Date(0),
            updatedAt: new Date(0),
            verified: false,
            profilePic: initBlob,
            pronouns: "he/him",
            major: "Computer Science"
        }).returning()
    
    userId = user.id
        
})

test.afterEach(async () => {
    await db
        .delete(users)
        .where(eq(users.id, userId))
})

test.afterAll(async () => {
    
    await db
        .delete(users)
        .where(eq(users.email, "test@jh.edu"))
})

//updateName tests
test('ensure name differs after updating name', async () => {  
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    initial && expect(initial.name).toEqual("test")

    await updateName(userId, "changed");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    updated && expect(updated.name).toEqual("changed");
})

test('ensure updatedAt differs after updating name', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    await updateName(userId, "changed");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.updatedAt.getTime()).toBeGreaterThan(initial.updatedAt.getTime());

})

test('ensure createdAt does not differ after updating name', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    await updateName(userId, "changed");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.createdAt.getTime()).toEqual(initial.createdAt.getTime());
})

//updateHashId tests
test('ensure hashId differs after updating hashId', async () => {  
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    initial && expect(initial.hashId).toEqual("test")

    await updateHashId(userId, "changed");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    updated && expect(updated.hashId).toEqual("changed");
})

test('ensure updatedAt differs after updating hashId', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    await updateHashId(userId, "changed");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.updatedAt.getTime()).toBeGreaterThan(initial.updatedAt.getTime());

})

test('ensure createdAt does not differ after updating hashId', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    await updateHashId(userId, "changed");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.createdAt.getTime()).toEqual(initial.createdAt.getTime());
})

//updatePassword tests
test('ensure password differs after updating password', async () => {  
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    initial && expect(initial.password).toEqual("12345")

    await updatePassword(userId, "54321");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    updated && expect(updated.password).toEqual("54321");
})

test('ensure updatedAt differs after updating password', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    await updatePassword(userId, "54321");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.updatedAt.getTime()).toBeGreaterThan(initial.updatedAt.getTime());

})

test('ensure createdAt does not differ after updating password', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    await updatePassword(userId, "54321");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.createdAt.getTime()).toEqual(initial.createdAt.getTime());
})


//updateProfile tests
test('ensure profilePic differs after updating profile', async () => {  
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    initial && initBlob && expect(initial.profilePic).toEqual(initBlob)

    afterBlob && updateProfile(userId, afterBlob);

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    updated && afterBlob && expect(updated.profilePic).toEqual(afterBlob) ;

    afterBlob && fs.writeFileSync('../server/src/tests/test_data/afterConverted.jpg', afterBlob)
    initial && fs.writeFileSync('../server/src/tests/test_data/initialConverted.jpg', <Buffer>initial.profilePic)
})

test('ensure updatedAt differs after updating profile', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    afterBlob && await updateProfile(userId, afterBlob);

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && afterBlob && expect(updated.updatedAt.getTime()).toBeGreaterThan(initial.updatedAt.getTime());

})

test('ensure createdAt does not differ after updating profile', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    afterBlob && await updateProfile(userId, afterBlob);

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && afterBlob && expect(updated.createdAt.getTime()).toEqual(initial.createdAt.getTime());
})

//updatePronouns tests
test('ensure pronouns differ after updating pronouns', async () => {  
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    initial && expect(initial.pronouns).toEqual("he/him")

    await updatePronouns(userId, "she/her");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    updated && expect(updated.pronouns).toEqual("she/her");
})

test('ensure updatedAt differs after updating pronouns', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    afterBlob && await updatePronouns(userId, "she/her");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.updatedAt.getTime()).toBeGreaterThan(initial.updatedAt.getTime());

})

test('ensure createdAt does not differ after updating pronouns', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    afterBlob && await updatePronouns(userId, "she/her");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.createdAt.getTime()).toEqual(initial.createdAt.getTime());
})

//updateMajor tests
test('ensure major differs after updating major', async () => {  
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    initial && expect(initial.major).toEqual("Computer Science")

    await updateMajor(userId, "Chemistry");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    updated && expect(updated.major).toEqual("Chemistry");
})

test('ensure updatedAt differs after updating major', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    afterBlob && await updateMajor(userId, "Chemistry");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.updatedAt.getTime()).toBeGreaterThan(initial.updatedAt.getTime());

})

test('ensure createdAt does not differ after updating major', async () => {
    const [initial] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

    afterBlob && await updateMajor(userId, "Chemistry");

    const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
    
    updated && expect(updated.createdAt.getTime()).toEqual(initial.createdAt.getTime());
})

//getters Tests

test('ensure getName works', async () => {
    expect(await getName(userId)).toEqual("test")
})

test('ensure getEmail works', async () => {
    expect(await getEmail(userId)).toEqual("test@jh.edu")
})

test('ensure getHashId works', async () => {
    expect(await getHashId(userId)).toEqual("test")
})

test('ensure getCreatedAt works', async () => {
    expect(await getCreatedAt(userId)).toEqual(new Date(0))
})

test('ensure getUpdatedAt works', async () => {
    expect(await getUpdatedAt(userId)).toEqual(new Date(0))
})

test('ensure getSisLink works', async () => {
    expect(await getSisLink(userId)).toEqual("test")
})

test('ensure getVerified works', async () => {
    expect(await getVerified(userId)).toEqual(false)
})

test('ensure getProfilePic works', async () => {
    expect(await getProfilePic(userId)).toEqual(initBlob)
})

test('ensure getPronouns works', async () => {
    expect(await getPronouns(userId)).toEqual("he/him")
})

test('ensure getMajor works', async () => {
    expect(await getMajor(userId)).toEqual("Computer Science")
})