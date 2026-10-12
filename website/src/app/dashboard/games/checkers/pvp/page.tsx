import CheckersPvPArena from "@/components/checkers/CheckersPvPArena";
import CheckersNavbar from "@/components/checkers/CheckersNavbar";
import AppFooter from "@/components/app/AppFooter";

export default function PvPPage() {
  return (
    <div className="min-h-screen bg-[#03060d] text-white flex flex-col justify-between">
      <CheckersNavbar />
      <main className="flex-1 w-full pb-16">
        <CheckersPvPArena />
      </main>
      <AppFooter />
    </div>
  );
}
