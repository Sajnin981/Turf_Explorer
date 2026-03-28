export const ctgDummyTurfs = [
  {
    id: 'ctg-1',
    name: 'Agrabad Sports Arena',
    location: 'Agrabad, Chittagong',
    lat: 22.3349,
    lng: 91.8325,
    type: 'Cricket & Football',
    pricePerHour: 1500,
    description: 'Premium sports facility in the heart of Agrabad with modern amenities',
    availableSlots: ['06:00-08:00', '08:00-10:00', '16:00-18:00', '18:00-20:00'],
    image: null,
    available: true,
    bookingCount: 245,
    ownerEmail: 'agrabad@turf.com',
    status: 'approved',
    submissionDate: new Date('2025-12-15').toISOString(),
    bookings: []
  },
  {
    id: 'ctg-2',
    name: 'CDA Avenue Turf',
    location: 'CDA Avenue, Chittagong',
    lat: 22.3475,
    lng: 91.8123,
    type: '5v5 Football',
    pricePerHour: 1200,
    description: 'Professional artificial turf perfect for 5-a-side football matches',
    availableSlots: ['06:00-08:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'],
    image: null,
    available: true,
    bookingCount: 189,
    ownerEmail: 'cda@turf.com',
    status: 'approved',
    submissionDate: new Date('2025-12-20').toISOString(),
    bookings: []
  },
  {
    id: 'ctg-3',
    name: 'Patenga Beach Sports Complex',
    location: 'Patenga, Chittagong',
    lat: 22.2361,
    lng: 91.7913,
    type: 'Beach Football',
    pricePerHour: 1000,
    description: 'Unique beach turf with ocean view, perfect for weekend matches',
    availableSlots: ['07:00-09:00', '09:00-11:00', '16:00-18:00', '18:00-20:00'],
    image: null,
    available: true,
    bookingCount: 156,
    ownerEmail: 'patenga@turf.com',
    status: 'approved',
    submissionDate: new Date('2025-12-18').toISOString(),
    bookings: []
  },
  {
    id: 'ctg-4',
    name: 'Nasirabad Sports Hub',
    location: 'Nasirabad, Chittagong',
    lat: 22.3614,
    lng: 91.8063,
    type: 'Cricket Turf',
    pricePerHour: 1800,
    description: 'Premium cricket turf with professional pitch and practice nets',
    availableSlots: ['06:00-08:00', '08:00-10:00', '10:00-12:00', '16:00-18:00', '18:00-20:00'],
    image: null,
    available: true,
    bookingCount: 312,
    ownerEmail: 'nasirabad@turf.com',
    status: 'approved',
    submissionDate: new Date('2025-11-10').toISOString(),
    bookings: []
  },
  {
    id: 'ctg-5',
    name: 'GEC Circle Sports Arena',
    location: 'GEC Circle, Chittagong',
    lat: 22.3572,
    lng: 91.8304,
    type: '7v7 Football',
    pricePerHour: 1600,
    description: 'Spacious 7-a-side football turf in prime location',
    availableSlots: ['06:00-08:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'],
    image: null,
    available: true,
    bookingCount: 203,
    ownerEmail: 'gec@turf.com',
    status: 'approved',
    submissionDate: new Date('2025-12-01').toISOString(),
    bookings: []
  },
  {
    id: 'ctg-6',
    name: 'Khulshi Elite Turf',
    location: 'Khulshi, Chittagong',
    lat: 22.3392,
    lng: 91.8067,
    type: 'Multi-Sport',
    pricePerHour: 2000,
    description: 'Luxury sports facility with multiple courts for various sports',
    availableSlots: ['06:00-08:00', '08:00-10:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'],
    image: null,
    available: true,
    bookingCount: 278,
    ownerEmail: 'khulshi@turf.com',
    status: 'approved',
    submissionDate: new Date('2025-11-25').toISOString(),
    bookings: []
  }
];

export const initializeDummyData = () => {
  const existing = localStorage.getItem('approvedTurfs');
  if (!existing || JSON.parse(existing).length === 0) {
    localStorage.setItem('approvedTurfs', JSON.stringify(ctgDummyTurfs));
    return true;
  }
  return false;
};
