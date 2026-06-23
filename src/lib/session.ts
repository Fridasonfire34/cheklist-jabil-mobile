let currentUserId: string | null = null;

export function setSession(userId: string) {
  currentUserId = userId;
}

export function getSession(): string | null {
  return currentUserId;
}

export function clearSession() {
  currentUserId = null;
}
