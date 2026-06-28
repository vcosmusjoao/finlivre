import { UploadButton } from "@/components/UploadButton";
import { TransactionsTable } from "@/components/TransactionsTable";
import { SpendingChart } from "@/components/SpendingChart";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-8">

        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">FinLivre</h1>
            <p className="text-zinc-400 text-xs">enfim livre.</p>
          </div>
          <UploadButton />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 self-start">Gastos por categoria</h2>
            <SpendingChart />
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Transações</h2>
            <TransactionsTable />
          </div>
        </div>

      </div>
    </main>
  );
}
