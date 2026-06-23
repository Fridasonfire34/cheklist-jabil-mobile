const store = new Map<string, string>();

export async function setItem(key: string, value: string) {
  store.set(key, value);
}

export async function getItem(key: string) {
  return store.has(key) ? (store.get(key) as string) : null;
}

export async function removeItem(key: string) {
  store.delete(key);
}

export default { setItem, getItem, removeItem };
