import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { Client } from "pg";

const Pet = z.object({
	id: z.number(),
	name: z.string(),
	breed: z.string(),
	birthday: z.string(),
});

export class PetsList extends OpenAPIRoute {
	schema = {
		tags: ["Pets"],
		summary: "List Pets",
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
				description: "Returns a list of pets",
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
		const offset = page * limit;

		// Connect to database using Hyperdrive
		const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });

		try {
			await client.connect();

			// Query pets with pagination
			const queryStartTime = Date.now();
			const result = await client.query(
				`SELECT id, name, breed, birthday
				 FROM pets
				 ORDER BY id
				 LIMIT $1 OFFSET $2`,
				[limit, offset]
			);

			// Get total count
			const countResult = await client.query(`SELECT COUNT(*) as total FROM pets`);
			const total = parseInt(countResult.rows[0].total);
			const queryEndTime = Date.now();
			const queryDuration = queryEndTime - queryStartTime;

			console.log(`[Raw SQL] Query completed in ${queryDuration}ms (page: ${page}, limit: ${limit}, total: ${total})`);

			return {
				success: true,
				result: {
					pets: result.rows.map((row) => ({
						id: row.id,
						name: row.name,
						breed: row.breed,
						birthday: row.birthday,
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
			await client.end();
		}
	}
}
