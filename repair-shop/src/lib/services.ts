export const services = [
  {id:'screen', key:'screen', price:1200, icon:'▣', description:'Cracked glass, display faults, or touch issues.'},
  {id:'battery', key:'battery', price:700, icon:'▰', description:'Short battery life, unexpected shutdowns, or swelling.'},
  {id:'charging', key:'charging', price:500, icon:'ϟ', description:'Loose cable connection or charging port problems.'},
  {id:'water', key:'water', price:500, icon:'◉', description:'Inspection and diagnosis after liquid exposure.'},
  {id:'camera', key:'camera', price:600, icon:'◎', description:'Camera, microphone, speaker, and audio faults.'},
  {id:'software', key:'software', price:400, icon:'⌘', description:'System errors, updates, and performance problems.'}
];

export type SellableService = {
  id: string;
  name: string;
  description: string;
  price: number;
  turnaround: string;
  popular?: boolean;
};

export type SellableProduct = {
  id: string;
  name: string;
  category: string;
  condition: string;
  suggestedPrice: number;
  stock: number;
  popular?: boolean;
};

export type PriceSettings = {
  buybackFactor: number;
  serviceMarkup: number;
  floorOffer: number;
};

export type CatalogState = {
  services: SellableService[];
  products: SellableProduct[];
  priceSettings: PriceSettings;
};

export const defaultServices: SellableService[] = [
  {id:'screen-repair', name:'Screen Repair', description:'Glass or LCD replacement with quality-tested parts.', price:1200, turnaround:'Same day', popular:true},
  {id:'battery-swap', name:'Battery Swap', description:'Battery replacement and health check.', price:760, turnaround:'24 hours'},
  {id:'chip-fix', name:'Board Diagnostics', description:'Expert diagnostics for charging and logic board problems.', price:540, turnaround:'48 hours'},
  {id:'data-recovery', name:'Data Recovery', description:'Secure recovery and backup support for damaged devices.', price:980, turnaround:'2-3 days'}
];

export const defaultProducts: SellableProduct[] = [
  {id:'iphone-13', name:'iPhone 13', category:'Apple', condition:'Good', suggestedPrice:12900, stock:4, popular:true},
  {id:'iphone-12', name:'iPhone 12', category:'Apple', condition:'Good', suggestedPrice:10800, stock:6},
  {id:'s23', name:'Galaxy S23', category:'Samsung', condition:'Very Good', suggestedPrice:11800, stock:5},
  {id:'pixel-8', name:'Pixel 8', category:'Google', condition:'Good', suggestedPrice:9900, stock:3},
  {id:'oneplus-11', name:'OnePlus 11', category:'OnePlus', condition:'Good', suggestedPrice:10500, stock:2}
];

export const defaultPriceSettings: PriceSettings = {
  buybackFactor: 0.18,
  serviceMarkup: 0.22,
  floorOffer: 220
};

export const defaultCatalogState: CatalogState = {
  services: defaultServices,
  products: defaultProducts,
  priceSettings: defaultPriceSettings
};

export const statusLabels: Record<string,string> = {
  REQUESTED:'Booking requested', RECEIVED:'Device received', DIAGNOSING:'Diagnosing problem',
  WAITING_APPROVAL:'Waiting for approval', WAITING_PARTS:'Waiting for parts',
  IN_PROGRESS:'Repair in progress', READY_FOR_PICKUP:'Ready for pickup', COMPLETED:'Completed', CANCELLED:'Cancelled'
};
