export default function Highlights() {
  const items = [
    { title: "Personalized Questions", desc: "Tailored from your JD/resume to mimic real recruiter patterns." },
    { title: "Custom Timers", desc: "Focused MCQ sprints up to 60 minutes with palette navigation." },
    { title: "Actionable Feedback", desc: "Scores for clarity, correctness, confidence + concrete tips." },
  ];
  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it) => (
            <div
              key={it.title}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/50 p-6 backdrop-blur transition shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{it.title}</h3>
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}