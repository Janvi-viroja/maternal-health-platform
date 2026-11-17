export interface WeekDevelopment {
  week: number;
  trimester: 1 | 2 | 3;
  sizeComparison: string;
  lengthCm: string;
  weightGrams: string;
  motif: 'seed' | 'berry' | 'citrus' | 'avocado' | 'mango' | 'squash' | 'melon';
  babyDevelopment: string;
  keyMilestones: string[];
  motherTips: string[];
  upcomingCheckup: string;
}

const MILESTONE_BY_WEEK: Record<number, Omit<WeekDevelopment, 'week' | 'trimester'>> = {
  4: {
    sizeComparison: 'Poppy Seed',
    lengthCm: '0.2 cm',
    weightGrams: '< 1 g',
    motif: 'seed',
    babyDevelopment: 'Your tiny baby settles safely inside your womb and the very first building blocks of the brain and spine start to form.',
    keyMilestones: ['A protective water sac starts growing around your baby', 'Early placenta cells begin feeding your baby', 'The spine and brain path starts taking shape'],
    motherTips: ['Take a daily folic acid pill (400 mcg) as told by your doctor', 'Stay away from alcohol, smoking, and unapproved medicines', 'Book your first checkup with a doctor'],
    upcomingCheckup: 'First pregnancy visit & basic blood tests (Weeks 6–8)',
  },
  6: {
    sizeComparison: 'Sweet Pea',
    lengthCm: '0.6 cm',
    weightGrams: '< 1 g',
    motif: 'seed',
    babyDevelopment: 'Your baby’s tiny heart starts beating, and little buds that will turn into arms and legs begin to appear.',
    keyMilestones: ['Early heartbeat can often be seen on an ultrasound scan', 'Tiny spots for eyes and ears begin forming', 'Your baby’s back and spine close neatly'],
    motherTips: ['Eat a few plain crackers or toast before getting out of bed if you feel sick', 'Sip warm ginger tea or lemon water slowly', 'Try to rest and get 8 or more hours of sleep'],
    upcomingCheckup: 'First ultrasound scan to check dates and heartbeat',
  },
  8: {
    sizeComparison: 'Raspberry',
    lengthCm: '1.6 cm',
    weightGrams: '1 g',
    motif: 'berry',
    babyDevelopment: 'Tiny fingers and toes begin separating, facial features become clearer, and your baby makes small wiggles you cannot feel yet.',
    keyMilestones: ['All main body parts have started forming', 'Brain cells begin connecting', 'Thin eyelids cover the eyes'],
    motherTips: ['Drink coconut water or lemon water if plain water upsets your stomach', 'Wear a soft, comfortable bra if your chest feels sore', 'Ask your doctor which pregnancy vitamins are best for you'],
    upcomingCheckup: 'Blood tests for iron, thyroid, and blood group',
  },
  10: {
    sizeComparison: 'Strawberry',
    lengthCm: '3.1 cm',
    weightGrams: '4 g',
    motif: 'berry',
    babyDevelopment: 'All key body parts are now in place to grow bigger and stronger. Tiny fingernails and tooth buds start appearing.',
    keyMilestones: ['Kidneys begin working', 'Tiny fingernails and soft hair roots appear', 'Jaw and bones start getting firmer'],
    motherTips: ['Eat calcium-rich foods like curd, paneer, milk, or sesame', 'Take easy, short walks after meals', 'Ask your doctor about 3-month screening scans'],
    upcomingCheckup: '12-week ultrasound checkup (NT scan) between Weeks 11–13',
  },
  12: {
    sizeComparison: 'Lime',
    lengthCm: '5.4 cm',
    weightGrams: '14 g',
    motif: 'citrus',
    babyDevelopment: 'Your baby can curl fingers and toes and practice tiny tummy movements. The placenta now handles feeding your baby.',
    keyMilestones: ['Vocal cords start forming', 'Baby starts making healthy blood cells', 'Placenta takes over baby nourishment'],
    motherTips: ['Morning sickness often starts getting better around this time', 'Eat oats, fruits, and green veggies to help with bathroom regularity', 'Go for your 12-week ultrasound scan'],
    upcomingCheckup: '12-Week Ultrasound Checkup & First Trimester Tests',
  },
  14: {
    sizeComparison: 'Nectarine',
    lengthCm: '8.7 cm',
    weightGrams: '43 g',
    motif: 'citrus',
    babyDevelopment: 'Your baby’s neck grows longer, baby can squint and frown, and soft baby fuzz covers the skin to keep warm.',
    keyMilestones: ['Liver and stomach organs start working gently', 'Arms grow to fit the body size', 'Baby practices moving hands and legs'],
    motherTips: ['Welcome to the middle months — many moms feel more energy now!', 'Start getting used to sleeping on your left side', 'Eat iron-rich spinach and dal with lemon for better absorption'],
    upcomingCheckup: 'Routine 4-month doctor checkup',
  },
  16: {
    sizeComparison: 'Avocado',
    lengthCm: '11.6 cm',
    weightGrams: '100 g',
    motif: 'avocado',
    babyDevelopment: 'Tiny eye muscles move and your baby can start hearing soft sounds like your heartbeat and your voice!',
    keyMilestones: ['Bones and muscles get stronger every day', 'Taste buds form on the tongue', 'Ear bones harden so baby starts hearing'],
    motherTips: ['Watch out for gentle "flutter" feelings — those are baby’s first tiny kicks!', 'Do gentle pelvic muscle exercises daily', 'Do not take iron pills and calcium/milk at the same exact time'],
    upcomingCheckup: 'Book your 5-month detailed baby scan (Weeks 18–22)',
  },
  20: {
    sizeComparison: 'Ripe Banana',
    lengthCm: '25.6 cm',
    weightGrams: '300 g',
    motif: 'mango',
    babyDevelopment: 'You are halfway there! A soft creamy coating protects your baby’s skin, and baby practices swallowing.',
    keyMilestones: ['Baby starts having clear awake and sleep times', 'Eyebrows and head hair begin to show', 'Baby practices kicking and stretching'],
    motherTips: ['Go for your 20-week detailed scan (checks all of baby’s organs)', 'Put a pillow between your knees when sleeping on your side', 'Eat healthy fats like walnuts, flaxseeds, or well-cooked fish'],
    upcomingCheckup: '5-Month Detailed Baby Scan (Weeks 18–22)',
  },
  24: {
    sizeComparison: 'Cantaloupe',
    lengthCm: '30.0 cm',
    weightGrams: '600 g',
    motif: 'melon',
    babyDevelopment: 'Baby’s inner ear is ready for balance, lungs are growing tiny air pockets, and kicks feel much stronger now.',
    keyMilestones: ['Lungs prepare for breathing after birth', 'Fingerprints and footprints are fully formed', 'Baby reacts to music and your voice'],
    motherTips: ['Get ready for your pregnancy sugar test (between Weeks 24–28)', 'Put your feet up when sitting to reduce mild ankle swelling', 'Spend a quiet moment each evening feeling your baby move'],
    upcomingCheckup: 'Pregnancy Sugar Test (Weeks 24–28)',
  },
  28: {
    sizeComparison: 'Eggplant',
    lengthCm: '37.6 cm',
    weightGrams: '1,000 g',
    motif: 'squash',
    babyDevelopment: 'Welcome to the last 3 months! Your baby opens their eyes, blinks, and starts putting on healthy weight fast.',
    keyMilestones: ['Baby opens eyes and notices bright light', 'Dreaming sleep begins', 'Healthy body fat grows under the skin to keep baby warm'],
    motherTips: ['Start paying attention to daily baby kicks as your doctor advises', 'Ask your doctor about the Tdap vaccine (protects baby after birth)', 'Eat smaller meals more often to avoid chest burn / acidity'],
    upcomingCheckup: 'Tdap Vaccine & Checkups Every 2 Weeks',
  },
  32: {
    sizeComparison: 'Squash',
    lengthCm: '42.4 cm',
    weightGrams: '1,700 g',
    motif: 'squash',
    babyDevelopment: 'Your baby practices breathing movements and usually starts turning head-down to get ready for birth.',
    keyMilestones: ['Bones grow strong while the head stays soft for an easy birth', 'Skin looks smoother and plumper', 'Tummy gets ready for first breast milk'],
    motherTips: ['Start packing your hospital bag with clothes for you and baby', 'Read simple tips on labor and breastfeeding', 'Rest on your left side to help blood flow smoothly to your baby'],
    upcomingCheckup: '8-Month Growth & Baby Position Scan (Weeks 32–34)',
  },
  36: {
    sizeComparison: 'Papaya',
    lengthCm: '47.4 cm',
    weightGrams: '2,600 g',
    motif: 'mango',
    babyDevelopment: 'Lungs are almost fully ready, and your baby gains about 200–250 grams a week while moving lower into your pelvis.',
    keyMilestones: ['Sucking and swallowing skills are ready for feeding', 'Your body passes germ-fighting protection to your baby', 'Most of the soft baby fuzz falls off'],
    motherTips: ['Weekly doctor visits usually begin around now', 'Know the signs of labor (regular belly tightening, water breaking, bleeding)', 'Keep your doctor and hospital phone numbers easy to reach'],
    upcomingCheckup: 'Weekly Doctor Checkups',
  },
  40: {
    sizeComparison: 'Watermelon',
    lengthCm: '51.2 cm',
    weightGrams: '3,400 g',
    motif: 'melon',
    babyDevelopment: 'Full term! Your baby is ready to meet you, with strong lungs, a tight grip, and natural protection from you.',
    keyMilestones: ['All body systems are ready for life outside the womb', 'Baby is full size and ready for delivery', 'Skin is soft and protected'],
    motherTips: ['Stay calm, sip water, and rest between early labor pains', 'Time how far apart your contractions are', 'Call your hospital right away if your water breaks or you see bleeding'],
    upcomingCheckup: 'Birth Readiness & Heartbeat Monitoring Check',
  },
};

export function getWeekDetails(weekInput: number): WeekDevelopment {
  const week = Math.min(40, Math.max(4, Math.round(weekInput)));
  const trimester: 1 | 2 | 3 = week <= 13 ? 1 : week <= 27 ? 2 : 3;

  const anchorWeeks = Object.keys(MILESTONE_BY_WEEK)
    .map(Number)
    .sort((a, b) => a - b);

  let chosen = anchorWeeks[0];
  for (const w of anchorWeeks) {
    if (w <= week) chosen = w;
  }
  const base = MILESTONE_BY_WEEK[chosen];

  return {
    week,
    trimester,
    ...base,
  };
}

function formatLocalYyyyMmDd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseYyyyMmDd(raw?: string): Date | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export function calculatePregnancyDates(params: { lmpDate?: string; eddDate?: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let edd: Date | null = null;
  let lmp: Date | null = null;

  if (params.lmpDate) {
    lmp = parseYyyyMmDd(params.lmpDate);
    if (lmp) {
      edd = new Date(lmp.getFullYear(), lmp.getMonth(), lmp.getDate() + 280);
    }
  } else if (params.eddDate) {
    edd = parseYyyyMmDd(params.eddDate);
    if (edd) {
      lmp = new Date(edd.getFullYear(), edd.getMonth(), edd.getDate() - 280);
    }
  }

  if (!lmp || !edd || Number.isNaN(lmp.getTime()) || Number.isNaN(edd.getTime())) {
    return null;
  }

  const diffDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
  const rawWeek = Math.floor(diffDays / 7);
  const daysRemainder = ((diffDays % 7) + 7) % 7;
  const week = Math.min(42, Math.max(1, rawWeek));
  const daysRemaining = Math.max(
    0,
    Math.ceil((edd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
  const trimester: 1 | 2 | 3 = week <= 13 ? 1 : week <= 27 ? 2 : 3;

  return {
    week,
    daysRemainder,
    trimester,
    lmpDate: formatLocalYyyyMmDd(lmp),
    expectedDeliveryDate: formatLocalYyyyMmDd(edd),
    daysRemaining,
    progressPercent: Math.min(100, Math.max(2, Math.round((week / 40) * 100))),
  };
}

export interface MealPlanItem {
  slot: string;
  vegetarian: string;
  nonVegetarian: string;
  keyNutrients: string;
}

export interface TrimesterNutritionGuide {
  trimester: 1 | 2 | 3;
  title: string;
  calorieGuidance: string;
  focusNutrients: string[];
  indianHighlight: string;
  meals: MealPlanItem[];
}

export const NUTRITION_GUIDES: Record<1 | 2 | 3, TrimesterNutritionGuide> = {
  1: {
    trimester: 1,
    title: 'First 3 Months (Weeks 1–13): Light, Easy-to-Digest Meals',
    calorieGuidance: 'Eat normal healthy portions (~1,800–2,000 calories) in small, frequent meals so your stomach feels comfortable.',
    focusNutrients: ['Folic Acid (for baby’s spine)', 'Vitamin B6 (helps morning sickness)', 'Water & Salt Balance'],
    indianHighlight: 'Moong dal khichdi, vegetable poha with lemon, buttermilk (chaas), and soaked almonds.',
    meals: [
      {
        slot: 'Morning Wake-Up',
        vegetarian: '5 soaked almonds, 2 walnuts, and warm ginger-lemon water or jeera water',
        nonVegetarian: '5 soaked almonds and 1 soft-boiled egg with dry toast',
        keyNutrients: 'Helps ease morning sickness & gives gentle energy',
      },
      {
        slot: 'Breakfast',
        vegetarian: 'Vegetable poha with peas & lemon juice, plus 1 glass fresh orange juice',
        nonVegetarian: '2-egg spinach omelette with whole-wheat toast and ripe orange papaya',
        keyNutrients: 'Folic Acid, Vitamin C, Protein',
      },
      {
        slot: 'Lunch',
        vegetarian: '2 soft multigrain rotis, palak paneer, yellow moong dal, and cucumber curd',
        nonVegetarian: '2 rotis, mild home chicken stew with carrots, moong dal, and curd',
        keyNutrients: 'Iron, Calcium, Good Gut Health',
      },
      {
        slot: 'Evening Snack',
        vegetarian: 'Roasted makhana with mint buttermilk (chaas) or coconut water',
        nonVegetarian: 'Roasted makhana with warm vegetable or chicken soup',
        keyNutrients: 'Light fiber & keeps body hydrated',
      },
      {
        slot: 'Dinner',
        vegetarian: 'Light vegetable moong khichdi with 1 spoon ghee and steamed broccoli',
        nonVegetarian: 'Well-cooked salmon or rohu fish curry with steamed rice & greens',
        keyNutrients: 'Brain-healthy fats & easy-to-digest protein',
      },
    ],
  },
  2: {
    trimester: 2,
    title: 'Middle Months (Weeks 14–27): Iron, Calcium & Strong Bones',
    calorieGuidance: 'Add about 1 extra healthy snack/meal a day (~2,200 calories total) to help your baby’s bones and blood grow.',
    focusNutrients: ['Iron (prevents tiredness)', 'Calcium (strong bones)', 'Vitamin D', 'Healthy Brain Fats'],
    indianHighlight: 'Ragi malt or ragi dosa, rajma chawal with salad, sesame laddoo, and green leafy sabzi.',
    meals: [
      {
        slot: 'Morning Wake-Up',
        vegetarian: 'Soaked figs (anjeer), walnuts, and warm milk (plain or with a pinch of turmeric)',
        nonVegetarian: 'Soaked walnuts, dates, and warm milk',
        keyNutrients: 'Calcium, Iron, Natural Fiber',
      },
      {
        slot: 'Breakfast',
        vegetarian: 'Ragi vegetable idli or chilla with mint chutney and pomegranate seeds',
        nonVegetarian: '2 boiled eggs, multigrain paratha with methi, and a bowl of fresh fruit',
        keyNutrients: 'Calcium, Iron, Folate',
      },
      {
        slot: 'Lunch',
        vegetarian: 'Rice or 2 jowar rotis, rajma or chole curry, methi-aloo sabzi, and beetroot salad',
        nonVegetarian: 'Steamed rice, mild chicken or egg curry, sautéed beans, and fresh salad',
        keyNutrients: 'Iron, Steady Energy, Vitamins',
      },
      {
        slot: 'Evening Snack',
        vegetarian: 'Boiled chana chaat with lemon + 1 sesame-jaggery (til) laddoo',
        nonVegetarian: 'Thick curd/yogurt with pumpkin seeds & berries or chicken wrap',
        keyNutrients: 'Lemon + chana helps your body absorb iron better',
      },
      {
        slot: 'Dinner',
        vegetarian: 'Millet or vegetable pulao with paneer/tofu bhurji and warm dal soup',
        nonVegetarian: 'Well-cooked fish (pomfret or salmon) with cooked spinach & sweet potato',
        keyNutrients: 'Protein, Brain Fats, Potassium',
      },
    ],
  },
  3: {
    trimester: 3,
    title: 'Last Months (Weeks 28–40): Baby Brain Growth & Small Meals',
    calorieGuidance: 'Eat 5–6 smaller meals (~2,400 calories total) so your tummy stays comfortable and your baby gains healthy weight.',
    focusNutrients: ['Healthy Brain Fats', 'Extra Protein', 'Fiber (for digestion)'],
    indianHighlight: 'Bajra khichdi, paneer tikka with mint, warm ajwain water, and drumstick sambar.',
    meals: [
      {
        slot: 'Morning Wake-Up',
        vegetarian: 'Soaked almonds, pumpkin seeds, and 1 banana',
        nonVegetarian: 'Soaked almonds and 1 scrambled egg on whole-wheat toast',
        keyNutrients: 'Prevents leg cramps & gives steady energy',
      },
      {
        slot: 'Breakfast',
        vegetarian: 'Broken wheat (dalia) vegetable upma with roasted peanuts and curd',
        nonVegetarian: 'Oats porridge with seeds plus 2 well-cooked eggs',
        keyNutrients: 'High Fiber, Protein',
      },
      {
        slot: 'Lunch',
        vegetarian: '2 rotis, drumstick sambar, bhindi sabzi, and thick homemade curd',
        nonVegetarian: '2 rotis, mild chicken or fish curry, spinach sabzi, and curd',
        keyNutrients: 'Calcium, Iron, Vitamins',
      },
      {
        slot: 'Evening Snack',
        vegetarian: 'Steamed sweet corn with lemon & coriander, plus roasted chana',
        nonVegetarian: 'Paneer cubes with walnuts or boiled egg chaat',
        keyNutrients: 'Protein & healthy snacking',
      },
      {
        slot: 'Dinner',
        vegetarian: 'Soft vegetable dalia khichdi with ghee and warm spinach soup',
        nonVegetarian: 'Baked fish or warm chicken-lentil soup with bread and cooked veggies',
        keyNutrients: 'Easy on the stomach & reduces night acidity',
      },
    ],
  },
};

export const FOODS_TO_AVOID = [
  {
    item: 'Raw or Half-Cooked Meat, Eggs & Fish',
    reason: 'Can carry germs that cause food poisoning. Always cook eggs, meat, and fish until piping hot all the way through.',
  },
  {
    item: 'Large Sea Fish (Shark, Swordfish, King Mackerel)',
    reason: 'These big fish can have too much mercury, which is unsafe for baby. Pick safer fish like salmon, rohu, or sardines.',
  },
  {
    item: 'Raw Milk, Unpasteurized Cheese & Raw Sprouts',
    reason: 'Can carry harmful germs. Always boil or use packaged safe milk, and steam sprouts lightly before eating.',
  },
  {
    item: 'Alcohol & Too Much Coffee or Tea',
    reason: 'Avoid all alcohol. Keep tea or coffee to 1–2 small cups a day, and do not drink tea right after meals or iron pills.',
  },
  {
    item: 'Green Unripe Papaya',
    reason: 'Unripe green papaya can trigger early tummy cramps. Ask your doctor before eating papaya during pregnancy.',
  },
  {
    item: 'Pre-Cut Street Fruits & Untapped Water',
    reason: 'Roadside cut fruits or unclean water can cause stomach infection. Wash whole fruits at home and drink boiled or filtered water.',
  },
];
