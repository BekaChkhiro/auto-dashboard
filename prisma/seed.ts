import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...\n');

  // ============================================================================
  // COUNTRIES
  // ============================================================================
  console.log('📍 Seeding countries...');

  const countries = await Promise.all([
    prisma.country.upsert({
      where: { code: 'US' },
      update: {},
      create: {
        code: 'US',
        nameEn: 'United States',
        nameKa: 'ამერიკის შეერთებული შტატები',
      },
    }),
    prisma.country.upsert({
      where: { code: 'CA' },
      update: {},
      create: {
        code: 'CA',
        nameEn: 'Canada',
        nameKa: 'კანადა',
      },
    }),
    prisma.country.upsert({
      where: { code: 'GE' },
      update: {},
      create: {
        code: 'GE',
        nameEn: 'Georgia',
        nameKa: 'საქართველო',
      },
    }),
  ]);

  const [usa, canada, georgia] = countries;
  console.log(`   ✓ Created ${countries.length} countries`);

  // ============================================================================
  // US STATES
  // ============================================================================
  console.log('📍 Seeding US states...');

  const usStates = [
    { code: 'AL', nameEn: 'Alabama', nameKa: 'ალაბამა' },
    { code: 'AK', nameEn: 'Alaska', nameKa: 'ალასკა' },
    { code: 'AZ', nameEn: 'Arizona', nameKa: 'არიზონა' },
    { code: 'AR', nameEn: 'Arkansas', nameKa: 'არკანზასი' },
    { code: 'CA', nameEn: 'California', nameKa: 'კალიფორნია' },
    { code: 'CO', nameEn: 'Colorado', nameKa: 'კოლორადო' },
    { code: 'CT', nameEn: 'Connecticut', nameKa: 'კონექტიკუტი' },
    { code: 'DE', nameEn: 'Delaware', nameKa: 'დელავერი' },
    { code: 'FL', nameEn: 'Florida', nameKa: 'ფლორიდა' },
    { code: 'GA', nameEn: 'Georgia', nameKa: 'ჯორჯია' },
    { code: 'HI', nameEn: 'Hawaii', nameKa: 'ჰავაი' },
    { code: 'ID', nameEn: 'Idaho', nameKa: 'აიდაჰო' },
    { code: 'IL', nameEn: 'Illinois', nameKa: 'ილინოისი' },
    { code: 'IN', nameEn: 'Indiana', nameKa: 'ინდიანა' },
    { code: 'IA', nameEn: 'Iowa', nameKa: 'აიოვა' },
    { code: 'KS', nameEn: 'Kansas', nameKa: 'კანზასი' },
    { code: 'KY', nameEn: 'Kentucky', nameKa: 'კენტუკი' },
    { code: 'LA', nameEn: 'Louisiana', nameKa: 'ლუიზიანა' },
    { code: 'ME', nameEn: 'Maine', nameKa: 'მეინი' },
    { code: 'MD', nameEn: 'Maryland', nameKa: 'მერილენდი' },
    { code: 'MA', nameEn: 'Massachusetts', nameKa: 'მასაჩუსეტსი' },
    { code: 'MI', nameEn: 'Michigan', nameKa: 'მიჩიგანი' },
    { code: 'MN', nameEn: 'Minnesota', nameKa: 'მინესოტა' },
    { code: 'MS', nameEn: 'Mississippi', nameKa: 'მისისიპი' },
    { code: 'MO', nameEn: 'Missouri', nameKa: 'მისური' },
    { code: 'MT', nameEn: 'Montana', nameKa: 'მონტანა' },
    { code: 'NE', nameEn: 'Nebraska', nameKa: 'ნებრასკა' },
    { code: 'NV', nameEn: 'Nevada', nameKa: 'ნევადა' },
    { code: 'NH', nameEn: 'New Hampshire', nameKa: 'ნიუ ჰემფშირი' },
    { code: 'NJ', nameEn: 'New Jersey', nameKa: 'ნიუ ჯერსი' },
    { code: 'NM', nameEn: 'New Mexico', nameKa: 'ნიუ მექსიკო' },
    { code: 'NY', nameEn: 'New York', nameKa: 'ნიუ იორკი' },
    { code: 'NC', nameEn: 'North Carolina', nameKa: 'ჩრდილოეთ კაროლინა' },
    { code: 'ND', nameEn: 'North Dakota', nameKa: 'ჩრდილოეთ დაკოტა' },
    { code: 'OH', nameEn: 'Ohio', nameKa: 'ოჰაიო' },
    { code: 'OK', nameEn: 'Oklahoma', nameKa: 'ოკლაჰომა' },
    { code: 'OR', nameEn: 'Oregon', nameKa: 'ორეგონი' },
    { code: 'PA', nameEn: 'Pennsylvania', nameKa: 'პენსილვანია' },
    { code: 'RI', nameEn: 'Rhode Island', nameKa: 'როდ აილენდი' },
    { code: 'SC', nameEn: 'South Carolina', nameKa: 'სამხრეთ კაროლინა' },
    { code: 'SD', nameEn: 'South Dakota', nameKa: 'სამხრეთ დაკოტა' },
    { code: 'TN', nameEn: 'Tennessee', nameKa: 'ტენესი' },
    { code: 'TX', nameEn: 'Texas', nameKa: 'ტეხასი' },
    { code: 'UT', nameEn: 'Utah', nameKa: 'იუტა' },
    { code: 'VT', nameEn: 'Vermont', nameKa: 'ვერმონტი' },
    { code: 'VA', nameEn: 'Virginia', nameKa: 'ვირჯინია' },
    { code: 'WA', nameEn: 'Washington', nameKa: 'ვაშინგტონი' },
    { code: 'WV', nameEn: 'West Virginia', nameKa: 'დასავლეთ ვირჯინია' },
    { code: 'WI', nameEn: 'Wisconsin', nameKa: 'ვისკონსინი' },
    { code: 'WY', nameEn: 'Wyoming', nameKa: 'ვაიომინგი' },
  ];

  const createdUsStates: Record<string, { id: string; code: string }> = {};
  for (const state of usStates) {
    const created = await prisma.state.upsert({
      where: {
        id: `us-${state.code.toLowerCase()}`,
      },
      update: {},
      create: {
        id: `us-${state.code.toLowerCase()}`,
        code: state.code,
        nameEn: state.nameEn,
        nameKa: state.nameKa,
        countryId: usa.id,
      },
    });
    createdUsStates[state.code] = created;
  }
  console.log(`   ✓ Created ${usStates.length} US states`);

  // ============================================================================
  // CANADIAN PROVINCES
  // ============================================================================
  console.log('📍 Seeding Canadian provinces...');

  const canadianProvinces = [
    { code: 'AB', nameEn: 'Alberta', nameKa: 'ალბერტა' },
    { code: 'BC', nameEn: 'British Columbia', nameKa: 'ბრიტანეთის კოლუმბია' },
    { code: 'MB', nameEn: 'Manitoba', nameKa: 'მანიტობა' },
    { code: 'NB', nameEn: 'New Brunswick', nameKa: 'ნიუ ბრანსვიკი' },
    { code: 'NL', nameEn: 'Newfoundland and Labrador', nameKa: 'ნიუფაუნდლენდი და ლაბრადორი' },
    { code: 'NS', nameEn: 'Nova Scotia', nameKa: 'ნოვა სკოტია' },
    { code: 'NT', nameEn: 'Northwest Territories', nameKa: 'ჩრდილო-დასავლეთის ტერიტორიები' },
    { code: 'NU', nameEn: 'Nunavut', nameKa: 'ნუნავუტი' },
    { code: 'ON', nameEn: 'Ontario', nameKa: 'ონტარიო' },
    { code: 'PE', nameEn: 'Prince Edward Island', nameKa: 'პრინც ედუარდის კუნძული' },
    { code: 'QC', nameEn: 'Quebec', nameKa: 'კვებეკი' },
    { code: 'SK', nameEn: 'Saskatchewan', nameKa: 'სასკაჩევანი' },
    { code: 'YT', nameEn: 'Yukon', nameKa: 'იუკონი' },
  ];

  const createdCaProvinces: Record<string, { id: string; code: string }> = {};
  for (const province of canadianProvinces) {
    const created = await prisma.state.upsert({
      where: {
        id: `ca-${province.code.toLowerCase()}`,
      },
      update: {},
      create: {
        id: `ca-${province.code.toLowerCase()}`,
        code: province.code,
        nameEn: province.nameEn,
        nameKa: province.nameKa,
        countryId: canada.id,
      },
    });
    createdCaProvinces[province.code] = created;
  }
  console.log(`   ✓ Created ${canadianProvinces.length} Canadian provinces`);

  // ============================================================================
  // GEORGIAN REGIONS (for destination ports)
  // ============================================================================
  console.log('📍 Seeding Georgian regions...');

  const georgianRegions = [
    { code: 'AJ', nameEn: 'Adjara', nameKa: 'აჭარა' },
    { code: 'SZ', nameEn: 'Samegrelo-Zemo Svaneti', nameKa: 'სამეგრელო-ზემო სვანეთი' },
  ];

  const createdGeRegions: Record<string, { id: string; code: string }> = {};
  for (const region of georgianRegions) {
    const created = await prisma.state.upsert({
      where: {
        id: `ge-${region.code.toLowerCase()}`,
      },
      update: {},
      create: {
        id: `ge-${region.code.toLowerCase()}`,
        code: region.code,
        nameEn: region.nameEn,
        nameKa: region.nameKa,
        countryId: georgia.id,
      },
    });
    createdGeRegions[region.code] = created;
  }
  console.log(`   ✓ Created ${georgianRegions.length} Georgian regions`);

  // ============================================================================
  // US PORTS
  // ============================================================================
  console.log('🚢 Seeding US ports...');

  const usPorts = [
    // California
    { name: 'Los Angeles', stateCode: 'CA' },
    { name: 'Long Beach', stateCode: 'CA' },
    { name: 'Oakland', stateCode: 'CA' },
    { name: 'San Diego', stateCode: 'CA' },
    // Texas
    { name: 'Houston', stateCode: 'TX' },
    { name: 'Galveston', stateCode: 'TX' },
    { name: 'Freeport', stateCode: 'TX' },
    // Florida
    { name: 'Jacksonville', stateCode: 'FL' },
    { name: 'Miami', stateCode: 'FL' },
    { name: 'Tampa', stateCode: 'FL' },
    { name: 'Fort Lauderdale', stateCode: 'FL' },
    // Georgia (US State)
    { name: 'Savannah', stateCode: 'GA' },
    { name: 'Brunswick', stateCode: 'GA' },
    // New York / New Jersey
    { name: 'New York/Newark', stateCode: 'NJ' },
    // Maryland
    { name: 'Baltimore', stateCode: 'MD' },
    // Virginia
    { name: 'Norfolk', stateCode: 'VA' },
    // South Carolina
    { name: 'Charleston', stateCode: 'SC' },
    // Louisiana
    { name: 'New Orleans', stateCode: 'LA' },
    // Washington
    { name: 'Seattle', stateCode: 'WA' },
    { name: 'Tacoma', stateCode: 'WA' },
  ];

  for (const port of usPorts) {
    const state = createdUsStates[port.stateCode];
    if (state) {
      await prisma.port.upsert({
        where: {
          id: `port-us-${port.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        },
        update: {},
        create: {
          id: `port-us-${port.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: port.name,
          stateId: state.id,
          isDestination: false,
        },
      });
    }
  }
  console.log(`   ✓ Created ${usPorts.length} US ports`);

  // ============================================================================
  // CANADIAN PORTS
  // ============================================================================
  console.log('🚢 Seeding Canadian ports...');

  const canadianPorts = [
    { name: 'Vancouver', provinceCode: 'BC' },
    { name: 'Prince Rupert', provinceCode: 'BC' },
    { name: 'Montreal', provinceCode: 'QC' },
    { name: 'Halifax', provinceCode: 'NS' },
    { name: 'Toronto', provinceCode: 'ON' },
    { name: 'Saint John', provinceCode: 'NB' },
  ];

  for (const port of canadianPorts) {
    const province = createdCaProvinces[port.provinceCode];
    if (province) {
      await prisma.port.upsert({
        where: {
          id: `port-ca-${port.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        },
        update: {},
        create: {
          id: `port-ca-${port.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: port.name,
          stateId: province.id,
          isDestination: false,
        },
      });
    }
  }
  console.log(`   ✓ Created ${canadianPorts.length} Canadian ports`);

  // ============================================================================
  // GEORGIAN PORTS (Destinations)
  // ============================================================================
  console.log('🚢 Seeding Georgian ports...');

  const georgianPorts = [
    { name: 'Poti', regionCode: 'SZ' },
    { name: 'Batumi', regionCode: 'AJ' },
  ];

  for (const port of georgianPorts) {
    const region = createdGeRegions[port.regionCode];
    if (region) {
      await prisma.port.upsert({
        where: {
          id: `port-ge-${port.name.toLowerCase()}`,
        },
        update: {},
        create: {
          id: `port-ge-${port.name.toLowerCase()}`,
          name: port.name,
          stateId: region.id,
          isDestination: true,
        },
      });
    }
  }
  console.log(`   ✓ Created ${georgianPorts.length} Georgian ports`);

  // ============================================================================
  // AUCTIONS
  // ============================================================================
  console.log('🔨 Seeding auctions...');

  const auctions = ['Copart', 'IAAI', 'Manheim'];

  for (const name of auctions) {
    await prisma.auction.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`   ✓ Created ${auctions.length} auctions`);

  // ============================================================================
  // VEHICLE STATUSES
  // ============================================================================
  console.log('📊 Seeding vehicle statuses...');

  const statuses = [
    { order: 1, nameEn: 'Purchased', nameKa: 'შეძენილი', color: '#6366F1' },
    { order: 2, nameEn: 'In Transit to Port', nameKa: 'პორტისკენ მიმავალი', color: '#8B5CF6' },
    { order: 3, nameEn: 'At US/CA Port', nameKa: 'აშშ/კანადის პორტში', color: '#A855F7' },
    { order: 4, nameEn: 'Loaded on Ship', nameKa: 'გემზე ჩატვირთული', color: '#D946EF' },
    { order: 5, nameEn: 'In Transit (Sea)', nameKa: 'ზღვით ტრანზიტში', color: '#EC4899' },
    { order: 6, nameEn: 'Arrived at GE Port', nameKa: 'საქართველოს პორტში', color: '#F43F5E' },
    { order: 7, nameEn: 'Customs Clearance', nameKa: 'განბაჟება', color: '#F97316' },
    { order: 8, nameEn: 'Ready for Pickup', nameKa: 'მზადაა გასატანად', color: '#EAB308' },
    { order: 9, nameEn: 'Delivered', nameKa: 'მიწოდებული', color: '#22C55E' },
  ];

  for (const status of statuses) {
    await prisma.status.upsert({
      where: {
        id: `status-${status.order}`,
      },
      update: {},
      create: {
        id: `status-${status.order}`,
        order: status.order,
        nameEn: status.nameEn,
        nameKa: status.nameKa,
        color: status.color,
      },
    });
  }
  console.log(`   ✓ Created ${statuses.length} vehicle statuses`);

  // ============================================================================
  // CAR MAKES AND MODELS
  // ============================================================================
  console.log('🚗 Seeding car makes and models...');

  const makesAndModels: Record<string, string[]> = {
    Toyota: [
      'Camry',
      'Corolla',
      'RAV4',
      'Highlander',
      'Tacoma',
      'Tundra',
      '4Runner',
      'Prius',
      'Sienna',
      'Avalon',
      'Land Cruiser',
      'Sequoia',
      'Supra',
      'GR86',
      'Venza',
      'C-HR',
    ],
    Honda: [
      'Civic',
      'Accord',
      'CR-V',
      'Pilot',
      'HR-V',
      'Odyssey',
      'Ridgeline',
      'Passport',
      'Fit',
      'Insight',
    ],
    Ford: [
      'F-150',
      'Mustang',
      'Explorer',
      'Escape',
      'Edge',
      'Bronco',
      'Ranger',
      'Expedition',
      'Maverick',
      'Transit',
      'F-250',
      'F-350',
    ],
    Chevrolet: [
      'Silverado',
      'Equinox',
      'Tahoe',
      'Suburban',
      'Traverse',
      'Malibu',
      'Camaro',
      'Corvette',
      'Colorado',
      'Blazer',
      'Trax',
      'Spark',
    ],
    BMW: [
      '3 Series',
      '5 Series',
      '7 Series',
      'X3',
      'X5',
      'X7',
      'X1',
      'X6',
      'M3',
      'M5',
      'i4',
      'iX',
      '4 Series',
      '8 Series',
    ],
    'Mercedes-Benz': [
      'C-Class',
      'E-Class',
      'S-Class',
      'GLE',
      'GLC',
      'GLS',
      'A-Class',
      'CLA',
      'AMG GT',
      'G-Class',
      'EQS',
      'EQE',
    ],
    Audi: ['A4', 'A6', 'A8', 'Q5', 'Q7', 'Q3', 'Q8', 'e-tron', 'A3', 'A5', 'RS6', 'R8', 'TT'],
    Lexus: ['RX', 'ES', 'NX', 'GX', 'LX', 'IS', 'LS', 'UX', 'LC', 'RC'],
    Nissan: [
      'Altima',
      'Sentra',
      'Rogue',
      'Pathfinder',
      'Murano',
      'Frontier',
      'Titan',
      'Maxima',
      'Kicks',
      'Armada',
      '370Z',
      'GT-R',
    ],
    Hyundai: [
      'Elantra',
      'Sonata',
      'Tucson',
      'Santa Fe',
      'Palisade',
      'Kona',
      'Venue',
      'Ioniq 5',
      'Ioniq 6',
      'Genesis',
    ],
    Kia: [
      'Forte',
      'K5',
      'Sportage',
      'Sorento',
      'Telluride',
      'Seltos',
      'Soul',
      'Carnival',
      'EV6',
      'Stinger',
    ],
    Volkswagen: [
      'Jetta',
      'Passat',
      'Tiguan',
      'Atlas',
      'Golf',
      'ID.4',
      'Taos',
      'Arteon',
      'Golf GTI',
      'Golf R',
    ],
    Subaru: [
      'Outback',
      'Forester',
      'Crosstrek',
      'Impreza',
      'Ascent',
      'Legacy',
      'WRX',
      'BRZ',
      'Solterra',
    ],
    Mazda: ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'CX-30', 'CX-50', 'MX-5 Miata', 'CX-90'],
    Jeep: [
      'Wrangler',
      'Grand Cherokee',
      'Cherokee',
      'Compass',
      'Renegade',
      'Gladiator',
      'Wagoneer',
      'Grand Wagoneer',
    ],
    Dodge: ['Charger', 'Challenger', 'Durango', 'Hornet', 'Ram 1500', 'Ram 2500', 'Ram 3500'],
    Ram: ['1500', '2500', '3500', 'ProMaster'],
    GMC: ['Sierra', 'Yukon', 'Acadia', 'Terrain', 'Canyon', 'Hummer EV'],
    Cadillac: ['Escalade', 'XT5', 'XT6', 'CT5', 'CT4', 'Lyriq', 'XT4'],
    Porsche: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', '718 Cayman', '718 Boxster'],
    Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
    Volvo: ['XC90', 'XC60', 'XC40', 'S60', 'S90', 'V60', 'V90', 'C40'],
    'Land Rover': [
      'Range Rover',
      'Range Rover Sport',
      'Defender',
      'Discovery',
      'Range Rover Velar',
      'Range Rover Evoque',
    ],
    Jaguar: ['F-PACE', 'E-PACE', 'I-PACE', 'XF', 'F-TYPE'],
    Infiniti: ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80'],
    Acura: ['MDX', 'RDX', 'TLX', 'Integra', 'NSX'],
    Lincoln: ['Navigator', 'Aviator', 'Nautilus', 'Corsair'],
    Genesis: ['G70', 'G80', 'G90', 'GV70', 'GV80', 'GV60'],
    Buick: ['Enclave', 'Envision', 'Encore GX', 'Encore'],
    Chrysler: ['Pacifica', '300'],
    Mitsubishi: ['Outlander', 'Eclipse Cross', 'Outlander Sport', 'Mirage'],
    Alfa_Romeo: ['Giulia', 'Stelvio', 'Tonale'],
    Maserati: ['Ghibli', 'Levante', 'Quattroporte', 'MC20', 'Grecale'],
    Bentley: ['Continental GT', 'Flying Spur', 'Bentayga'],
    Rolls_Royce: ['Phantom', 'Ghost', 'Cullinan', 'Spectre', 'Wraith'],
    Ferrari: ['Roma', 'F8 Tributo', 'SF90 Stradale', '296 GTB', 'Purosangue', '812 GTS'],
    Lamborghini: ['Urus', 'Huracan', 'Revuelto'],
    Aston_Martin: ['DB11', 'Vantage', 'DBX', 'DBS Superleggera'],
    McLaren: ['720S', 'GT', 'Artura', '765LT'],
    Rivian: ['R1T', 'R1S'],
    Lucid: ['Air'],
    Polestar: ['Polestar 2', 'Polestar 3'],
  };

  let makeCount = 0;
  let modelCount = 0;

  for (const [makeName, models] of Object.entries(makesAndModels)) {
    const displayName = makeName.replace(/_/g, ' ');

    const make = await prisma.make.upsert({
      where: { name: displayName },
      update: {},
      create: { name: displayName },
    });
    makeCount++;

    for (const modelName of models) {
      await prisma.model.upsert({
        where: {
          id: `model-${makeName.toLowerCase()}-${modelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        },
        update: {},
        create: {
          id: `model-${makeName.toLowerCase()}-${modelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: modelName,
          makeId: make.id,
        },
      });
      modelCount++;
    }
  }
  console.log(`   ✓ Created ${makeCount} makes and ${modelCount} models`);

  // ============================================================================
  // ADMIN USER (optional - for development)
  // ============================================================================
  console.log('👤 Seeding admin user...');

  // Hash the admin password using bcrypt
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: 'admin@autodashboard.ge' },
    update: {
      // Update password if it has changed
      password: adminPasswordHash,
    },
    create: {
      email: 'admin@autodashboard.ge',
      password: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      name: 'System Administrator',
      phone: '+995 555 123456',
      address: 'Tbilisi, Georgia',
      balance: 0,
      discount: 0,
    },
  });
  console.log('   ✓ Created admin user (admin@autodashboard.ge)');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • Countries: 3`);
  console.log(`   • US States: ${usStates.length}`);
  console.log(`   • Canadian Provinces: ${canadianProvinces.length}`);
  console.log(`   • Georgian Regions: ${georgianRegions.length}`);
  console.log(`   • US Ports: ${usPorts.length}`);
  console.log(`   • Canadian Ports: ${canadianPorts.length}`);
  console.log(`   • Georgian Ports: ${georgianPorts.length}`);
  console.log(`   • Auctions: ${auctions.length}`);
  console.log(`   • Statuses: ${statuses.length}`);
  console.log(`   • Car Makes: ${makeCount}`);
  console.log(`   • Car Models: ${modelCount}`);
  console.log(`   • Admin User: 1`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
