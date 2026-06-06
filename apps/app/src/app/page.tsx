import { PushToTalk } from "@/components/push-to-talk";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-12 py-32 px-16">
        <h1 className="text-2xl font-semibold tracking-tight">Halketon</h1>
        <PushToTalk />
      </main>
    </div>
  );
}
