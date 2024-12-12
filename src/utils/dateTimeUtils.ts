export const parseDateTime = (date: string, time: string): string => {
  const [day, month, year] = date.split('/');
  const [hours, minutes] = time.split(':');
  
  // Cria a data no formato ISO
  const dateTime = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );

  return dateTime.toISOString();
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

export const formatDateTimeForDisplay = formatDateTime;

export const getTimeFromDate = (date: string): string => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '00:00';
    }
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Erro ao obter hora:', error);
    return '00:00';
  }
};

export const getDateFromDateTime = (date: string): string => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return 'Data inválida';
    }
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao obter data:', error);
    return 'Data inválida';
  }
};
