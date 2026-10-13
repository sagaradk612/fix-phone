import {prisma} from '@/lib/prisma';

export type RepairServiceItem = {
  id: string;
  key: string;
  name: string;
  translationKey?: string | null;
  price: number;
  icon: string;
  description: string;
  termsAndConditions?: string;
  turnaround: string;
  active: boolean;
};

export const defaultServices: RepairServiceItem[] = [
  {id:'screen', key:'screen', name:'Screen repair', translationKey:'screen', price:1200, icon:'▣', description:'Cracked glass, display faults, or touch issues.', termsAndConditions:'The device will be inspected before repair. The selected screen quality and warranty will be confirmed before repair.', turnaround:'48 hours', active:true},
  {id:'battery', key:'battery', name:'Battery replacement', translationKey:'battery', price:700, icon:'▰', description:'Short battery life, unexpected shutdowns, or swelling.', termsAndConditions:'Battery health and charging behavior will be checked after installation.', turnaround:'24-48 hours', active:true},
  {id:'charging', key:'charging', name:'Charging port repair', translationKey:'charging', price:500, icon:'ϟ', description:'Loose cable connection or charging port problems.', termsAndConditions:'The charging port and circuit will be tested. Board-level damage is quoted separately.', turnaround:'24 hours', active:true},
  {id:'water', key:'water', name:'Water damage check', translationKey:'water', price:500, icon:'◉', description:'Inspection and diagnosis after liquid exposure.', termsAndConditions:'Recovery is not guaranteed. The inspection fee is due even if repair is declined; additional repairs require approval after diagnosis.', turnaround:'48 hours', active:true},
  {id:'camera', key:'camera', name:'Camera & audio repair', translationKey:'camera', price:600, icon:'◎', description:'Camera, microphone, speaker, and audio faults.', termsAndConditions:'Camera, microphone, and speaker functions will be tested before and after repair. Additional faults require approval.', turnaround:'48 hours', active:true},
  {id:'software', key:'software', name:'Software fix', translationKey:'software', price:400, icon:'⌘', description:'System errors, updates, and performance problems.', termsAndConditions:'Back up your data before service. Software work may require a reset; data recovery is not included unless agreed separately.', turnaround:'24 hours', active:true},
];

export async function getRepairServices(): Promise<RepairServiceItem[]> {
  try {
    const services = await prisma.repairService.findMany({
      where: {active: true},
      orderBy: {createdAt: 'asc'},
    });

    if (services.length > 0) {
      return services.map(service => ({
        ...service,
        id: service.id,
        key: service.key,
        name: service.name,
        translationKey: service.translationKey,
        price: Number(service.price),
        icon: service.icon || '✦',
        turnaround: service.turnaround || '48 hours',
        active: service.active,
      }));
    }
  } catch (error) {
    console.error('Could not load repair services from the database. Falling back to defaults.', error);
  }

  return defaultServices;
}

export const statusLabels: Record<string,string> = {
  REQUESTED:'Booking requested', RECEIVED:'Device received', DIAGNOSING:'Diagnosing problem',
  WAITING_APPROVAL:'Waiting for approval', WAITING_PARTS:'Waiting for parts',
  IN_PROGRESS:'Repair in progress', READY_FOR_PICKUP:'Ready for pickup', COMPLETED:'Completed', CANCELLED:'Cancelled'
};
