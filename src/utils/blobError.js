const parseTextPayload = (value = "") => {
  const text = String(value || "").trim();
  if (!text) return "";

  try {
    const parsed = JSON.parse(text);
    return parsed?.message || parsed?.error || text;
  } catch {
    // If API/proxy returned raw HTML/text, avoid surfacing noisy markup.
    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      return "";
    }
    return text;
  }
};

export const getAxiosErrorMessage = async (error, fallbackMessage) => {
  const fallback = String(fallbackMessage || "Request failed");
  const response = error?.response;
  const data = response?.data;

  if (!data) {
    return error?.message || fallback;
  }

  if (typeof data === "string") {
    return parseTextPayload(data) || error?.message || fallback;
  }

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      const text = await data.text();
      return parseTextPayload(text) || error?.message || fallback;
    } catch {
      return error?.message || fallback;
    }
  }

  if (typeof data === "object") {
    return data?.message || data?.error || error?.message || fallback;
  }

  return error?.message || fallback;
};

