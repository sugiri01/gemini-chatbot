
import { auth, currentUser } from "@clerk/nextjs/server";
import { getMessages, saveMessage } from "@/db/queries";
import { translateText } from "@/lib/translation";

export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return Response.json("Unauthorized!", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("targetId");

    if (!targetId) {
        return Response.json({ error: "Missing targetId" }, { status: 400 });
    }

    const messages = await getMessages(userId, targetId);
    return Response.json(messages);
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return Response.json("Unauthorized!", { status: 401 });
    }

    const { content, receiverId, targetLang } = await request.json();

    if (!content || !receiverId) {
        return Response.json({ error: "Missing content or receiverId" }, { status: 400 });
    }

    // 1. Translate Message
    let translatedContent = "";
    let englishContent = "";

    if (targetLang) {
        try {
            // Use direct function call instead of fetch to avoid network issues
            const data = await translateText(content, targetLang);

            if (!data.error) {
                translatedContent = data.translated;
                englishContent = data.english;
            } else {
                console.error("Internal translation failed:", data.error);
            }
        } catch (e) {
            console.error("Translation error during message save", e);
        }
    }

    // 2. Save Message
    await saveMessage({
        senderId: userId,
        receiverId,
        content,
        translatedContent,
        englishContent,
        targetLang,
    });

    return Response.json({ success: true });
}
