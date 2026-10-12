import CheckersPracticeEngine from "@/components/checkers/CheckersPracticeEngine";
import CheckersNavbar from "@/components/checkers/CheckersNavbar";
import AppFooter from "@/components/app/AppFooter";

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-[#03060d] text-white flex flex-col justify-between">
      <CheckersNavbar />
      <main className="flex-1 w-full pb-16">
        <CheckersPracticeEngine />
      </main>
      <AppFooter />
    </div>
  );
}
