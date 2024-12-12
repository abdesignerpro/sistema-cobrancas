// Date utility functions for consistent date handling

export const parseDate = (dateString: string): Date => {
  // Se a data estiver no formato DD/MM/YYYY
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    // Ajusta para meio-dia para evitar problemas com timezone
    date.setHours(12, 0, 0, 0);
    return date;
  }
  
  // Se a data estiver no formato YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date;
};

export const formatDateBR = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatForInput = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (date: Date | string, days: number): Date => {
  const d = typeof date === 'string' ? parseDate(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};