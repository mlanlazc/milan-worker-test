import { OpenAPIRoute } from "chanfana";
import { getAuth } from '@hono/clerk-auth';
import { z } from "zod";
import { type AppContext } from "../types";

export class AuthCallback extends OpenAPIRoute {
	schema = {
		tags: ["Auth"],
		summary: "Authentication Callback - Get JWT Token",
		description: "Returns a JWT token after successful Clerk authentication. Use this as your redirect_url.",
		responses: {
			"200": {
				description: "Successfully authenticated, returns JWT token",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							token: z.string(),
							userId: z.string(),
							sessionId: z.string().optional(),
						}),
					},
				},
			},
			"401": {
				description: "Unauthorized - authentication failed",
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
		const auth = getAuth(c);

		// Check if user is authenticated
		if (!auth.userId || !auth.sessionId) {
			return c.json(
				{
					success: false,
					error: "Unauthorized - No valid session found",
				},
				401
			);
		}

		try {
			// Get the session token from Clerk
			const token = await auth.getToken();

			if (!token) {
				return c.json(
					{
						success: false,
						error: "Failed to generate token",
					},
					401
				);
			}

			console.log(`[Auth] Token generated for user: ${auth.userId}`);

			return c.json({
				success: true,
				token,
				userId: auth.userId,
				sessionId: auth.sessionId,
			});
		} catch (error) {
			console.error("[Auth] Error generating token:", error);
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : "Failed to generate token",
				},
				500
			);
		}
	}
}
