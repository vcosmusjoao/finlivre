import { UploadButton } from "@/components/UploadButton";
import { VisionImportButton } from "@/components/VisionImportButton";
import { SampleButton } from "@/components/SampleButton";
import { SummaryCards } from "@/components/SummaryCards";
import { ManualEntryForm } from "@/components/ManualEntryForm";
import { MonthSelector } from "@/components/MonthSelector";
import { ClearDataButton } from "@/components/ClearDataButton";
import { AccountsManager } from "@/components/AccountsManager";
import { RecurringItemsManager } from "@/components/RecurringItemsManager";
import { DashboardBody } from "@/components/DashboardBody";
import { InvoiceCards } from "@/components/InvoiceCards";
import { ExportButton } from "@/components/ExportButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-8">

        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">FinLivre</h1>
            <p className="text-zinc-400 text-xs">enfim livre.</p>
          </div>
          <div className="flex items-center gap-3">
            <ClearDataButton />
            <ExportButton />
            <AccountsManager />
            <RecurringItemsManager />
          </div>
        </header>

        <MonthSelector />
        <SummaryCards />
        <InvoiceCards />

        <div className="flex items-start gap-3 mb-6">
          <ManualEntryForm />
          <UploadButton />
          <VisionImportButton />
          <SampleButton />
        </div>

        <DashboardBody />

      </div>
    </main>
  );
}
