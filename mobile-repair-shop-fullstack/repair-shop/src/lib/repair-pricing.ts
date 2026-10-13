import {prisma} from '@/lib/prisma';

const starterModels = [
  {model: 'Apple iPhone 15', multiplier: 1.25},
  {model: 'Apple iPhone 14', multiplier: 1.1},
  {model: 'Apple iPhone 13', multiplier: 1},
  {model: 'Samsung Galaxy S24', multiplier: 1.2},
  {model: 'Samsung Galaxy S23', multiplier: 1.05},
  {model: 'Google Pixel 8', multiplier: 1.1},
  {model: 'Xiaomi Redmi Note 13', multiplier: 0.8},
];

const starterServices = [
  {key: 'screen', name: 'Screen repair', description: 'Cracked glass, display faults, or touch issues.', terms: 'The device will be inspected before repair. Water-damaged frames or bent housings may require additional work. The selected screen quality and its warranty will be confirmed before repair.', basePrice: 4200, qualities: [{name: 'Standard', multiplier: 0.65}, {name: 'Premium', multiplier: 1}, {name: 'Original', multiplier: 1.6}]},
  {key: 'battery', name: 'Battery replacement', description: 'Short battery life, unexpected shutdowns, or swelling.', terms: 'Battery health and charging behavior will be checked after installation. A swollen battery may require additional inspection.', basePrice: 1600, qualities: [{name: 'Compatible', multiplier: 0.75}, {name: 'Original', multiplier: 1}]},
  {key: 'charging', name: 'Charging port repair', description: 'Loose cable connection or charging port problems.', terms: 'The port and charging circuit will be tested. Board-level damage or liquid corrosion is quoted separately.', basePrice: 1400, qualities: [{name: 'Standard', multiplier: 0.8}, {name: 'Original', multiplier: 1.2}]},
  {key: 'water', name: 'Water damage repair', description: 'Inspection and repair after liquid exposure.', terms: 'Liquid-damaged devices are not guaranteed to be recoverable. The inspection fee is due even if repair is declined. Parts and any additional repair work require approval after diagnosis.', basePrice: 900, qualities: [{name: 'Diagnosis', multiplier: 1}]},
  {key: 'camera', name: 'Camera & audio repair', description: 'Camera, microphone, speaker, and audio faults.', terms: 'Camera, microphone, and speaker functions will be tested before and after repair. Additional faults discovered during inspection require approval.', basePrice: 2200, qualities: [{name: 'Standard', multiplier: 0.9}, {name: 'Original', multiplier: 1.2}]},
  {key: 'software', name: 'Software repair', description: 'System errors, updates, and performance problems.', terms: 'Please back up your data before service. Software work may require a reset; data recovery is not included unless separately agreed.', basePrice: 700, qualities: [{name: 'Standard', multiplier: 1}]},
];

export async function ensureStarterRepairCatalog() {
  const existingServices = await prisma.repairService.findMany({select: {id: true, key: true}});
  const seedDefaultServices = existingServices.length === 0;
  const serviceIds = new Map(existingServices.map(service => [service.key, service.id]));
  for (const item of starterServices) {
    if (serviceIds.has(item.key) || !seedDefaultServices) continue;
    const service = await prisma.repairService.upsert({
      where: {key: item.key},
      update: {},
      create: {
        key: item.key,
        name: item.name,
        description: item.description,
        termsAndConditions: item.terms,
        price: item.basePrice,
        translationKey: item.key,
        turnaround: item.key === 'battery' || item.key === 'software' ? '24-48 hours' : '48 hours',
      },
    });
    serviceIds.set(item.key, service.id);
  }

  const variants = starterModels.flatMap(({model, multiplier}) => starterServices.flatMap(service => {
    const serviceId = serviceIds.get(service.key);
    if (!serviceId) return [];
    return service.qualities.map(quality => ({
      serviceId,
      model,
      quality: quality.name,
      price: Math.round(service.basePrice * quality.multiplier * multiplier),
      currency: 'THB',
    }));
  }));

  await prisma.repairVariantPrice.createMany({data: variants, skipDuplicates: true});
}