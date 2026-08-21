export type Language = "en" | "ne";

export interface Member {
  id: string;
  nameEn: string;
  nameNe: string;
  roleEn: string;
  roleNe: string;
  committeeType: "current" | "past" | "advisor";
  tenureEn?: string;
  tenureNe?: string;
  phone?: string;
  email?: string;
  photoUrl: string;
  bioEn?: string;
  bioNe?: string;
  order: number;
}

export interface EventItem {
  id: string;
  titleEn: string;
  titleNe: string;
  dateEn: string;
  dateNe: string;
  timeEn: string;
  timeNe: string;
  locationEn: string;
  locationNe: string;
  descriptionEn: string;
  descriptionNe: string;
  status: "upcoming" | "completed";
  categoryEn: string;
  categoryNe: string;
  imageUrl: string;
}

export interface Publication {
  id: string;
  titleEn: string;
  titleNe: string;
  categoryEn: string;
  categoryNe: string;
  publishedYearEn: string;
  publishedYearNe: string;
  fileSize: string;
  pages: number;
  pdfUrl: string;
  coverImageUrl?: string;
  descriptionEn: string;
  descriptionNe: string;
}

export interface GalleryItem {
  id: string;
  titleEn: string;
  titleNe: string;
  categoryEn: string;
  categoryNe: string;
  imageUrl: string;
  dateEn: string;
  dateNe: string;
}

export const initialMembers: Member[] = [
  {
    id: "m-1",
    nameEn: "Dr. Ram Chandra Gyawali",
    nameNe: "डा. राम चन्द्र ज्ञवाली",
    roleEn: "President",
    roleNe: "अध्यक्ष",
    committeeType: "current",
    tenureEn: "2024 to Present",
    tenureNe: "२०८१ देखि हालसम्म",
    phone: "+977 9851012345",
    email: "president@thorgaktm.org.np",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    bioEn: "Dedicated social leader advocating for regional health, education, and village liaison.",
    bioNe: "गाउँ र काठमाडौँबीचको सम्बन्ध विस्तार तथा सामाजिक विकासमा क्रियाशील नेतृत्व।",
    order: 1,
  },
  {
    id: "m-2",
    nameEn: "Mrs. Shanta Pandey",
    nameNe: "शान्ता पाण्डे",
    roleEn: "Vice President",
    roleNe: "उपाध्यक्ष",
    committeeType: "current",
    tenureEn: "2024 to Present",
    tenureNe: "२०८१ देखि हालसम्म",
    phone: "+977 9841234567",
    email: "vp@thorgaktm.org.np",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    bioEn: "Leading women empowerment initiatives and rural scholarship coordination.",
    bioNe: "महिला सशक्तिकरण तथा ग्रामीण छात्रवृत्ति कार्यक्रमको संयोजक।",
    order: 2,
  },
  {
    id: "m-3",
    nameEn: "Mr. Bishnu Prasad Bhattarai",
    nameNe: "विष्णु प्रसाद भट्टराई",
    roleEn: "General Secretary",
    roleNe: "महासचिव",
    committeeType: "current",
    tenureEn: "2024 to Present",
    tenureNe: "२०८१ देखि हालसम्म",
    phone: "+977 9851122334",
    email: "secretary@thorgaktm.org.np",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    bioEn: "Managing administrative affairs, publication archives, and official communications.",
    bioNe: "प्रशासनिक कार्य, अभिलेखीकरण तथा संगठनात्मक सञ्चार व्यवस्थापन।",
    order: 3,
  },
  {
    id: "m-4",
    nameEn: "Mr. Narayan Sharma",
    nameNe: "नारायण शर्मा",
    roleEn: "Treasurer",
    roleNe: "कोषाध्यक्ष",
    committeeType: "current",
    tenureEn: "2024 to Present",
    tenureNe: "२०८१ देखि हालसम्म",
    phone: "+977 9841987654",
    email: "treasurer@thorgaktm.org.np",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    bioEn: "Overseeing non-profit financial transparency, donation records, and audits.",
    bioNe: "संस्थाको आर्थिक पारदर्शीता, कोष व्यवस्थापन तथा लेखा परीक्षण सुपरिवेक्षण।",
    order: 4,
  },
  {
    id: "m-5",
    nameEn: "Ms. Radhika Gautam",
    nameNe: "राधिका गौतम",
    roleEn: "Secretary",
    roleNe: "सचिव",
    committeeType: "current",
    tenureEn: "2024 to Present",
    tenureNe: "२०८१ देखि हालसम्म",
    phone: "+977 9851098765",
    email: "radhika@thorgaktm.org.np",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    bioEn: "Coordinating youth outreach and social welfare programs.",
    bioNe: "युवा परिचालन तथा सामाजिक कल्याण कार्यक्रम संयोजन।",
    order: 5,
  },
  {
    id: "m-6",
    nameEn: "Prof. Dr. Keshav Raj Regmi",
    nameNe: "प्रा. डा. केशव राज रेग्मी",
    roleEn: "Chief Advisory Council",
    roleNe: "प्रमुख सल्लाहकार",
    committeeType: "advisor",
    tenureEn: "Founding Advisor",
    tenureNe: "संस्थापक सल्लाहकार",
    phone: "+977 9841112233",
    email: "advisory@thorgaktm.org.np",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
    bioEn: "Senior academician providing policy guidance for regional educational development.",
    bioNe: "क्षेत्रीय शैक्षिक विकास तथा संस्थागत मार्गनिर्देशनमा संलग्न।",
    order: 6,
  },
  {
    id: "m-7",
    nameEn: "Mr. Dilli Ram Gyawali",
    nameNe: "डिल्ली राम ज्ञवाली",
    roleEn: "Past President",
    roleNe: "पूर्व अध्यक्ष",
    committeeType: "past",
    tenureEn: "2020 to 2024",
    tenureNe: "२०७७ देखि २०८१",
    phone: "+977 9851000001",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    bioEn: "Led major road expansion and village health infrastructure initiatives.",
    bioNe: "गाउँको सडक विस्तार तथा स्वास्थ्य शिविर कार्यक्रमको सफल नेतृत्व।",
    order: 7,
  },
  {
    id: "m-8",
    nameEn: "Mr. Hari Prasad Bhattarai",
    nameNe: "हरि प्रसाद भट्टराई",
    roleEn: "Past President",
    roleNe: "पूर्व अध्यक्ष",
    committeeType: "past",
    tenureEn: "2016 to 2020",
    tenureNe: "२०७३ देखि २०७७",
    phone: "+977 9851000002",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    bioEn: "Spearheaded disaster relief funds and Kathmandu community center planning.",
    bioNe: "विपद् व्यवस्थापन कोष तथा काठमाडौँ सम्पर्क केन्द्र योजनाको थालनी।",
    order: 8,
  },
];

export const initialEvents: EventItem[] = [
  {
    id: "e-1",
    titleEn: "Annual General Meeting (AGM) 2081 & Cultural Gathering",
    titleNe: "वार्षिक साधारण सभा २०८१ तथा सांस्कृतिक भेला",
    dateEn: "September 28, 2026",
    dateNe: "असोज १२, २०८१",
    timeEn: "11:00 AM onwards",
    timeNe: "बिहान ११:०० बजेदेखि",
    locationEn: "Staff College Hall, Jawalakhel, Lalitpur",
    locationNe: "स्टाफ कलेज हल, जावलाखेल, ललितपुर",
    descriptionEn: "Gathering of all native residents of Thorga residing in Kathmandu valley for annual financial reports, executive elections, and fellowship lunch.",
    descriptionNe: "काठमाडौँ उपत्यकामा बसोबास गर्ने समस्त थोर्गाबासीहरुको वार्षिक प्रतिवेदन प्रस्तुति, निर्वाचन तथा शुभकामना आदानप्रदान कार्यक्रम।",
    status: "upcoming",
    categoryEn: "General Assembly",
    categoryNe: "साधारण सभा",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "e-2",
    titleEn: "Free Rural Health and Eye Camp in Thorga Village",
    titleNe: "थोर्गा गाउँमा निःशुल्क स्वास्थ्य तथा आँखा शिविर",
    dateEn: "November 14, 2026",
    dateNe: "कात्तिक २९, २०८१",
    timeEn: "09:00 AM to 05:00 PM",
    timeNe: "बिहान ९:०० देखि साँझ ५:०० सम्म",
    locationEn: "Thorga Secondary School Campus, Gulmi",
    locationNe: "थोर्गा माध्यमिक विद्यालय प्राङ्गण, गुल्मी",
    descriptionEn: "Specialist medical consultation, free prescription medicines, and cataract screenings organized by our medical subcommittee.",
    descriptionNe: "विशेषज्ञ चिकित्सकहरुबाट स्वास्थ्य परीक्षण, निःशुल्क औषधि वितरण तथा मोतियाबिन्दु पहिचान शिविर।",
    status: "upcoming",
    categoryEn: "Health & Welfare",
    categoryNe: "स्वास्थ्य तथा सेवा",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "e-3",
    titleEn: "Community Blood Donation Program",
    titleNe: "बृहत् रक्तदान तथा सचेतना कार्यक्रम",
    dateEn: "May 10, 2026",
    dateNe: "वैशाख २८, २०८१",
    timeEn: "08:00 AM to 02:00 PM",
    timeNe: "बिहान ८:०० देखि दिउँसो २:०० सम्म",
    locationEn: "Shankhamul Community Grounds, Kathmandu",
    locationNe: "शंखमूल सामुदायिक भवन, काठमाडौँ",
    descriptionEn: "Successfully collected 114 pints of blood in technical collaboration with the Central Blood Transfusion Service.",
    descriptionNe: "नेपाल रेडक्रस सोसाइटीको प्राविधिक सहयोगमा ११४ पिन्ट रगत संकलन सम्पन्न।",
    status: "completed",
    categoryEn: "Social Service",
    categoryNe: "सामाजिक सेवा",
    imageUrl: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80",
  },
];

export const initialPublications: Publication[] = [
  {
    id: "pub-1",
    titleEn: "Thorga Smarika (Annual Souvenir) Vol. 14",
    titleNe: "थोर्गा स्मारिका (वार्षिक मुखपत्र) पूर्णाङ्क १४",
    categoryEn: "Annual Souvenir",
    categoryNe: "वार्षिक स्मारिका",
    publishedYearEn: "2081 BS (2024)",
    publishedYearNe: "२०८१",
    fileSize: "8.4 MB",
    pages: 96,
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    descriptionEn: "Comprehensive annual publication featuring regional history, creative essays, member directory, and development milestones.",
    descriptionNe: "थोर्गाको इतिहास, साहित्यिक रचना, सदस्यता विवरण तथा वर्षभरिका विकास निर्माणका गतिविधिको संगालो।",
  },
  {
    id: "pub-2",
    titleEn: "Constitution and By-Laws of the Manch",
    titleNe: "मञ्चको आधिकारिक विधान तथा कार्यविधि",
    categoryEn: "Constitution",
    categoryNe: "विधान तथा नियम",
    publishedYearEn: "2079 BS (Amended)",
    publishedYearNe: "२०७९ (संशोधित)",
    fileSize: "2.1 MB",
    pages: 28,
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
    descriptionEn: "Official regulatory guidelines, membership criteria, election procedures, and fund operational protocols.",
    descriptionNe: "संस्था दर्ता ऐन अनुसार अनुमोदित विधान, सदस्यता नियमावली तथा आर्थिक कार्यविधि।",
  },
  {
    id: "pub-3",
    titleEn: "Audit and Financial Statement 2080/81",
    titleNe: "वार्षिक लेखापरीक्षण प्रतिवेदन २०८०/८१",
    categoryEn: "Financial Report",
    categoryNe: "आर्थिक प्रतिवेदन",
    publishedYearEn: "2081 BS",
    publishedYearNe: "२०८१",
    fileSize: "1.6 MB",
    pages: 18,
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    descriptionEn: "Audited balance sheet, income expenditures, social welfare fund breakdown, and registered auditor certification.",
    descriptionNe: "प्रमाणित लेखापरीक्षकबाट अनुमोदित आम्दानी खर्च विवरण तथा सामाजिक राहत कोषको स्थिति।",
  },
];

export const initialGallery: GalleryItem[] = [
  {
    id: "g-1",
    titleEn: "Village Scholarship Distribution in Thorga",
    titleNe: "थोर्गामा जेहेन्दार छात्रवृत्ति वितरण कार्यक्रम",
    categoryEn: "Education",
    categoryNe: "शिक्षा",
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    dateEn: "April 2026",
    dateNe: "वैशाख २०८१",
  },
  {
    id: "g-2",
    titleEn: "Kathmandu Community Meetup & Teej Celebration",
    titleNe: "काठमाडौँ भेला तथा तीज मिलन कार्यक्रम",
    categoryEn: "Culture",
    categoryNe: "संस्कृति",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    dateEn: "August 2026",
    dateNe: "भाद्र २०८१",
  },
  {
    id: "g-3",
    titleEn: "Thorga Rural Drinking Water Project Inauguration",
    titleNe: "थोर्गा खानेपानी तथा सरसफाइ आयोजना उद्घाटन",
    categoryEn: "Development",
    categoryNe: "विकास",
    imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
    dateEn: "February 2026",
    dateNe: "फागुन २०८०",
  },
  {
    id: "g-4",
    titleEn: "Tree Plantation & Environmental Awareness Drive",
    titleNe: "वृक्षारोपण तथा वातावरण संरक्षण अभियान",
    categoryEn: "Environment",
    categoryNe: "वातावरण",
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    dateEn: "June 2026",
    dateNe: "असार २०८१",
  },
];
