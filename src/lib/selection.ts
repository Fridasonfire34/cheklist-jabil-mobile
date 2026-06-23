let lastSelectedPart: string | null = null;

export function setLastSelectedPart(p: string) {
  lastSelectedPart = p;
}

export function getLastSelectedPart() {
  return lastSelectedPart;
}
