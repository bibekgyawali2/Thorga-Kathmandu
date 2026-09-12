const { Client } = require("pg");

const members = [
  {
    name_en: "Dr. Ram Chandra Gyawali",
    name_ne: "डा. रामचन्द्र ज्ञवाली",
    role_en: "President",
    role_ne: "अध्यक्ष",
    committee_type: "current",
    tenure_en: "2081 - 2084 BS",
    tenure_ne: "२०८१ - २०८४",
    phone: "+977 9851012345",
    email: "president@thorgaktm.org.np",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    bio_en: "Senior educator and social worker leading village education and healthcare liaison programs.",
    bio_ne: "वरिष्ठ शिक्षासेवी तथा सामाजिक अभियन्ता, गाउँको शिक्षा र स्वास्थ्य पूर्वाधार विकासमा समर्पित।",
    display_order: 1
  },
  {
    name_en: "Shanta Pandey",
    name_ne: "शान्ता पाण्डे",
    role_en: "Vice President",
    role_ne: "उपाध्यक्ष",
    committee_type: "current",
    tenure_en: "2081 - 2084 BS",
    tenure_ne: "२०८१ - २०८४",
    phone: "+977 9841234567",
    email: "vicepresident@thorgaktm.org.np",
    photo_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    bio_en: "Community organizer focusing on women leadership and youth scholarship coordination.",
    bio_ne: "महिला सशक्तीकरण तथा युवा छात्रवृत्ति समन्वयमा सक्रिय अभियन्ता।",
    display_order: 2
  },
  {
    name_en: "Bishnu Prasad Bhattarai",
    name_ne: "विष्णु प्रसाद भट्टराई",
    role_en: "General Secretary",
    role_ne: "महासचिव",
    committee_type: "current",
    tenure_en: "2081 - 2084 BS",
    tenure_ne: "२०८१ - २०८४",
    phone: "+977 9851122334",
    email: "secretary@thorgaktm.org.np",
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    bio_en: "Overseeing executive administration, member relations, and documentation.",
    bio_ne: "संस्थाको दैनिक प्रशासनिक कार्य, सदस्यता विस्तार तथा संस्थागत सम्बन्ध व्यवस्थापन।",
    display_order: 3
  },
  {
    name_en: "Gita Regmi Gyawali",
    name_ne: "गीता रेग्मी ज्ञवाली",
    role_en: "Treasurer",
    role_ne: "कोषाध्यक्ष",
    committee_type: "current",
    tenure_en: "2081 - 2084 BS",
    tenure_ne: "२०८१ - २०८४",
    phone: "+977 9841987654",
    email: "treasurer@thorgaktm.org.np",
    photo_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    bio_en: "Managing financial audits, social welfare funds, and emergency relief grants.",
    bio_ne: "पारदर्शी आर्थिक व्यवस्थापन, सामाजिक कल्याण कोष तथा आकस्मिक राहत कोष परिचालन।",
    display_order: 4
  },
  {
    name_en: "Prof. Keshav Raj Regmi",
    name_ne: "प्रा. केशव राज रेग्मी",
    role_en: "Chief Advisor",
    role_ne: "प्रमुख सल्लाहकार",
    committee_type: "advisor",
    tenure_en: "Current",
    tenure_ne: "हाल",
    phone: "+977 9851000111",
    email: "advisor@thorgaktm.org.np",
    photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
    bio_en: "Former university dean advising on organizational governance and cultural preservation.",
    bio_ne: "संस्थागत सुशासन तथा सांस्कृतिक धरोहर संरक्षणमा मार्गदर्शक।",
    display_order: 5
  },
  {
    name_en: "Mukunda Prasad Gyawali",
    name_ne: "मुकुन्द प्रसाद ज्ञवाली",
    role_en: "Past President",
    role_ne: "पूर्व अध्यक्ष (संस्थापक)",
    committee_type: "past",
    tenure_en: "2058 - 2062 BS",
    tenure_ne: "२०५८ - २०६२",
    phone: "+977 9851098765",
    email: "mukunda.g@gmail.com",
    photo_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    bio_en: "Founding convener who unified Thorga families residing in Kathmandu.",
    bio_ne: "काठमाडौँमा रहेका सम्पूर्ण थोर्गाबासीलाई पहिलोपटक एकताबद्ध गर्ने संस्थापक संयोजक।",
    display_order: 6
  }
];

const publications = [
  {
    title_en: "Thorga Souvenir 2081 (Special Edition)",
    title_ne: "थोर्गा स्मारिका २०८१ (विशेष अङ्क)",
    category_en: "Annual Souvenir",
    category_ne: "वार्षिक स्मारिका",
    published_year_en: "2081 BS",
    published_year_ne: "२०८१",
    file_size: "14.2 MB",
    pages: 120,
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    cover_image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    description_en: "Comprehensive annual souvenir featuring history, village literature, demographic records, and youth achievements.",
    description_ne: "थोर्गाको इतिहास, साहित्यिक सिर्जना, सामाजिक योगदान तथा वार्षिक गतिविधि समेटिएको आधिकारिक स्मारिका।"
  },
  {
    title_en: "Constitution & By-Laws of Manch (Revised)",
    title_ne: "मञ्चको संशोधित विधान तथा नियमावली २०७९",
    category_en: "Constitution & By-Laws",
    category_ne: "विधान तथा नियमावली",
    published_year_en: "2079 BS",
    published_year_ne: "२०७९",
    file_size: "3.8 MB",
    pages: 36,
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    cover_image_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80",
    description_en: "Registered constitutional provisions, member code of conduct, and organizational bylaws.",
    description_ne: "नेपाल सरकारबाट स्वीकृत संस्थाको विधान, सदस्यता नियमावली तथा कार्यविधि।"
  },
  {
    title_en: "Annual Audit & Financial Report FY 2080/81",
    title_ne: "वार्षिक लेखापरीक्षण प्रतिवेदन आ.व. २०८०/८१",
    category_en: "Audit Report",
    category_ne: "लेखापरीक्षण प्रतिवेदन",
    published_year_en: "2081 BS",
    published_year_ne: "२०८१",
    file_size: "2.5 MB",
    pages: 28,
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    cover_image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    description_en: "Certified financial disclosure of social welfare fund, scholarships, and expenditure.",
    description_ne: "रजिस्टर्ड चार्टर्ड एकाउन्टेन्टद्वारा प्रमाणित संस्थाको सम्पूर्ण आय-व्यय तथा सामाजिक कल्याण कोषको हिसाब।"
  }
];

const events = [
  {
    title_en: "24th Annual General Assembly & Cultural Gathering",
    title_ne: "२४औँ वार्षिक साधारण सभा तथा सांस्कृतिक मिलन",
    date_en: "September 28, 2026",
    date_ne: "असोज १२, २०८१",
    time_en: "11:00 AM onwards",
    time_ne: "बिहान ११:०० बजे",
    location_en: "Nepal Academy Hall, Kamaladi, Kathmandu",
    location_ne: "नेपाल प्रज्ञा-प्रतिष्ठान, कमलादी, काठमाडौँ",
    description_en: "Annual general assembly, presentation of annual reports, felicitation of senior citizens, and cultural programs.",
    description_ne: "वार्षिक साधारण सभा, प्रगति प्रतिवेदन प्रस्तुति, ज्येष्ठ नागरिक सम्मान तथा विविध सांस्कृतिक कार्यक्रम।",
    status: "upcoming",
    category_en: "",
    category_ne: "",
    image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80"
  },
  {
    title_en: "Free Health Checkup and Blood Donation Drive",
    title_ne: "निःशुल्क स्वास्थ्य शिविर तथा रक्तदान कार्यक्रम",
    date_en: "November 14, 2026",
    date_ne: "कात्तिक २९, २०८१",
    time_en: "8:00 AM - 2:00 PM",
    time_ne: "बिहान ८:०० देखि दिउँसो २:००",
    location_en: "Thorga Health Post, Ruru-2, Gulmi",
    location_ne: "थोर्गा स्वास्थ्य चौकी, रुरु-२, गुल्मी",
    description_en: "Specialist health screening for village residents in collaboration with Kathmandu medical specialists.",
    description_ne: "काठमाडौँका वरिष्ठ विशेषज्ञ चिकित्सकहरूको सहभागितामा गाउँमै बृहत् स्वास्थ्य परीक्षण तथा रक्तदान।",
    status: "upcoming",
    category_en: "Health Camp",
    category_ne: "स्वास्थ्य शिविर",
    image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80"
  }
];

const gallery = [
  {
    title_en: "Thorga Secondary School Library Handover",
    title_ne: "थोर्गा माध्यमिक विद्यालयमा पुस्तकालय सामग्री हस्तान्तरण",
    category_en: "Education",
    category_ne: "शिक्षा",
    image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    date_en: "May 2026",
    date_ne: "जेठ २०८१"
  },
  {
    title_en: "Ruru Kshetra Historic Temple Preservation",
    title_ne: "रुरु क्षेत्र ऐतिहासिक मन्दिर परिसर संरक्षण अभियान",
    category_en: "Culture",
    category_ne: "संस्कृति",
    image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
    date_en: "March 2026",
    date_ne: "चैत्र २०८०"
  },
  {
    title_en: "Village Drinking Water Pipeline Inspection",
    title_ne: "थोर्गा खानेपानी आयोजनाको स्थलगत अनुगमन",
    category_en: "Development",
    category_ne: "विकास निर्माण",
    image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    date_en: "January 2026",
    date_ne: "माघ २०८०"
  }
];

async function seed() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || "50y150p0WOWZzdmc";
  const projectRef = "xyefqkdvtvudqbiqpqmy";
  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase. Seeding data...");

    // Seed Members
    for (const m of members) {
      await client.query(`
        INSERT INTO public.members (name_en, name_ne, role_en, role_ne, committee_type, tenure_en, tenure_ne, phone, email, photo_url, bio_en, bio_ne, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [m.name_en, m.name_ne, m.role_en, m.role_ne, m.committee_type, m.tenure_en, m.tenure_ne, m.phone, m.email, m.photo_url, m.bio_en, m.bio_ne, m.display_order]);
    }
    console.log(`Seeded ${members.length} members.`);

    // Seed Publications
    for (const p of publications) {
      await client.query(`
        INSERT INTO public.publications (title_en, title_ne, category_en, category_ne, published_year_en, published_year_ne, file_size, pages, pdf_url, cover_image_url, description_en, description_ne)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [p.title_en, p.title_ne, p.category_en, p.category_ne, p.published_year_en, p.published_year_ne, p.file_size, p.pages, p.pdf_url, p.cover_image_url, p.description_en, p.description_ne]);
    }
    console.log(`Seeded ${publications.length} publications.`);

    // Seed Events
    for (const e of events) {
      await client.query(`
        INSERT INTO public.events (title_en, title_ne, date_en, date_ne, time_en, time_ne, location_en, location_ne, description_en, description_ne, status, category_en, category_ne, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [e.title_en, e.title_ne, e.date_en, e.date_ne, e.time_en, e.time_ne, e.location_en, e.location_ne, e.description_en, e.description_ne, e.status, e.category_en, e.category_ne, e.image_url]);
    }
    console.log(`Seeded ${events.length} events.`);

    // Seed Gallery
    for (const g of gallery) {
      await client.query(`
        INSERT INTO public.gallery (title_en, title_ne, category_en, category_ne, image_url, date_en, date_ne)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [g.title_en, g.title_ne, g.category_en, g.category_ne, g.image_url, g.date_en, g.date_ne]);
    }
    console.log(`Seeded ${gallery.length} gallery items.`);

    console.log("Database seeded successfully with initial authentic records!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await client.end();
  }
}

seed();
