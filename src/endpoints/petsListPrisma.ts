import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const Pet = z.object({
	id: z.number(),
	name: z.string(),
	breed: z.string(),
	birthday: z.string(),
});

export class PetsListPrisma extends OpenAPIRoute {
	schema = {
		tags: ["Pets"],
		summary: "List Pets (Prisma)",
		request: {
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
				description: "Returns a list of pets using Prisma ORM",
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
		// Get validated data
		const data = await this.getValidatedData<typeof this.schema>();

		// Retrieve the validated parameters
		const { page: pageParam, limit: limitParam } = data.query;
		const page = pageParam ?? 0;
		const limit = limitParam ?? 10;
		const skip = page * limit;

		// Create connection pool using Hyperdrive connection string
		const pool = new Pool({ connectionString: c.env.HYPERDRIVE.connectionString });
		const adapter = new PrismaPg(pool);
		const prisma = new PrismaClient({ adapter });

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
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : "Database error",
				},
				500
			);
		} finally {
			await prisma.$disconnect();
			await pool.end();
		}
	}
}
