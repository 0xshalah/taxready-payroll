import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function FloatingBadge({ children, className }: FloatingBadgeProps) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-4 py-2 text-sm text-ink-mute shadow-sm",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
