import { fromHono } from "chanfana";
import { Hono } from "hono";
import { PetsList } from "./endpoints/petsList";
import { PetsListPrisma } from "./endpoints/petsListPrisma";
import { PetsListD1 } from "./endpoints/petsListD1";
import { PetCreate } from "./endpoints/petCreate";
import { PetUpdate } from "./endpoints/petUpdate";
import { PetDelete } from "./endpoints/petDelete";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/api/pets", PetsList);
openapi.get("/api/pets-prisma", PetsListPrisma);
openapi.get("/api/pets-d1", PetsListD1);
openapi.post("/api/pets", PetCreate);
openapi.put("/api/pets/:id", PetUpdate);
openapi.delete("/api/pets/:id", PetDelete);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
