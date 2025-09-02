
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CoffeeBeanButtonProps {
  isLiked?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function CoffeeBeanButton({
  isLiked = false,
  onClick,
  className,
  size = "md"
}: CoffeeBeanButtonProps) {
  const [showSteam, setShowSteam] = useState(false);

  const handleClick = () => {
    setShowSteam(true);
    setTimeout(() => setShowSteam(false), 1200);
    onClick?.();
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95",
        isLiked 
          ? "hover:bg-amber-50 text-amber-700" 
          : "hover:bg-neutral-50 text-gray-400",
        className
      )}
    >
      <div className="relative">
        {/* Coffee Bean SVG */}
        <svg
          viewBox="0 0 24 24"
          className={cn(
            sizeClasses[size],
            "transition-all duration-300",
            isLiked ? "drop-shadow-sm" : ""
          )}
          fill="none"
        >
          {/* Bean Shadow/Outline */}
          <path
            d="M12 3c4.5 0 8 3.5 8 8s-3.5 8-8 8-8-3.5-8-8 3.5-8 8-8z"
            className={cn(
              "transition-all duration-300",
              isLiked 
                ? "fill-amber-800 stroke-amber-900" 
                : "fill-none stroke-current"
            )}
            strokeWidth="1.5"
          />
          
          {/* Bean Center Line */}
          <path
            d="M12 6c-2 2-2 4 0 6s2 4 0 6"
            className={cn(
              "transition-all duration-300",
              isLiked 
                ? "stroke-amber-600" 
                : "stroke-current opacity-60"
            )}
            strokeWidth="1"
            strokeLinecap="round"
          />
          
          {/* Inner Bean Highlight */}
          <ellipse
            cx="10"
            cy="8"
            rx="2"
            ry="1"
            className={cn(
              "transition-all duration-500 delay-100",
              isLiked 
                ? "fill-amber-400 opacity-40" 
                : "fill-none"
            )}
          />
        </svg>

        {/* Steam Animation */}
        {showSteam && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 pointer-events-none">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={cn(
                  "absolute w-0.5 h-3 bg-gradient-to-t from-gray-300 to-transparent rounded-full",
                  "animate-pulse opacity-0"
                )}
                style={{
                  left: `${(index - 1) * 4}px`,
                  animationDelay: `${index * 200}ms`,
                  animationDuration: "1s",
                  animationFillMode: "forwards",
                  animationName: "steam-rise"
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes steam-rise {
          0% {
            opacity: 0;
            transform: translateY(0px) scale(1);
          }
          20% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-12px) scale(0.8);
          }
        }
      `}</style>
    </button>
  );
}
