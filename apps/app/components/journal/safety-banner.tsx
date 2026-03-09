import { AlertTriangle, Phone } from "lucide-react";

export function SafetyBanner() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            If you or someone you know is in crisis
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>988 Suicide &amp; Crisis Lifeline</strong> — Call or
                text{" "}
                <a href="tel:988" className="font-bold underline">
                  988
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Crisis Text Line</strong> — Text{" "}
                <span className="font-bold">HOME</span> to{" "}
                <a href="sms:741741" className="font-bold underline">
                  741741
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
