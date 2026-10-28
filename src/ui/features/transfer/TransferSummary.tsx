import type { ReactNode } from "react";
import type { Contact } from "@/domain/models/contact";
import { formatMoney } from "@/domain/rules/money";
import { Card } from "@/ui/components/Card/Card";
import { ACCOUNT_TYPE_LABEL } from "./accountTypes";

type TransferSummaryProps = {
  amountCents: number;
  contact: Contact;
  concept: string;
  balanceCents: number;
  actions: ReactNode;
};

function SummaryRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="min-w-0 text-right font-medium break-words text-foreground">{children}</dd>
    </div>
  );
}

export function TransferSummary({
  amountCents,
  contact,
  concept,
  balanceCents,
  actions,
}: TransferSummaryProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">Revisa tu transferencia</h1>
      <Card className="flex flex-col gap-4">
        <dl className="flex flex-col">
          <div className="flex flex-col gap-1 pb-4">
            <dt className="text-sm text-muted-foreground">Monto a enviar</dt>
            <dd className="text-3xl font-bold tracking-tight text-foreground tabular-nums sm:text-4xl">
              {formatMoney(amountCents)}
            </dd>
          </div>
          <div className="divide-y divide-border border-t border-border">
            <SummaryRow term="Para">{contact.name}</SummaryRow>
            <SummaryRow term="Banco">{contact.bank}</SummaryRow>
            <SummaryRow term="Cuenta">
              {ACCOUNT_TYPE_LABEL[contact.accountType]} {contact.maskedAccount}
            </SummaryRow>
            <SummaryRow term="Concepto">{concept || "Sin concepto"}</SummaryRow>
            <SummaryRow term="Saldo disponible">
              <span className="tabular-nums">{formatMoney(balanceCents)}</span>
            </SummaryRow>
            <SummaryRow term="Saldo después de la transferencia">
              <span className="tabular-nums">{formatMoney(balanceCents - amountCents)}</span>
            </SummaryRow>
          </div>
        </dl>
      </Card>
      {actions}
    </div>
  );
}
