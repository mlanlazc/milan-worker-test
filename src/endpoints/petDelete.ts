import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { Client } from "pg";

export class PetDelete extends OpenAPIRoute {
	schema = {
		tags: ["Pets"],
		summary: "Delete a Pet",
		request: {
			params: z.object({
				id: Num({ example: 1 }),
			}),
		},
		responses: {
			"200": {
				description: "Pet deleted successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							message: z.string(),
						}),
					},
				},
			},
			"404": {
				description: "Pet not found",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							error: z.string(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		// Get validated data
		const data = await this.getValidatedData<typeof this.schema>();
		const { id } = data.params;

		// Connect to database using Hyperdrive
		const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });

		try {
			await client.connect();

			// Delete pet
			const result = await client.query(
				`DELETE FROM pets
				 WHERE id = $1
				 RETURNING id`,
				[id]
			);

			if (result.rows.length === 0) {
				return c.json(
					{
						success: false,
						error: "Pet not found",
					},
					404
				);
			}

			return c.json({
				success: true,
				message: `Pet with id ${id} deleted successfully`,
			});
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
