import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { Client } from "pg";

const PetInput = z.object({
	name: Str({ example: "Buddy" }),
	breed: Str({ example: "Golden Retriever" }),
	birthday: Str({ example: "2020-01-15" }),
});

const Pet = z.object({
	id: z.number(),
	name: z.string(),
	breed: z.string(),
	birthday: z.string(),
});

export class PetCreate extends OpenAPIRoute {
	schema = {
		tags: ["Pets"],
		summary: "Create a new Pet",
		request: {
			body: {
				content: {
					"application/json": {
						schema: PetInput,
					},
				},
			},
		},
		responses: {
			"201": {
				description: "Pet created successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							result: z.object({
								pet: Pet,
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
		const { name, breed, birthday } = data.body;

		// Connect to database using Hyperdrive
		const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });

		try {
			await client.connect();

			// Insert new pet
			const result = await client.query(
				`INSERT INTO pets (name, breed, birthday)
				 VALUES ($1, $2, $3)
				 RETURNING id, name, breed, birthday`,
				[name, breed, birthday]
			);

			return c.json(
				{
					success: true,
					result: {
						pet: result.rows[0],
					},
				},
				201
			);
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
