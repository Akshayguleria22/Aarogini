require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('./config/database');
const Medicine = require('./models/Medicine');
const Article = require('./models/Article');

const medicines = [
  {
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    category: "pain_relief",
    manufacturer: "Various",
    description: "Nonsteroidal anti-inflammatory drug (NSAID) used to reduce fever and treat pain or inflammation.",
    uses: ["Headache relief", "Menstrual cramps", "Muscle pain", "Arthritis", "Fever reduction"],
    sideEffects: ["Stomach upset", "Nausea", "Dizziness", "Heartburn"],
    dosage: {
      adult: "200-400mg every 4-6 hours, max 1200mg/day",
      children: "5-10mg/kg every 6-8 hours",
      elderly: "Start with lower doses"
    },
    precautions: ["Take with food", "Avoid if stomach ulcers", "May increase bleeding risk"],
    contraindications: ["Active bleeding", "Severe heart failure", "Last trimester of pregnancy"],
    pregnancyCategory: "C",
    breastfeedingSafe: true,
    prescriptionRequired: false,
    price: 8.99,
    availability: "available"
  },
  {
    name: "Paracetamol",
    genericName: "Acetaminophen",
    category: "pain_relief",
    manufacturer: "Various",
    description: "Pain reliever and fever reducer commonly used for mild to moderate pain.",
    uses: ["Headache", "Fever", "Toothache", "Back pain", "Cold and flu symptoms"],
    sideEffects: ["Rare at normal doses", "Liver damage if overdosed"],
    dosage: {
      adult: "500-1000mg every 4-6 hours, max 4000mg/day",
      children: "10-15mg/kg every 4-6 hours",
      elderly: "Same as adult, monitor for side effects"
    },
    precautions: ["Do not exceed recommended dose", "Avoid alcohol", "Check liver function"],
    contraindications: ["Severe liver disease", "Alcohol dependence"],
    pregnancyCategory: "B",
    breastfeedingSafe: true,
    prescriptionRequired: false,
    price: 6.99,
    availability: "available"
  },
  {
    name: "Folic Acid",
    genericName: "Folate",
    category: "vitamin",
    manufacturer: "Various",
    description: "B vitamin essential for cell growth and metabolism, especially important during pregnancy.",
    uses: ["Pregnancy support", "Anemia prevention", "Cell growth", "DNA synthesis"],
    sideEffects: ["Generally well tolerated", "Rare allergic reactions"],
    dosage: {
      adult: "400-800mcg daily",
      children: "As prescribed by doctor",
      elderly: "400mcg daily"
    },
    precautions: ["Take as directed", "Important before and during pregnancy"],
    contraindications: ["Rare vitamin B12 deficiency masking"],
    pregnancyCategory: "A",
    breastfeedingSafe: true,
    prescriptionRequired: false,
    price: 12.99,
    availability: "available"
  },
  {
    name: "Iron Supplements",
    genericName: "Ferrous Sulfate",
    category: "vitamin",
    manufacturer: "Various",
    description: "Mineral supplement used to treat or prevent iron deficiency anemia.",
    uses: ["Iron deficiency", "Anemia", "Pregnancy support", "Heavy menstrual bleeding"],
    sideEffects: ["Constipation", "Nausea", "Stomach upset", "Dark stools"],
    dosage: {
      adult: "325mg 1-3 times daily",
      children: "As prescribed by doctor",
      elderly: "Start with lower doses"
    },
    precautions: ["Take with vitamin C for better absorption", "May cause constipation", "Keep away from children"],
    contraindications: ["Hemochromatosis", "Hemosiderosis"],
    pregnancyCategory: "A",
    breastfeedingSafe: true,
    prescriptionRequired: false,
    price: 14.99,
    availability: "available"
  },
  {
    name: "Birth Control Pills",
    genericName: "Combined Oral Contraceptive",
    category: "contraceptive",
    manufacturer: "Various",
    description: "Hormonal contraceptive containing estrogen and progestin to prevent pregnancy.",
    uses: ["Pregnancy prevention", "Menstrual cycle regulation", "Acne treatment", "PCOS management"],
    sideEffects: ["Nausea", "Breast tenderness", "Mood changes", "Headaches"],
    dosage: {
      adult: "One pill daily at the same time",
      children: "Not recommended",
      elderly: "Not applicable"
    },
    precautions: ["Take at same time daily", "May increase blood clot risk", "Not for smokers over 35"],
    contraindications: ["Pregnancy", "History of blood clots", "Breast cancer", "Uncontrolled hypertension"],
    pregnancyCategory: "X",
    breastfeedingSafe: false,
    prescriptionRequired: true,
    price: 25.99,
    availability: "available"
  }
];

const articles = [
  {
    title: "Understanding Your Menstrual Cycle: A Complete Guide",
    category: "reproductive_health",
    content: "Your menstrual cycle is more than just your period. It's a complex process involving hormones, ovulation, and physical changes. Understanding each phase can help you better manage symptoms and track your fertility...",
    excerpt: "Learn about the four phases of your menstrual cycle and how to track them effectively for better health management.",
    tags: ["menstrual cycle", "period", "hormones", "ovulation"],
    authorName: "Dr. Aarogini Team",
    readTime: 5,
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date()
  },
  {
    title: "10 Natural Remedies for Period Cramps",
    category: "wellness",
    content: "Period cramps affect millions of women worldwide. While medication can help, there are many natural remedies that can provide relief. From heat therapy to herbal teas, discover what works best for you...",
    excerpt: "Discover effective natural ways to manage menstrual cramps without relying solely on medication.",
    tags: ["period cramps", "natural remedies", "pain relief", "wellness"],
    authorName: "Aarogini Wellness Team",
    readTime: 4,
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date()
  },
  {
    title: "Mental Health and Hormones: The Connection",
    category: "mental_health",
    content: "Hormonal changes throughout your menstrual cycle can significantly impact your mood and mental health. Understanding this connection is key to managing emotional wellbeing...",
    excerpt: "Explore how hormonal fluctuations affect your mental health and learn strategies to maintain emotional balance.",
    tags: ["mental health", "hormones", "mood", "wellness"],
    authorName: "Dr. Aarogini Team",
    readTime: 6,
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date()
  },
  {
    title: "Nutrition for a Healthy Menstrual Cycle",
    category: "nutrition",
    content: "What you eat can significantly impact your menstrual health. Certain nutrients are essential for hormone balance and can help reduce PMS symptoms...",
    excerpt: "Learn which foods support hormonal balance and can help ease menstrual symptoms.",
    tags: ["nutrition", "diet", "hormones", "PMS"],
    authorName: "Aarogini Nutrition Team",
    readTime: 5,
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date()
  },
  {
    title: "Stress Management Techniques for Women",
    category: "mental_health",
    content: "Chronic stress affects women's health in unique ways. Learn effective techniques to manage stress and improve your overall wellbeing...",
    excerpt: "Practical stress management strategies designed specifically for women's health needs.",
    tags: ["stress", "mental health", "wellness", "self-care"],
    authorName: "Aarogini Wellness Team",
    readTime: 7,
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date()
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Medicine.deleteMany();
    await Article.deleteMany();

    // Insert medicines
    console.log('💊 Seeding medicines...');
    await Medicine.insertMany(medicines);
    console.log(`✅ Added ${medicines.length} medicines`);

    // Insert articles
    console.log('📰 Seeding articles...');
    await Article.insertMany(articles);
    console.log(`✅ Added ${articles.length} articles`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
