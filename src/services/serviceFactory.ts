/**
 * Service Factory Pattern
 * Provides a consistent way to instantiate and configure services
 * Prevents module resolution issues in production builds
 */

interface ServiceConfig {
  retryAttempts: number;
  timeoutMs: number;
  baseUrl: string;
}

interface ServiceDependencies {
  authClient: any;
  logger: any;
  errorHandler: any;
}

class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();
  private config: ServiceConfig;
  private dependencies: ServiceDependencies;

  private constructor() {
    this.config = {
      retryAttempts: 3,
      timeoutMs: 30000,
      baseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://aumijfxmeclxweojrefa.supabase.co'
    };
  }

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  public configure(config: Partial<ServiceConfig>, dependencies: Partial<ServiceDependencies>) {
    this.config = { ...this.config, ...config };
    this.dependencies = { ...this.dependencies, ...dependencies };
  }

  public getResearchService() {
    if (!this.services.has('research')) {
      // Lazy load and cache the service
      import('../services/research/researchService').then(module => {
        const service = module.researchService || module.default;
        if (service) {
          this.services.set('research', service);
        }
      });
    }
    return this.services.get('research');
  }

  public async waitForService(serviceName: string, maxWaitMs: number = 5000): Promise<any> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkService = () => {
        const service = this.services.get(serviceName);
        if (service) {
          resolve(service);
          return;
        }
        
        if (Date.now() - startTime > maxWaitMs) {
          reject(new Error(`Service ${serviceName} not available after ${maxWaitMs}ms`));
          return;
        }
        
        setTimeout(checkService, 100);
      };
      
      checkService();
    });
  }

  public isServiceReady(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  public preloadServices(): Promise<void[]> {
    const services = [
      this.getResearchService(),
    ];

    return Promise.all(services.map(service => 
      service ? Promise.resolve() : Promise.reject(new Error('Service not available'))
    ));
  }
}

export const serviceFactory = ServiceFactory.getInstance();
export default serviceFactory;