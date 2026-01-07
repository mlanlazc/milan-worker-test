import { PrismaClient } from "../../prisma/generated/client-d1";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { AppContext } from "../types";

/**
 * Creates a Prisma client instance connected to the D1 database
 * @param c - The Hono context containing environment bindings
 * @returns An object containing the Prisma client and cleanup function
 */
export function createPrismaD1Client(c: AppContext) {
	// Create D1 adapter using the D1 database binding
	const adapter = new PrismaD1(c.env.MILAN_DB_TEST_URL);
	const prisma = new PrismaClient({ adapter });

	// Return both the client and a cleanup function
	return {
		prisma,
		async cleanup() {
			await prisma.$disconnect();
		},
	};
}
