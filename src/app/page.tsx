import { ModulesGrid } from "@/components/ModulesGrid";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center relative">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path className="liquid-path" d="M 400 300 Q 450 350, 400 400"></path>
        <path className="liquid-path" d="M 820 300 Q 870 350, 820 400"></path>
        <circle cx="410" cy="350" fill="var(--nvidia-green)" r="4"></circle>
        <circle cx="830" cy="350" fill="var(--nvidia-green)" r="4"></circle>
      </svg>
      <ModulesGrid />
    </div>
  );
}
