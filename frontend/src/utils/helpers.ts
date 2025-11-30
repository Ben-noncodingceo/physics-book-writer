// Utility helper functions

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const buildOutlineTree = <T extends { id: string; parentId: string | null }>(
  items: T[]
): T[] => {
  const itemMap = new Map<string, T & { children?: T[] }>();
  const roots: (T & { children?: T[] })[] = [];

  // Create a map of all items
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Build the tree
  items.forEach((item) => {
    const node = itemMap.get(item.id)!;
    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children!.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
};
