
import { translateText } from "@/lib/translation";

export async function POST(request: Request) {
    try {
        const { text, target } = await request.json();

        if (!text || !target) {
            return Response.json({ error: "Missing text or target" }, { status: 400 });
        }

        const result = await translateText(text, target);

        if (result.error) {
            return Response.json({ error: result.error }, { status: 500 });
        }

        return Response.json(result);

    } catch (error) {
        console.error("Translation API Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
