
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save temp file
    const filename = `${randomUUID()}.wav`; // Whisper handles wav/mp3/webm usually using ffmpeg
    const tempDir = path.join(process.cwd(), "public", "temp");
    // Ensure dir exists? For now assume public exists, let's put in root temp or just public. 
    // Next.js public folder is good for serving, but we just need it for python to read.
    const tempPath = path.join(process.cwd(), filename);

    try {
        await writeFile(tempPath, buffer);

        const scriptPath = path.join(process.cwd(), "scripts", "voice.py");
        // python voice.py stt "filepath"
        // Use python3 on Linux, rely on system PATH for ffmpeg
        const isWindows = process.platform === "win32";
        const pythonCommand = isWindows ? "python" : "python3";

        // On Windows use local path, on Linux use system path (empty prefix)
        const FFMPEG_PATH = isWindows ? "H:\\2024 Downloads\\ffmpeg-8.0.1-essentials_build\\bin" : "";

        const envWithFfmpeg = {
            ...process.env,
            // Only prepend if we have a specific path, otherwise rely on system PATH
            PATH: FFMPEG_PATH ? `${FFMPEG_PATH}${path.delimiter}${process.env.PATH || ""}` : process.env.PATH,
            PYTHONIOENCODING: "utf-8"
        };

        const { stdout, stderr } = await execAsync(`${pythonCommand} "${scriptPath}" stt "${tempPath}"`, {
            env: envWithFfmpeg
        });

        // Cleanup
        await unlink(tempPath);

        try {
            const result = JSON.parse(stdout);
            if (result.error) {
                console.error("Whisper error:", result.error);
                return Response.json({ error: result.error }, { status: 500 });
            }
            return Response.json({ text: result.text });
        } catch (e) {
            console.error("Parse error:", stdout);
            return Response.json({ error: "Failed to parse STT output" }, { status: 500 });
        }

    } catch (error) {
        console.error("STT Error:", error);
        // Try cleanup
        try { await unlink(tempPath); } catch { }
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
