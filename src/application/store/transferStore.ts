import { create } from "zustand";
import type { PendingTransfer } from "@/application/http/sendTransfer";
import type { Contact } from "@/domain/models/contact";
import { isRetryableOutcome, type TransferOutcome } from "@/domain/models/transaction";
import { normalizeConcept } from "@/domain/rules/transfer";

export type TransferReview = {
  amountCents: number;
  contact: Contact;
  concept: string;
  balanceCents: number;
  idempotencyKey: string;
};

type ReviewRequest = Omit<TransferReview, "idempotencyKey">;

// `pending` solo sobrevive a un resultado reintentable (red o timeout): es lo único que "Reintentar" reenvía.
export type TransferSubmission =
  | { phase: "processing"; pending: PendingTransfer }
  | { phase: "done"; outcome: TransferOutcome; pending: PendingTransfer | null };

type TransferDraftState = {
  amountInput: string;
  contact: Contact | null;
  concept: string;
  review: TransferReview | null;
};

type TransferState = TransferDraftState & { submission: TransferSubmission | null };

type TransferStore = TransferState & {
  setAmountInput: (amountInput: string) => void;
  selectContact: (contact: Contact) => void;
  setConcept: (concept: string) => void;
  prepareReview: (request: ReviewRequest) => TransferReview;
  beginSubmission: (pending: PendingTransfer) => void;
  completeSubmission: (idempotencyKey: string, outcome: TransferOutcome) => void;
  reset: () => void;
};

const EMPTY_DRAFT: TransferDraftState = {
  amountInput: "",
  contact: null,
  concept: "",
  review: null,
};

const INITIAL_STATE: TransferState = { ...EMPTY_DRAFT, submission: null };

function isSameIntent(review: TransferReview, next: ReviewRequest): boolean {
  return (
    review.amountCents === next.amountCents &&
    review.contact.id === next.contact.id &&
    review.concept === next.concept
  );
}

export const useTransferStore = create<TransferStore>()((set, get) => ({
  ...INITIAL_STATE,

  setAmountInput: (amountInput) => set({ amountInput }),
  selectContact: (contact) => set({ contact }),
  setConcept: (concept) => set({ concept }),

  prepareReview: (request) => {
    const next = { ...request, concept: normalizeConcept(request.concept) };
    const previous = get().review;
    // Misma intención, misma clave: así un reintento nunca se cobra dos veces.
    const idempotencyKey =
      previous && isSameIntent(previous, next) ? previous.idempotencyKey : crypto.randomUUID();
    const review = { ...next, idempotencyKey };
    // Un flujo nuevo descarta el resultado anterior; un envío aún en curso se conserva hasta que responda.
    const submission = get().submission?.phase === "processing" ? get().submission : null;
    set({ review, submission });
    return review;
  },

  // El borrador se descarta al confirmar: "Atrás" ya no encuentra un resumen que reenviar.
  beginSubmission: (pending) => set({ ...EMPTY_DRAFT, submission: { phase: "processing", pending } }),

  completeSubmission: (idempotencyKey, outcome) => {
    const current = get().submission;
    // Una respuesta tardía de un envío que ya no está en curso no debe pisar el estado actual.
    if (current?.phase !== "processing" || current.pending.idempotencyKey !== idempotencyKey) return;
    set({
      submission: {
        phase: "done",
        outcome,
        pending: isRetryableOutcome(outcome.status) ? current.pending : null,
      },
    });
  },

  reset: () => set(INITIAL_STATE),
}));

export function resetTransferDraft() {
  useTransferStore.getState().reset();
}
