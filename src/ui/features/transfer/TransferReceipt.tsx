import type { ReactNode } from "react";
import type { Transaction } from "@/domain/models/transaction";
import { formatMoney } from "@/domain/rules/money";
import { Card } from "@/ui/components/Card/Card";
import { focusOnMount } from "@/ui/utils/focusOnMount";
import { formatDateTime } from "@/ui/utils/format";
import { ACCOUNT_TYPE_LABEL } from "./accountTypes";
import { SummaryRow } from "./SummaryRow";

type TransferReceiptProps = {
  transaction: Transaction;
  actions: ReactNode;
};

export function TransferReceipt({ transaction, actions }: TransferReceiptProps) {
  const { recipient } = transaction;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-success/10 text-2xl font-bold text-success"
        >
          ✓
        </span>
        <h1 ref={focusOnMount} tabIndex={-1} className="text-xl font-bold text-foreground focus:outline-none">
          Transferencia enviada
        </h1>
      </div>
      <Card>
        <dl className="flex flex-col">
          <div className="flex flex-col items-center gap-1 pb-4 text-center">
            <dt className="text-sm text-muted-foreground">Monto enviado</dt>
            <dd className="text-3xl font-bold tracking-tight text-foreground tabular-nums sm:text-4xl">
              {formatMoney(transaction.amountCents)}
            </dd>
          </div>
          <div className="divide-y divide-border border-t border-border">
            <SummaryRow term="Para">{recipient.name}</SummaryRow>
            <SummaryRow term="Banco">{recipient.bank}</SummaryRow>
            <SummaryRow term="Cuenta">
              {ACCOUNT_TYPE_LABEL[recipient.accountType]} {recipient.maskedAccount}
            </SummaryRow>
            <SummaryRow term="Concepto">{transaction.concept}</SummaryRow>
            <SummaryRow term="Folio">
              <span className="tabular-nums">{transaction.reference}</span>
            </SummaryRow>
            <SummaryRow term="Fecha y hora">{formatDateTime(transaction.createdAt)}</SummaryRow>
            <SummaryRow term="Saldo disponible">
              <span className="tabular-nums">{formatMoney(transaction.balanceAfterCents)}</span>
            </SummaryRow>
          </div>
        </dl>
      </Card>
      {actions}
    </div>
  );
}
