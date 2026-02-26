const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasUserIdentity = (value) => {
  if (!isObject(value)) return false;
  const identity = value._id || value.id || value.userId;
  if (typeof identity === "string") {
    return identity.trim().length > 0;
  }
  return Boolean(identity);
};

export const extractAuthUser = (payload) => {
  if (!isObject(payload)) return null;

  const candidates = [
    payload,
    payload.user,
    payload.data,
    payload.data?.user,
    payload.result,
    payload.result?.user,
  ];

  for (const candidate of candidates) {
    if (hasUserIdentity(candidate)) {
      return candidate;
    }
  }

  return null;
};
