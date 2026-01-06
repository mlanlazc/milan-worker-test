import { OpenAPIRoute, Str, Num } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { Client } from "pg";

const PetUpdateInput = z.object({
	name: Str({ example: "Buddy", required: false }),
	breed: Str({ example: "Golden Retriever", required: false }),
	birthday: Str({ example: "2020-01-15", required: false }),
});

const Pet = z.object({
	id: z.number(),
	name: z.string(),
	breed: z.string(),
	birthday: z.string(),
});

export class PetUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Pets"],
		summary: "Update a Pet",
		request: {
			params: z.object({
				id: Num({ example: 1 }),
			}),
			body: {
				content: {
					"application/json": {
						schema: PetUpdateInput,
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Pet updated successfully",
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
		const updateData = data.body;

		// Build dynamic update query based on provided fields
		const updates: string[] = [];
		const values: any[] = [];
		let paramCount = 1;

		if (updateData.name !== undefined) {
			updates.push(`name = $${paramCount++}`);
			values.push(updateData.name);
		}
		if (updateData.breed !== undefined) {
			updates.push(`breed = $${paramCount++}`);
			values.push(updateData.breed);
		}
		if (updateData.birthday !== undefined) {
			updates.push(`birthday = $${paramCount++}`);
			values.push(updateData.birthday);
		}

		if (updates.length === 0) {
			return c.json(
				{
					success: false,
					error: "No fields to update",
				},
				400
			);
		}

		// Connect to database using Hyperdrive
		const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });

		try {
			await client.connect();

			// Update pet
			values.push(id);
			const result = await client.query(
				`UPDATE pets
				 SET ${updates.join(", ")}
				 WHERE id = $${paramCount}
				 RETURNING id, name, breed, birthday`,
				values
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
				result: {
					pet: result.rows[0],
				},
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
