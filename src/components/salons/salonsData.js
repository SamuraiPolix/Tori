export const SALONS = [
  {
    id: 1,
    image: require('../../assets/rectangle-67.png'),
    name: 'מספרת רויאלטי',
    location: 'רחוב הרצל 15, תל אביב',
    address: 'רחוב הרצל 15, תל אביב',
    phone: '03-1234567',
    latitude: 32.0853,
    longitude: 34.7818,
    rating: '4.9',
    reviewsCount: 120,
    categories: ['haircut', 'coloring', 'blowdry'],
    isOpen: true,
    description: 'מספרת רויאלטי היא מספרה מובילה המתמחה בעיצוב שיער לגברים ונשים. המספרה מציעה שירות מקצועי ואיכותי בסביבה נעימה ומזמינה.',
    services: [
      { id: 1, name: 'תספורת גברים', price: 60, duration: 30 },
      { id: 2, name: 'תספורת ילדים', price: 40, duration: 30 },
      { id: 3, name: 'תספורת זקן', price: 30, duration: 15 },
      { id: 4, name: 'צביעת שיער', price: 120, duration: 60 },
      { id: 5, name: 'תספורת + זקן', price: 80, duration: 45 }
    ],
    gallery: [
      require('../../assets/rectangle-67.png'),
      require('../../assets/rectangle-67.png'),
      require('../../assets/rectangle-67.png')
    ],
    reviews: [
      {
        id: 1,
        userName: 'יוסי כהן',
        rating: 5,
        comment: 'שירות מעולה, מקצועיות ברמה גבוהה',
        date: '2024-01-15'
      },
      {
        id: 2,
        userName: 'דנה לוי',
        rating: 4,
        comment: 'מרוצה מאוד מהתוצאה',
        date: '2024-01-14'
      }
    ],
    openingHours: {
      sunday: { open: '09:00', close: '20:00' },
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '14:00' },
      saturday: { open: 'closed', close: 'closed' }
    },
    availableSlots: {
      "2024-01-21": ["09:00", "10:00", "11:30", "13:00", "14:30", "16:00", "17:30"],
      "2024-01-22": ["09:30", "11:00", "12:30", "14:00", "15:30", "17:00"],
      "2024-01-23": ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"]
    },
    distance: 1.2
  },
  {
    id: 2,
    image: require('../../assets/rectangle-67.png'),
    name: 'סלון יופי אקסקלוסיב',
    location: 'אבן גבירול 55, תל אביב',
    address: 'אבן גבירול 55, תל אביב',
    phone: '03-7654321',
    latitude: 32.0780,
    longitude: 34.7795,
    rating: '4.8',
    reviewsCount: 85,
    categories: ['makeup', 'haircut', 'coloring'],
    isOpen: true,
    description: 'סלון יופי אקסקלוסיב מציע חווית טיפוח יוקרתית ומקצועית. הסלון מתמחה בטיפולי שיער, איפור ועיצוב גבות.',
    services: [
      { id: 1, name: 'תספורת נשים', price: 80, duration: 45 },
      { id: 2, name: 'צביעת שיער', price: 150, duration: 90 },
      { id: 3, name: 'איפור ערב', price: 200, duration: 60 },
      { id: 4, name: 'עיצוב גבות', price: 50, duration: 30 }
    ],
    gallery: [
      require('../../assets/rectangle-67.png'),
      require('../../assets/rectangle-67.png'),
      require('../../assets/rectangle-67.png')
    ],
    reviews: [
      {
        id: 1,
        userName: 'מיכל אברהם',
        rating: 5,
        comment: 'מקום מקסים עם שירות מעולה',
        date: '2024-01-16'
      },
      {
        id: 2,
        userName: 'שירה כהן',
        rating: 5,
        comment: 'תוצאות מדהימות, ממליצה בחום',
        date: '2024-01-13'
      }
    ],
    openingHours: {
      sunday: { open: '10:00', close: '21:00' },
      monday: { open: '10:00', close: '21:00' },
      tuesday: { open: '10:00', close: '21:00' },
      wednesday: { open: '10:00', close: '21:00' },
      thursday: { open: '10:00', close: '21:00' },
      friday: { open: '09:00', close: '15:00' },
      saturday: { open: 'closed', close: 'closed' }
    },
    availableSlots: {
      "2024-01-21": ["10:00", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30"],
      "2024-01-22": ["10:30", "12:00", "13:30", "15:00", "16:30", "18:00"],
      "2024-01-23": ["11:00", "12:30", "14:00", "15:30", "17:00", "18:30"]
    },
    distance: 0.8
  }
];

export const NEARBY_SALONS = [
  {
    id: 'nearby-1',
    image: require('../../assets/rectangle-67.png'),
    name: 'סלון יופי מירי',
    location: 'רחוב דיזנגוף 50, תל אביב',
    address: 'רחוב דיזנגוף 50, תל אביב',
    rating: '4.8',
    reviewsCount: 50,
    distance: 0.3,
    isOpen: true
  },
  {
    id: 'nearby-2',
    image: require('../../assets/rectangle-67.png'),
    name: 'מספרת לילך',
    location: 'שדרות בן גוריון 32, תל אביב',
    address: 'שדרות בן גוריון 32, תל אביב',
    rating: '4.9',
    reviewsCount: 70,
    distance: 0.5,
    isOpen: true
  },
  {
    id: 'nearby-3',
    image: require('../../assets/rectangle-67.png'),
    name: 'סטודיו ליאת',
    location: 'רחוב פרישמן 15, תל אביב',
    address: 'רחוב פרישמן 15, תל אביב',
    rating: '4.7',
    reviewsCount: 40,
    distance: 0.9,
    isOpen: false
  }
];