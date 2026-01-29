
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

// Re-init db client here to keep it simple/isolated or import from a shared lib if avail.
// Queries.ts has 'client' not exported.
// Let's just create a quick query here or export 'db' from queries.ts. 
// Ideally export db from queries.ts (or a db.ts).
// Checking queries.ts... it doesn't export 'db'. 
// I will create a dedicated lightweight db connection here for now or update queries.ts.
// Let's update `queries.ts` to export `getUserById`.

import { getUserById } from "@/db/queries";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const user = await getUserById(id);

    if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(user);
}
