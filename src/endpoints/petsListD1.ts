import { OpenAPIRoute, Num } from "chanfana";
import { getAuth } from '@hono/clerk-auth'
import { z } from "zod";
import { type AppContext } from "../types";
import { createPrismaD1Client } from "../lib/prisma-d1";

const Pet = z.object({
	id: z.number(),
	name: z.string(),
	breed: z.string(),
	birthday: z.string(),
});

export class PetsListD1 extends OpenAPIRoute {
	schema = {
		tags: ["Pets"],
		summary: "List Pets (D1 with Prisma)",
		request: {
			headers: z.object({
				Authorization: z.string().nullable().describe("Bearer token for authentication"),
			}),
			query: z.object({
				page: Num({
					description: "Page number",
					default: 0,
					required: false,
				}),
				limit: Num({
					description: "Items per page",
					default: 10,
					required: false,
				}),
			}),
		},
		responses: {
			"200": {
				description: "Returns a list of pets using D1 database with Prisma ORM",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							result: z.object({
								pets: Pet.array(),
								page: z.number(),
								total: z.number(),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const auth = getAuth(c);
		console.log('Auth object:', auth);
		console.log('Authenticated user ID:', auth.userId);
		if (!auth.userId) {
			return c.json(
				{
					success: false,
					error: "Unauthorized",
				},
				401
			);
		};

		// Get validated data
		const data = await this.getValidatedData<typeof this.schema>();

		// Retrieve the validated parameters
		const { page: pageParam, limit: limitParam } = data.query;
		const page = pageParam ?? 0;
		const limit = limitParam ?? 10;
		const skip = page * limit;

		// Create Prisma D1 client
		const { prisma, cleanup } = createPrismaD1Client(c);

		const queryStartTime = Date.now();

		try {
			// Query pets with pagination using Prisma
			const [pets, total] = await Promise.all([
				prisma.pet.findMany({
					skip,
					take: limit,
					orderBy: {
						id: "asc",
					},
				}),
				prisma.pet.count(),
			]);

			const queryDuration = Date.now() - queryStartTime;
			console.log(`[D1 Prisma] Query completed in ${queryDuration}ms (page: ${page}, limit: ${limit}, total: ${total})`);

			return {
				success: true,
				result: {
					pets: pets.map((pet) => ({
						id: pet.id,
						name: pet.name,
						breed: pet.breed,
						birthday: pet.birthday.toISOString(),
					})),
					page: page || 0,
					total,
				},
			};
		} catch (error) {
			console.log('Error during D1 Prisma query:', error);
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : "Database error",
				},
				500
			);
		} finally {
			await cleanup();
		}
	}
}
