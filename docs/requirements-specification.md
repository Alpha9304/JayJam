# Software Requirement Specification

## Problem Statement

Study groups are beneficial to students, but students often aren’t familiar with people in their classes enough to form groups. Or in cases where online class groups exist, they are hard to find or underutilized, and they don’t have features specific to studying. Difficulty in finding a time and location that works for everyone can hinder the formation of study groups as well.

## Proposed Solution

- Our app will address this issue by creating a centralized platform where students can join groups for their classes, upload their schedules (SIS calendar and Google calendar), and automatically set up group study sessions. 
- Each student is required to input their SIS iCal link (https://uisdxp.sis.jhu.edu/api/course/calendar/:userId) to sync their course schedule and automatically join the classes they are in. 
- Our app will automatically show a list of the availability of all students based on their schedules.
- Students can create study events with predetermined times and locations, and other students can opt-in to the event. There will also be a limit to the number of students that can join to prevent crowding. 

## Potential Clients

- Our platform’s potential users are JHU students who want to streamline their group study formation process and/or meet peers through forming new groups.
  
## Functional Requirements

### Must-Have

#### Auth:

- As a student, I want to authenticate using my JHU email (not using the JHU login, just checking that it is @jhu.edu), so that my information is protected, and I know that I will only be interacting with other JHU students. 
- As a student, I want to receive a confirmation email to the JHU email I provide, so that I verify that I’m a JHU student. 
- As a student, I want to be able to input my SIS iCal link (https://uisdxp.sis.jhu.edu/api/course/calendar/:userId), so that I can automatically join groups with other students in my classes. 
- As a student, I want to be able to logout, so that I can safely use my account on public devices. 

#### User preferences:

- As a student, I want to customize my profile with a name, picture, and other information so that other students can identify me.

#### Calendar:

- As a student, I would like the app to automatically connect to Google calendar and pull my availability into the scheduling calendar, so that I don’t have to look at my calendar while entering my availability. 
- As a student, I want the platform to consider my availability based on my calendar and suggest meeting times, so I can easily select a time that works for me.

#### Classes:
- As a student, I want to be able to enter the SIS calendar link so that I will be automatically added into groups for classes I am in.
- As a student, I want to be able to freely leave a class group, so that I can adjust to changes in my class schedule. 

#### Study events:
- As a student, I want to be able to propose a study time and location, so other students can opt-in to attend.
- As a student, I want to be able to limit the number of other students that can sign up, so that booked study rooms can fit everyone.
- As a student, after a study time has been finalized, I want to be able to suggest and have people vote on a meet up location, so we know where to meet.
- As a student, I want to be able to leave events, so that I can opt-out if I double booked.


### Nice-to-Have

#### Calendar+:
- As a student, I want a personalized calendar in the app that I can edit, so that any events I add or remove automatically update my availability. 

#### Messages:

- As a student, I want to be able to send messages within a group, so that I can communicate with others in my class.
- As a student, I want to be able to delete my messages within a group, so that unintended messages don’t remain in the group.
- As a student, I want to be able to edit my messages, so that I can correct myself without deleting the entire message.
- As a student, I want to be able to see real-time message updates, so that I can communicate with my classmates without delay.
- As a student, I want to be able to search messages within a group, so that I can easily recall information.

#### Visual:

- As a student, I want to be able to toggle between light and dark mode, so that I can match my viewing preference.


## Software Architecture & Technology Stack

- Frontend: TailwindCSS, REACT (TypeScript)
- Backend: ExpressJS, DrizzleORM
- Database: SQLite, DrizzleORM
- Server: NodeJS
- DevOps: Docker

## Similar Existing Apps

- Calendly (set meetings, connect to calendars, share meetings, align availability)
- When2Meet (find available meeting times)
- GroupMe (group chats and messaging)
