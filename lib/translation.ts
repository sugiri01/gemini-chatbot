
import { spawn } from "child_process";
import path from "path";

export async function translateText(text: string, targetLang: string): Promise<any> {
    return new Promise((resolve) => {
        const scriptPath = path.join(process.cwd(), "scripts", "translate.py");
        // Use venv Python which has googletrans installed
        const pythonPath = path.join(process.cwd(), ".venv", "bin", "python3");
        const pythonProcess = spawn(pythonPath, [scriptPath], {
            env: { ...process.env, PYTHONIOENCODING: "utf-8" }
        });

        let stdoutData = "";
        let stderrData = "";

        pythonProcess.stdout.on("data", (data) => {
            stdoutData += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            stderrData += data.toString();
        });

        pythonProcess.on("close", (code) => {
            if (code !== 0) {
                console.warn(`Translation process exited with code ${code}`);
                console.warn("Stderr:", stderrData);
            }

            try {
                if (!stdoutData.trim()) {
                    resolve({ error: "Empty output from translation script" });
                    return;
                }
                const result = JSON.parse(stdoutData);
                resolve(result);
            } catch (e) {
                console.error("Failed to parse output:", stdoutData);
                resolve({ error: "Invalid JSON output from translation script" });
            }
        });

        pythonProcess.on("error", (err) => {
            console.error("Failed to start python process:", err);
            resolve({ error: "Failed to spawn translation process" });
        });

        // Write input to stdin
        const inputJson = JSON.stringify({ text, target: targetLang });
        pythonProcess.stdin.write(inputJson);
        pythonProcess.stdin.end();
    });
}
