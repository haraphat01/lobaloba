"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function AnnouncementBar({ messages, link }: { messages: string[]; link?: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => clearInterval(t);
  }, [messages.length]);

  if (!messages.length) return null;
  const content = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35 }}
        className="block truncate"
      >
        {messages[index]}
      </motion.span>
    </AnimatePresence>
  );

  return (
    <div className="bg-wine text-[0.64rem] tracking-[0.14em] text-ivory uppercase">
      <div className="container-x flex h-8 items-center justify-center text-center sm:h-9">
        {link ? (
          <Link href={link} className="min-w-0 hover:text-gold-light">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
