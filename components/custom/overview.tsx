import { motion } from "framer-motion";
import Link from "next/link";

import { LogoGoogle, MessageIcon, VercelIcon } from "./icons";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-[500px] mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border-none bg-muted/50 rounded-2xl p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
        <p>
          OMPOI-Indic Chatbot (Rewritten Text)
        </p>
        <p>
          OMPOI-Indic Chatbot is an AI assistant built for Indic language
          conversations and business workflows inside the OMPOI ecosystem. It
          helps users generate content, answer queries, and support
          domain-specific tasks with fast, reliable responses.
        </p>
        <p>
          This chatbot is powered by Google Gemini and runs on a Next.js
          interface for a smooth real-time chat experience.
        </p>
        <p>
          Use it to explore ideas, get explanations, generate structured
          outputs, and interact in a natural conversational way—especially for
          India-first multilingual use cases.
        </p>
      </div>
    </motion.div>
  );
};
