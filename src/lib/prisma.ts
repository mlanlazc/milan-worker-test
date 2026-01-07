import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import type { AppContext } from "../types";

/**
 * Creates a Prisma client instance connected to the database via Hyperdrive
 * @param c - The Hono context containing environment bindings
 * @returns An object containing the Prisma client and cleanup function
 */
export function createPrismaClient(c: AppContext) {
	// Create connection pool using Hyperdrive connection string
	const pool = new Pool({ connectionString: c.env.HYPERDRIVE.connectionString });
	const adapter = new PrismaPg(pool);
	const prisma = new PrismaClient({ adapter });

	// Return both the client and a cleanup function
	return {
		prisma,
		async cleanup() {
			await prisma.$disconnect();
			await pool.end();
		},
	};
}
