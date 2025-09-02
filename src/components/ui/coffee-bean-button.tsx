
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CoffeeBeanButtonProps {
  isLiked?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  likeCount?: number;
}

export default function CoffeeBeanButton({
  isLiked = false,
  onClick,
  className,
  size = "md",
  likeCount = 0
}: CoffeeBeanButtonProps) {
  const [showSteam, setShowSteam] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setShowSteam(true);
    setTimeout(() => setShowSteam(false), 1500);
    setTimeout(() => setIsClicked(false), 200);
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
        "relative p-2 rounded-lg transition-all duration-200",
        "hover:scale-110 active:scale-95 group",
        isLiked 
          ? "hover:bg-amber-50 text-amber-700" 
          : "hover:bg-neutral-50 text-neutral-500",
        isClicked && "animate-pulse",
        className
      )}
    >
      <div className="relative">
        {/* Coffee Bean SVG - More realistic bean shape */}
        <svg
          viewBox="0 0 24 24"
          className={cn(
            sizeClasses[size],
            "transition-all duration-500 ease-out",
            isLiked ? "drop-shadow-lg" : "",
            "group-hover:rotate-12 group-active:rotate-0"
          )}
          fill="none"
        >
          {/* Bean Main Body - Realistic coffee bean shape */}
          <path
            d="M12 4c-3.5 0-6.5 2.5-7 6-.3 2.2.5 4.2 2 5.5 1.2 1 2.8 1.5 4.5 1.5h1c1.7 0 3.3-.5 4.5-1.5 1.5-1.3 2.3-3.3 2-5.5-.5-3.5-3.5-6-7-6z"
            className={cn(
              "transition-all duration-500",
              isLiked 
                ? "fill-amber-800 stroke-amber-900" 
                : "fill-none stroke-current"
            )}
            strokeWidth="1.5"
          />
          
          {/* Bean Center Crack - The distinctive coffee bean line */}
          <path
            d="M12 7c-1.5 1.2-1.8 2.8-1 4.5.8 1.7 2.2 2.8 1 4.5"
            className={cn(
              "transition-all duration-500",
              isLiked 
                ? "stroke-amber-600" 
                : "stroke-current opacity-60"
            )}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          
          {/* Bean Highlight - Adds depth and roasted look */}
          <ellipse
            cx="9.5"
            cy="8.5"
            rx="1.5"
            ry="2"
            className={cn(
              "transition-all duration-700 delay-200",
              isLiked 
                ? "fill-amber-500 opacity-30" 
                : "fill-none"
            )}
          />
          
          {/* Secondary highlight for extra depth */}
          <circle
            cx="10.5"
            cy="9"
            r="0.8"
            className={cn(
              "transition-all duration-700 delay-300",
              isLiked 
                ? "fill-amber-400 opacity-20" 
                : "fill-none"
            )}
          />
        </svg>

        {/* Enhanced Steam Animation */}
        {showSteam && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 pointer-events-none">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="absolute opacity-0"
                style={{
                  left: `${(index - 1) * 3}px`,
                  animationDelay: `${index * 150}ms`,
                  animationDuration: "1.5s",
                  animationFillMode: "forwards",
                  animationName: "steam-rise",
                  animationTimingFunction: "ease-out"
                }}
              >
                <div 
                  className="w-0.5 h-4 bg-gradient-to-t from-neutral-400 via-neutral-300 to-transparent rounded-full"
                  style={{
                    transform: `rotate(${(index - 1) * 8}deg)`
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Floating hearts for extra delight */}
        {isLiked && showSteam && (
          <div className="absolute -top-1 -right-1 pointer-events-none">
            <div 
              className="text-xs opacity-0"
              style={{
                animationName: "float-heart",
                animationDuration: "1s",
                animationFillMode: "forwards",
                animationDelay: "0.3s"
              }}
            >
              ☕
            </div>
          </div>
        )}
      </div>

      {/* Like count display */}
      {likeCount > 0 && (
        <span className={cn(
          "absolute -top-1 -right-1 text-xs font-medium px-1.5 py-0.5 rounded-full",
          "bg-amber-100 text-amber-700 border border-amber-200",
          "transition-all duration-300",
          isLiked && "bg-amber-200 border-amber-300"
        )}>
          {likeCount}
        </span>
      )}

      <style jsx>{`
        @keyframes steam-rise {
          0% {
            opacity: 0;
            transform: translateY(0px) scale(1) rotate(0deg);
          }
          20% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.6;
            transform: translateY(-8px) scale(0.9) rotate(5deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-16px) scale(0.7) rotate(15deg);
          }
        }

        @keyframes float-heart {
          0% {
            opacity: 0;
            transform: translateY(0px) scale(0.8);
          }
          30% {
            opacity: 1;
            transform: translateY(-4px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-12px) scale(0.6);
          }
        }
      `}</style>
    </button>
  );
}
