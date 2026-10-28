const DEFAULT_REQUEST_TIMEOUT_MS = 4000;

const configuredTimeout = Number(process.env.NEXT_PUBLIC_TIMEOUT_MS);

export const REQUEST_TIMEOUT_MS =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : DEFAULT_REQUEST_TIMEOUT_MS;
