import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

// Initialize the SQLite database and export the connection
export const connection = new Database("sqlite.db");

// Create the database and export it
export const db = drizzle(connection, { schema });
