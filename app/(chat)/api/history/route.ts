import { auth, currentUser } from "@clerk/nextjs/server";
import { getChatsByUserId, saveUser } from "@/db/queries";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  // Sync user presence
  try {
    const user = await currentUser();
    if (user) {
      const email = user.emailAddresses[0]?.emailAddress || "unknown";
      await saveUser({ id: userId, email });
    }
  } catch (error) {
    console.error("Failed to sync user:", error);
    // Continue even if sync fails
  }

  const chats = await getChatsByUserId({ id: userId });
  return Response.json(chats);
}
