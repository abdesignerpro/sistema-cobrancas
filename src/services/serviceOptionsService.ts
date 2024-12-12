const SERVICES_KEY = '@sistema-cobrancas/services';

export interface ServiceOption {
  id: string;
  name: string;
}

export const serviceOptionsService = {
  getServices: (): ServiceOption[] => {
    const savedServices = localStorage.getItem(SERVICES_KEY);
    return savedServices ? JSON.parse(savedServices) : [];
  },

  addService: (serviceName: string): ServiceOption[] => {
    const services = serviceOptionsService.getServices();
    
    // Verifica se o serviço já existe
    if (!services.some(service => service.name.toLowerCase() === serviceName.toLowerCase())) {
      services.push({
        id: Date.now().toString(),
        name: serviceName
      });
      localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
    }
    
    return services;
  },

  removeService: (serviceId: string): ServiceOption[] => {
    const services = serviceOptionsService.getServices();
    const updatedServices = services.filter(service => service.id !== serviceId);
    localStorage.setItem(SERVICES_KEY, JSON.stringify(updatedServices));
    return updatedServices;
  }
};
