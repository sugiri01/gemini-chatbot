
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";

const execAsync = promisify(exec);

export async function POST(request: Request) {
    const { text, lang } = await request.json();

    if (!text) {
        return Response.json({ error: "No text provided" }, { status: 400 });
    }

    // Ensure public/voice exists
    const voiceDir = path.join(process.cwd(), "public", "voice");
    try {
        await mkdir(voiceDir, { recursive: true });
    } catch { }

    const filename = `${randomUUID()}.mp3`;
    const filePath = path.join(voiceDir, filename);
    const scriptPath = path.join(process.cwd(), "scripts", "voice.py");

    try {
        // python voice.py tts "text" "lang" "filepath"
        // Escape quote for cmd line
        // Use python3 on Linux
        const isWindows = process.platform === "win32";
        const pythonCommand = isWindows ? "python" : "python3";

        const safeText = text.replace(/"/g, '\\"');
        const command = `${pythonCommand} "${scriptPath}" tts "${safeText}" "${lang || 'en'}" "${filePath}"`;

        const FFMPEG_PATH = isWindows ? "H:\\2024 Downloads\\ffmpeg-8.0.1-essentials_build\\bin" : "";

        const envWithFfmpeg = {
            ...process.env,
            PATH: FFMPEG_PATH ? `${FFMPEG_PATH}${path.delimiter}${process.env.PATH || ""}` : process.env.PATH,
            PYTHONIOENCODING: "utf-8"
        };

        const { stdout, stderr } = await execAsync(command, {
            env: envWithFfmpeg
        });

        try {
            const result = JSON.parse(stdout);
            if (result.error) {
                return Response.json({ error: result.error }, { status: 500 });
            }

            // Return public URL
            return Response.json({
                audioUrl: `/voice/${filename}`,
                success: true
            });

        } catch (e) {
            console.error("Parse error:", stdout);
            return Response.json({ error: "Failed to parse TTS output" }, { status: 500 });
        }

    } catch (error) {
        console.error("TTS Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
