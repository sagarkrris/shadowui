const TRANSIENT_CODES = new Set(["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"]);
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function getErrorText(error) {
  return String(error?.message || error || "");
}

function shouldRetrySameModel(error) {
  return Number(error?.status) !== 429;
}

export function isTransientGeminiError(error) {
  if (TRANSIENT_CODES.has(error?.code)) return true;
  if (TRANSIENT_STATUSES.has(Number(error?.status))) return true;

  return /fetch|network|timeout|temporar|unavailable|overloaded|rate limit/i.test(getErrorText(error));
}

export function isUnavailableGeminiModelError(error) {
  const status = Number(error?.status);
  return (status === 400 || status === 404) && /model|not found|not supported|not available/i.test(getErrorText(error));
}

export function getGeminiErrorStatus(error) {
  const status = Number(error?.status);
  if (status === 429) return 429;
  if (status >= 400 && status < 500) return status;
  return 502;
}

export async function withGeminiRetry(operation, { retries = 2, delayMs = 300 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= retries || !isTransientGeminiError(error) || !shouldRetrySameModel(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}

export async function withGeminiModelFallback(modelNames = [], operation, options = {}) {
  const {
    onFallback = (details) => console.warn("Gemini model failed; trying fallback model", details),
    ...retryOptions
  } = options;
  let lastError;

  for (const modelName of modelNames.filter(Boolean)) {
    try {
      const result = await withGeminiRetry(() => operation(modelName), retryOptions);
      return { modelName, result };
    } catch (error) {
      lastError = error;

      if (!isTransientGeminiError(error) && !isUnavailableGeminiModelError(error)) {
        throw error;
      }

      onFallback?.({
        modelName,
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
  }

  throw lastError || new Error("No Gemini models available");
}
