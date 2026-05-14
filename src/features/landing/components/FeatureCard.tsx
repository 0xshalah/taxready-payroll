import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  index?: number;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
  index = 0,
}: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{
        duration: 0.5,
        delay: index * 0.12,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      whileHover={{
        y: -4,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
      className={cn(
        "rounded-lg border border-hairline bg-canvas p-8 transition-colors",
        className
      )}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-canvas-soft text-ink">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-medium tracking-tight text-ink">
        {title}
      </h3>
      <p className="text-base leading-relaxed text-ink-mute">{description}</p>
    </motion.div>
  );
}
