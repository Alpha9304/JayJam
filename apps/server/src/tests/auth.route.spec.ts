import { test, expect } from '@playwright/test';
import { appRouter } from '../router/app';
import { Context, createCallerFactory } from '../lib/trpc';
import { initTRPC } from '@trpc/server';
import { db } from '../db';
import { users, verificationCode } from '../db/schema';
import { eq } from 'drizzle-orm';
import { UserSession } from '../lib/auth/session';


const t = initTRPC.context<Context>().create(); //create the context

const createCaller = createCallerFactory(appRouter); //used to create callers of procedures on that route

const TESTER_EMAIL = ""; //change this to whoever is testing right now

//Verification code tests
test('Send the verfication code to the user is successful', async ({ request }) => {

    const user = await db.insert(users).values({
        name: "Tester",
        email: TESTER_EMAIL,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    const userId = user.id;

    const session: UserSession = {
        sessionId: "1",
        userId: userId,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session })

    const result = await caller.auth.sendVerificationCode({
        placeholder: "" 
    });

    expect(result.success).toBeTruthy();

    //clean up
    await db.delete(users).where(eq(users.id, user.id));
});


test('Ensure verification code check is successful when the user enters the right code', async ({ browser, request }) => {
    const user = await db.insert(users).values({
        name: "Tester",
        email: TESTER_EMAIL,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    const userId = user.id;

    const session: UserSession = {
        sessionId: "1",
        userId: userId,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    };

    const caller = createCaller({
        session
    })

    const codeResult = await caller.auth.sendVerificationCode({
        placeholder: ""
    })
    
    const result = await caller.auth.verifyVerificationCode({code: codeResult.code});

    expect(result.success).toBeTruthy();
    
    //clean up
    await db.delete(users).where(eq(users.id, user.id));
});

test('Ensure verify code check throws error when it does not match from user', async ({ request }) => {
    const session: UserSession = {
        sessionId: "1",
        userId: 1,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    };
    const caller = createCaller({
        session
    })

    await expect(caller.auth.verifyVerificationCode({code: ""})).rejects.toThrow();
});

test('Ensure verify code check throws error when it is expired', async ({ request }) => {
    
    // Set an expired verification code in the DB
    const expiredDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    const user = await db.insert(users).values({
        name: "Tester",
        email: TESTER_EMAIL,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    await db
            .delete(verificationCode)
            .where(eq(verificationCode.code, "123456"));

    await db.insert(verificationCode).values({
        userId: user.id,
        code: "123456", // Example code
        expiresAt: Number(expiredDate),
    });

    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    };

    const caller = createCaller({ session });

    await expect(caller.auth.verifyVerificationCode({code: "123456"})).rejects.toThrow();

    //clean up
    await db.delete(verificationCode).where(eq(verificationCode.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
});

//Validate session tests
test('Ensure validate session valdiates a session that exists', async({request}) => {
    const session: UserSession = {
        sessionId: "1",
        userId: 1,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    };

    const caller = createCaller({ session });

    const result = await caller.auth.validateSession({placeholder: ""});

    await expect(result.success).toBeTruthy();
})

test('Ensure validate session invaldiates a non-existent session', async({request}) => {


    const caller = createCaller({ });

    const result = await caller.auth.validateSession({placeholder: ""});

    await expect(result.success).toBeFalsy();
})


//Password reset tests
test('Send the reset code to the user', async ({ request }) => {

    const caller = createCaller({ })

    const user = await db.insert(users).values({
        name: "Tester",
        email: TESTER_EMAIL,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    const result = await caller.auth.sendResetCode({
        email: TESTER_EMAIL
    });

    expect(result.success).toBeTruthy();

    //clean up
    await db.delete(users).where(eq(users.id, user.id));
}); 


test('Ensure reset code check is successful when the user enters the right code', async ({ browser, request }) => {
    //await browser.browserType().launch({slowMo: 30000}) //slow down the launch of the browser to be appropriate, otherwise the test speed will surpass the email send speed, still broken

    const caller = createCaller({ })

    

    const user = await db.insert(users).values({
        name: "Tester",
        email: TESTER_EMAIL,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    const codeResult = await caller.auth.sendResetCode({
        email: TESTER_EMAIL
    })
    
    const result = await caller.auth.verifyResetCode({code: codeResult.code, email: TESTER_EMAIL});

    expect(result.success).toBeTruthy();


    //clean up
    await db.delete(users).where(eq(users.id, user.id));
});

test('Ensure reset code check throws error when it does not match from user', async ({ request }) => {

    const caller = createCaller({})

    const user = await db.insert(users).values({
        name: "Tester",
        email: TESTER_EMAIL,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    await expect(caller.auth.verifyResetCode({code: "", email: TESTER_EMAIL})).rejects.toThrow();

    //clean up
    await db.delete(users).where(eq(users.id, user.id));
});




test('Ensure reset code check throws error when it is expired', async ({ request }) => {
    
    // Set an expired verification code in the DB
    const expiredDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    await db
            .delete(verificationCode)
            .where(eq(verificationCode.code, "123456"));

    await db.delete(users).where(eq(users.email, TESTER_EMAIL)); //do this if necessary

    const user = await db.insert(users).values({
        name: "Tester",
        email: TESTER_EMAIL,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    await db.insert(verificationCode).values({
        userId: user.id,
        code: "123456", // Example code
        expiresAt: Number(expiredDate),
    });



    const caller = createCaller({});

    await expect(caller.auth.verifyResetCode({code: "123456", email: TESTER_EMAIL})).rejects.toThrow();

    //clean up
    await db.delete(verificationCode).where(eq(verificationCode.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
}); 


test('Ensure reset password works', async ({ request }) => {
    
    await db.delete(users).where(eq(users.email, TESTER_EMAIL)); //do this if necessary
    
    const user = await db.insert(users).values({
        name: "Tester",
        email: TESTER_EMAIL,
        password: "Tester-Password!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();


    const caller = createCaller({});

    const result = await caller.auth.resetPassword({email: TESTER_EMAIL, password: "New-Password1!", confirm: "New-Password1!"})

    expect(result.success).toBeTruthy();

    //clean up
    await db.delete(users).where(eq(users.id, user.id));
});

