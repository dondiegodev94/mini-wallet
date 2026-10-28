import { create } from "zustand";
import type { Contact } from "@/domain/models/contact";
import { normalizeConcept } from "@/domain/rules/transfer";

export type TransferReview = {
  amountCents: number;
  contact: Contact;
  concept: string;
  balanceCents: number;
  idempotencyKey: string;
};

type ReviewRequest = Omit<TransferReview, "idempotencyKey">;

type TransferDraftState = {
  amountInput: string;
  contact: Contact | null;
  concept: string;
  review: TransferReview | null;
};

type TransferStore = TransferDraftState & {
  setAmountInput: (amountInput: string) => void;
  selectContact: (contact: Contact) => void;
  setConcept: (concept: string) => void;
  prepareReview: (request: ReviewRequest) => TransferReview;
  reset: () => void;
};

const INITIAL_DRAFT: TransferDraftState = {
  amountInput: "",
  contact: null,
  concept: "",
  review: null,
};

function isSameIntent(review: TransferReview, next: ReviewRequest): boolean {
  return (
    review.amountCents === next.amountCents &&
    review.contact.id === next.contact.id &&
    review.concept === next.concept
  );
}

export const useTransferStore = create<TransferStore>()((set, get) => ({
  ...INITIAL_DRAFT,

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
    set({ review });
    return review;
  },

  reset: () => set(INITIAL_DRAFT),
}));

export function resetTransferDraft() {
  useTransferStore.getState().reset();
}
