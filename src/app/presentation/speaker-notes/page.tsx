import Link from "next/link";
import { ArrowLeft, Mic, AlertTriangle } from "lucide-react";
import { PITCH_SLIDES, JUDGE_QUESTIONS, LIVE_DEMO_SCRIPT, DEMO_LINKS } from "@/lib/presentation/content";

import { BRAND } from "@/lib/constants/brand";

export const metadata = {
  title: `Speaker Notes — ${BRAND.nameEn} Pitch`,
};

export default function SpeakerNotesPage() {
  const visibleSlides = PITCH_SLIDES.filter((s) => !s.hidden);

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#101828]">
      <header className="sticky top-0 z-10 bg-[#071A33] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/presentation" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            Back to Deck
          </Link>
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-[#C8A45D]" />
            <h1 className="font-bold">Speaker Notes — Hackathon Pitch</h1>
          </div>
        </div>
        <p className="text-xs text-white/50 hidden md:block font-arabic">خياطك · 15 slides + Q&A</p>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-12">
        {/* Key messages */}
        <section className="rounded-2xl border border-[#C8A45D]/30 bg-[#C8A45D]/10 p-6">
          <h2 className="font-bold text-[#071A33] mb-4">Key Messages</h2>
          <ul className="space-y-2 font-arabic text-lg leading-relaxed">
            <li>• نحن لا نستبدل الخياط، نحن نمكّنه.</li>
            <li>• خياطك يحول الخياطة من عملية يدوية متفرقة إلى تجربة رقمية ذكية.</li>
            <li>• من أول قياس إلى آخر غرزة... كل شيء أذكى.</li>
          </ul>
        </section>

        {/* Live demo script */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-[#0F7654]">Live Demo Script</span>
          </h2>
          <p className="font-arabic text-lg font-medium mb-4 text-[#0F7654]">&quot;{LIVE_DEMO_SCRIPT.opening}&quot;</p>
          <ol className="space-y-4">
            {LIVE_DEMO_SCRIPT.steps.map((step, i) => (
              <li key={i} className="rounded-xl border bg-white p-4">
                <p className="font-arabic font-medium mb-1">{step.say}</p>
                {step.action && <p className="text-sm text-[#101828]/50 font-mono">{step.action}</p>}
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm font-arabic text-amber-900">
              <strong>قاعدة ذهبية:</strong> لا تعرض ميزة غير شغالة. قل: &quot;هذه ضمن المرحلة القادمة.&quot;
            </p>
          </div>
        </section>

        {/* Demo links */}
        <section>
          <h2 className="text-xl font-bold mb-4">Demo Links</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {DEMO_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border bg-white px-4 py-3 text-sm hover:border-[#0F7654] transition-colors"
              >
                <span className="text-[#C8A45D] font-bold mr-2">{link.step}.</span>
                {link.label_ar}
              </Link>
            ))}
          </div>
        </section>

        {/* Per-slide notes */}
        {visibleSlides.map((slide) => (
          <section key={slide.id} id={`slide-${slide.index}`} className="scroll-mt-24">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-[#C8A45D]/40">{slide.label}</span>
              <h2 className="text-xl font-bold capitalize">{slide.type.replace(/-/g, " ")}</h2>
            </div>

            <div className="rounded-2xl border bg-white overflow-hidden">
              <div className="bg-[#071A33] text-white px-5 py-3">
                <p className="text-xs text-[#C8A45D] uppercase tracking-wider mb-1">Opening</p>
                <p className="font-arabic text-lg">&quot;{slide.notes.opening}&quot;</p>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-xs text-[#101828]/50 uppercase tracking-wider">Main Points</p>
                <ul className="space-y-2 font-arabic leading-relaxed">
                  {slide.notes.main.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-[#0F7654]">—</span>
                      {line}
                    </li>
                  ))}
                </ul>
                {slide.notes.transition && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-[#101828]/50 uppercase tracking-wider mb-1">Transition</p>
                    <p className="font-arabic text-[#0F7654]">{slide.notes.transition}</p>
                  </div>
                )}
                {slide.notes.demoCue && (
                  <p className="text-xs font-mono text-[#101828]/40 bg-[#F5F0E7] rounded-lg px-3 py-2">
                    {slide.notes.demoCue}
                  </p>
                )}
                {slide.notes.judgeTip && (
                  <p className="text-sm font-arabic text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                    💡 {slide.notes.judgeTip}
                  </p>
                )}
              </div>
            </div>
          </section>
        ))}

        {/* Judge Q&A */}
        <section className="pb-16">
          <h2 className="text-2xl font-bold mb-6">Judge Questions — Prepared Answers</h2>
          <p className="text-sm text-[#101828]/60 mb-6">
            Hidden slide in deck — press <kbd className="px-1.5 py-0.5 rounded bg-white border text-xs">?</kbd> during presentation.
          </p>
          <div className="space-y-4">
            {JUDGE_QUESTIONS.map((q) => (
              <div key={q.question_ar} className="rounded-xl border bg-white p-5">
                <p className="font-bold font-arabic text-[#0F7654] mb-1">{q.question_ar}</p>
                <p className="text-xs text-[#101828]/40 mb-3">{q.question_en}</p>
                <p className="font-arabic text-sm leading-relaxed">{q.answer_ar}</p>
                <p className="text-xs text-[#101828]/50 mt-2 leading-relaxed">{q.answer_en}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
