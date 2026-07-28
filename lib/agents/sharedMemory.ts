const memory: any[] = [];

export function addMemory(entry: any) {
  const exists = memory.find(
    (m) =>
      m.agent === entry.agent &&
      m.type === entry.type &&
      m.message === entry.message
  );

  if (exists) return;

  memory.unshift(entry);

  if (memory.length > 50) {
    memory.pop();
  }
}

export function getMemory() {
  return memory;
}