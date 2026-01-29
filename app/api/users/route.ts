
import { getUsers } from "@/db/queries";

export async function GET() {
    const users = await getUsers();
    return Response.json(users);
}
