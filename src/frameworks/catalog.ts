import type { CategoryKey, FrameworkMeta, L, Stage } from "./types";

// Content from "Business Frameworks Cheat Sheet" (Oct 22, 2026).

export const CATEGORIES: { key: CategoryKey; name: L; question: L }[] = [
  {
    key: "market",
    name: { th: "ตลาดและสภาพแวดล้อม", en: "Market & environment" },
    question: { th: "เราเล่นอยู่ในสนามแบบไหน", en: "What field are we playing in?" },
  },
  {
    key: "customer",
    name: { th: "ลูกค้าและคุณค่า", en: "Customers & value" },
    question: { th: "ใครจ่ายเงิน และจ่ายเพื่ออะไร", en: "Who pays, and what for?" },
  },
  {
    key: "model",
    name: { th: "โมเดลธุรกิจและตัวเลข", en: "Business model & numbers" },
    question: { th: "ธุรกิจนี้ทำเงินได้จริงไหม", en: "Does this business really make money?" },
  },
  {
    key: "strategy",
    name: { th: "กลยุทธ์และการแข่งขัน", en: "Strategy & competition" },
    question: { th: "เราจะชนะด้วยอะไร", en: "How will we win?" },
  },
  {
    key: "innovation",
    name: { th: "นวัตกรรมและการทดสอบ", en: "Innovation & testing" },
    question: { th: "สิ่งที่เราเชื่อเป็นจริงไหม", en: "Is what we believe actually true?" },
  },
  {
    key: "growth",
    name: { th: "การเติบโตและการตลาด", en: "Growth & marketing" },
    question: { th: "ได้ลูกค้าและรักษาลูกค้าอย่างไร", en: "How do we win and keep customers?" },
  },
  {
    key: "execution",
    name: { th: "การบริหารและการลงมือทำ", en: "Management & execution" },
    question: { th: "ทำให้เกิดขึ้นจริงอย่างไร", en: "How do we make it happen?" },
  },
  {
    key: "thinking",
    name: { th: "วิธีคิดและแก้ปัญหา", en: "Thinking & problem solving" },
    question: { th: "ใช้ได้กับทุกหมวดข้างบน", en: "Works with every category above" },
  },
];

export const STAGES: { key: Stage; name: L; question: L }[] = [
  {
    key: "startup",
    name: { th: "Startup ก่อน product-market fit", en: "Startup before product-market fit" },
    question: { th: "มีคนต้องการสิ่งนี้จริงไหม", en: "Do people really want this?" },
  },
  {
    key: "sme",
    name: { th: "SME ที่ต้องการโตอย่างมั่นคง", en: "SME growing steadily" },
    question: { th: "โตแล้วกำไรและเงินสดยังดีไหม", en: "As we grow, are profit and cash still healthy?" },
  },
  {
    key: "enterprise",
    name: { th: "องค์กรใหญ่หรือหลายสายธุรกิจ", en: "Large or multi-business company" },
    question: {
      th: "จะจัดสรรทรัพยากรและรักษาความได้เปรียบอย่างไร",
      en: "How do we allocate resources and keep our advantage?",
    },
  },
];

const ALL: Stage[] = ["startup", "sme", "enterprise"];

export const CATALOG: FrameworkMeta[] = [
  // 1. Market & environment
  {
    key: "pestel",
    category: "market",
    name: { th: "PESTEL", en: "PESTEL" },
    question: { th: "ปัจจัยมหภาคอะไรกระทบธุรกิจ", en: "Which macro factors affect the business?" },
    howTo: {
      th: "ไล่ 6 ด้าน: การเมือง เศรษฐกิจ สังคม เทคโนโลยี สิ่งแวดล้อม กฎหมาย แล้วเลือก 2–3 ปัจจัยที่กระทบจริง",
      en: "Go through 6 areas: political, economic, social, technological, environmental, legal. Then pick the 2–3 factors that really matter.",
    },
    trap: {
      th: "ลิสต์ทุกอย่างจนไม่มีลำดับความสำคัญ",
      en: "Listing everything with no priorities.",
    },
    stagePicks: [],
    stages: ["sme", "enterprise"],
    keywords: ["กฎหมาย", "นโยบาย", "เศรษฐกิจ", "ภาษี", "regulation", "macro", "เทรนด์", "trend", "สังคม", "เทคโนโลยี", "สิ่งแวดล้อม"],
  },
  {
    key: "five-forces",
    category: "market",
    name: { th: "Porter's Five Forces", en: "Porter's Five Forces" },
    question: {
      th: "อุตสาหกรรมนี้น่าเล่นไหม กำไรไหลไปที่ใคร",
      en: "Is this industry attractive? Who captures the profit?",
    },
    howTo: {
      th: "ประเมินแรงกดดัน 5 ด้าน: คู่แข่งเดิม ผู้เล่นใหม่ สินค้าทดแทน อำนาจซัพพลายเออร์ อำนาจลูกค้า",
      en: "Rate 5 pressures: existing rivals, new entrants, substitutes, supplier power, buyer power.",
    },
    trap: {
      th: "มองแค่คู่แข่งตรง ลืมสินค้าทดแทน",
      en: "Looking only at direct rivals and forgetting substitutes.",
    },
    stagePicks: [],
    stages: ALL,
    keywords: ["อุตสาหกรรม", "industry", "คู่แข่ง", "competitor", "ซัพพลายเออร์", "supplier", "อำนาจต่อรอง", "สินค้าทดแทน", "น่าลงทุน", "margin"],
  },
  {
    key: "tam-sam-som",
    category: "market",
    name: { th: "TAM / SAM / SOM", en: "TAM / SAM / SOM" },
    question: {
      th: "ตลาดใหญ่แค่ไหน ส่วนที่เข้าถึงได้จริงเท่าไร",
      en: "How big is the market, and how much can we really reach?",
    },
    howTo: {
      th: "TAM ตลาดทั้งหมด → SAM ส่วนที่โมเดลเราเสิร์ฟได้ → SOM ส่วนที่ชิงได้ใน 2–3 ปี",
      en: "TAM is the whole market → SAM is what our model can serve → SOM is what we can win in 2–3 years.",
    },
    trap: {
      th: "ใช้แต่ top-down ควรคำนวณ bottom-up (จำนวนลูกค้า × ราคา) เทียบด้วย",
      en: "Using only top-down numbers. Also calculate bottom-up (customers × price) to compare.",
    },
    stagePicks: [],
    stages: ["startup", "sme"],
    keywords: ["ขนาดตลาด", "market size", "ตลาดใหญ่", "tam", "sam", "som", "ระดมทุน", "นักลงทุน", "investor", "ส่วนแบ่ง"],
  },

  // 2. Customers & value
  {
    key: "jtbd",
    category: "customer",
    name: { th: "Jobs-to-be-Done", en: "Jobs-to-be-Done" },
    question: { th: "ลูกค้า \"จ้าง\" สินค้าเราไปทำงานอะไร", en: "What job do customers \"hire\" our product to do?" },
    howTo: {
      th: "เขียนในรูป \"เมื่อ [สถานการณ์] ฉันอยากจะ [แรงจูงใจ] เพื่อที่จะ [ผลลัพธ์]\"",
      en: "Write it as \"When [situation], I want to [motivation], so I can [outcome].\"",
    },
    trap: {
      th: "ตอบเป็นฟีเจอร์ ไม่ใช่ความก้าวหน้าที่ลูกค้าต้องการ",
      en: "Answering with features instead of the progress the customer wants.",
    },
    stagePicks: ["startup"],
    stages: ALL,
    keywords: ["ต้องการ", "need", "ทำไมซื้อ", "ซื้อซ้ำ", "why buy", "แรงจูงใจ", "ไม่กลับมา", "retention", "เข้าใจลูกค้า"],
    topSeven: true,
  },
  {
    key: "vpc",
    category: "customer",
    name: { th: "Value Proposition Canvas", en: "Value Proposition Canvas" },
    question: { th: "สิ่งที่เสนอตรงกับ pain และ gain จริงไหม", en: "Does our offer match real pains and gains?" },
    howTo: {
      th: "ฝั่งลูกค้า: jobs, pains, gains → ฝั่งเรา: สินค้า, pain relievers, gain creators แล้วจับคู่",
      en: "Customer side: jobs, pains, gains → our side: products, pain relievers, gain creators. Then match them.",
    },
    trap: {
      th: "เติมฝั่งลูกค้าจากการเดา ไม่ได้ไปคุยจริง",
      en: "Filling the customer side from guesses instead of real conversations.",
    },
    stagePicks: [],
    stages: ["startup", "sme"],
    keywords: ["pain", "gain", "คุณค่า", "value", "จุดขาย", "ข้อเสนอ", "offer", "ตอบโจทย์", "product fit"],
  },
  {
    key: "journey-map",
    category: "customer",
    name: { th: "Customer Journey Map", en: "Customer Journey Map" },
    question: { th: "ลูกค้าเจอปัญหาหรือหลุดตรงไหน", en: "Where do customers struggle or drop off?" },
    howTo: {
      th: "ไล่ทุกขั้นตั้งแต่รู้จักจนใช้ซ้ำ บันทึก touchpoint ความรู้สึก และจุดติดขัด",
      en: "Walk every stage from first hearing of us to using us again. Note touchpoints, feelings and friction.",
    },
    trap: {
      th: "ทำแผนที่ \"ในอุดมคติ\" แทนเส้นทางที่เกิดขึ้นจริง",
      en: "Mapping the \"ideal\" path instead of what really happens.",
    },
    stagePicks: [],
    stages: ["sme", "enterprise"],
    keywords: ["หลุด", "drop", "ประสบการณ์", "experience", "touchpoint", "บริการ", "ร้องเรียน", "complaint", "ขั้นตอน", "journey"],
  },
  {
    key: "stp",
    category: "customer",
    name: { th: "STP", en: "STP" },
    question: {
      th: "เล่นกับลูกค้ากลุ่มไหน และยืนตรงไหนในใจเขา",
      en: "Which customers do we serve, and where do we stand in their minds?",
    },
    howTo: {
      th: "แบ่งกลุ่ม → เลือกกลุ่มเป้าหมาย → กำหนด positioning ที่ต่างจากคู่แข่ง",
      en: "Segment → pick a target → set a positioning that differs from competitors.",
    },
    trap: {
      th: "เลือกกลุ่มกว้างเกินไปเพราะกลัวเสียโอกาส",
      en: "Choosing too broad a segment out of fear of missing out.",
    },
    stagePicks: ["sme"],
    stages: ALL,
    keywords: ["กลุ่มเป้าหมาย", "target", "segment", "positioning", "แบรนด์", "brand", "ตำแหน่ง", "กลุ่มลูกค้า"],
  },

  // 3. Business model & numbers
  {
    key: "bmc",
    category: "model",
    name: { th: "Business Model Canvas", en: "Business Model Canvas" },
    question: {
      th: "ธุรกิจสร้าง ส่งมอบ และเก็บเกี่ยวคุณค่าอย่างไร",
      en: "How does the business create, deliver and capture value?",
    },
    howTo: {
      th: "เติม 9 ช่อง เริ่มจาก customer segments และ value proposition",
      en: "Fill the 9 blocks, starting with customer segments and value proposition.",
    },
    trap: {
      th: "กรอกแยกช่องโดยไม่เช็กว่าแต่ละช่องสอดคล้องกัน",
      en: "Filling blocks separately without checking that they fit together.",
    },
    stagePicks: ["sme"],
    stages: ALL,
    keywords: ["โมเดลธุรกิจ", "business model", "ภาพรวม", "overview", "รายได้", "revenue", "ช่องทาง", "channel", "พาร์ทเนอร์", "partner", "ธุรกิจใหม่"],
    topSeven: true,
  },
  {
    key: "lean-canvas",
    category: "model",
    name: { th: "Lean Canvas", en: "Lean Canvas" },
    question: { th: "ปัญหาอะไรที่คุ้มแก้ และเราได้เปรียบตรงไหน", en: "Which problem is worth solving, and where is our edge?" },
    howTo: {
      th: "เน้นช่อง problem, solution, key metrics, unfair advantage",
      en: "Focus on problem, solution, key metrics and unfair advantage.",
    },
    trap: {
      th: "เขียน unfair advantage ที่คู่แข่งลอกได้ง่าย",
      en: "Writing an unfair advantage that competitors can easily copy.",
    },
    stagePicks: ["startup"],
    stages: ["startup"],
    keywords: ["ไอเดีย", "idea", "startup", "สตาร์ทอัพ", "ปัญหา", "problem", "ธุรกิจใหม่", "เริ่มต้น", "unfair advantage"],
  },
  {
    key: "unit-economics",
    category: "model",
    name: { th: "Unit Economics", en: "Unit Economics" },
    question: { th: "ลูกค้าหนึ่งรายกำไรหรือขาดทุน", en: "Does one customer make or lose money?" },
    howTo: {
      th: "คำนวณ CAC, LTV, contribution margin และ payback period (เกณฑ์ทั่วไป LTV/CAC ≥ 3 และ payback ไม่เกิน 12–18 เดือน)",
      en: "Calculate CAC, LTV, contribution margin and payback period (common bar: LTV/CAC ≥ 3, payback within 12–18 months).",
    },
    trap: {
      th: "ใช้ค่าเฉลี่ยรวม ซ่อนช่องทางหรือกลุ่มที่ขาดทุน",
      en: "Using blended averages that hide loss-making channels or segments.",
    },
    stagePicks: ["sme"],
    stages: ALL,
    keywords: ["กำไร", "profit", "ขาดทุน", "loss", "cac", "ltv", "ต้นทุนหาลูกค้า", "ค่าโฆษณา", "margin", "คุ้มไหม", "payback", "ต่อหัว"],
    topSeven: true,
  },
  {
    key: "break-even",
    category: "model",
    name: { th: "Break-even และ Cash Runway", en: "Break-even & Cash Runway" },
    question: {
      th: "ต้องขายเท่าไรจึงอยู่รอด เงินสดพอใช้อีกกี่เดือน",
      en: "How much must we sell to survive, and how many months of cash are left?",
    },
    howTo: {
      th: "จุดคุ้มทุน = ต้นทุนคงที่ ÷ กำไรส่วนเกินต่อหน่วย; runway = เงินสด ÷ burn ต่อเดือน",
      en: "Break-even = fixed costs ÷ contribution per unit; runway = cash ÷ monthly burn.",
    },
    trap: {
      th: "ดูกำไรทางบัญชี แต่ไม่ดูเงินสดที่จมในลูกหนี้และสต็อก",
      en: "Watching accounting profit but not the cash tied up in receivables and stock.",
    },
    stagePicks: ["startup", "sme"],
    stages: ["startup", "sme"],
    keywords: ["คุ้มทุน", "break-even", "เงินสด", "cash", "runway", "burn", "อยู่รอด", "สภาพคล่อง", "ต้นทุนคงที่", "fixed cost"],
  },

  // 4. Strategy & competition
  {
    key: "swot-tows",
    category: "strategy",
    name: { th: "SWOT → TOWS", en: "SWOT → TOWS" },
    question: {
      th: "จุดแข็งและจุดอ่อนแปลงเป็นกลยุทธ์อะไรได้",
      en: "What strategies do our strengths and weaknesses lead to?",
    },
    howTo: {
      th: "จับคู่ S-O (รุก), W-O (ปรับปรุง), S-T (ป้องกัน), W-T (ถอยหรือลดความเสี่ยง)",
      en: "Pair S-O (attack), W-O (improve), S-T (defend), W-T (retreat or cut risk).",
    },
    trap: { th: "หยุดแค่ SWOT ซึ่งเป็นเพียงรายการ", en: "Stopping at SWOT, which is only a list." },
    stagePicks: [],
    stages: ALL,
    keywords: ["จุดแข็ง", "จุดอ่อน", "strength", "weakness", "swot", "โอกาส", "อุปสรรค", "threat", "วิเคราะห์ตัวเอง"],
  },
  {
    key: "playing-to-win",
    category: "strategy",
    name: { th: "Playing to Win", en: "Playing to Win" },
    question: { th: "กลยุทธ์ของเราคืออะไรในภาพรวม", en: "What is our strategy, overall?" },
    howTo: {
      th: "ตอบ 5 คำถามตามลำดับ: เป้าหมาย, เล่นที่ไหน, ชนะอย่างไร, ต้องมีความสามารถอะไร, ต้องมีระบบอะไร",
      en: "Answer 5 questions in order: aspiration, where to play, how to win, capabilities needed, systems needed.",
    },
    trap: {
      th: "ตอบ \"เล่นที่ไหน\" กว้างจนไม่ได้เลือกอะไรเลย",
      en: "Answering \"where to play\" so broadly that nothing is chosen.",
    },
    stagePicks: ["enterprise"],
    stages: ALL,
    keywords: ["กลยุทธ์", "strategy", "ทิศทาง", "direction", "วิสัยทัศน์", "vision", "เป้าหมาย", "โฟกัส", "focus", "เลือก"],
    topSeven: true,
  },
  {
    key: "blue-ocean",
    category: "strategy",
    name: { th: "Blue Ocean / ERRC", en: "Blue Ocean / ERRC" },
    question: { th: "จะหนีการแข่งขันด้านราคาได้อย่างไร", en: "How do we escape price competition?" },
    howTo: {
      th: "ระบุสิ่งที่จะตัด (Eliminate), ลด (Reduce), เพิ่ม (Raise), สร้างใหม่ (Create) เทียบมาตรฐานอุตสาหกรรม",
      en: "Name what to Eliminate, Reduce, Raise and Create compared with the industry standard.",
    },
    trap: { th: "เพิ่มอย่างเดียว ไม่กล้าตัดหรือลด", en: "Only adding, never daring to cut or reduce." },
    stagePicks: [],
    stages: ["sme", "enterprise"],
    keywords: ["สงครามราคา", "price war", "ตัดราคา", "แตกต่าง", "differentiate", "ราคา", "blue ocean", "แข่งขันสูง", "สินค้าเหมือนกัน"],
  },
  {
    key: "ansoff",
    category: "strategy",
    name: { th: "Ansoff Matrix", en: "Ansoff Matrix" },
    question: { th: "จะโตจากทางไหน และเสี่ยงแค่ไหน", en: "Where will growth come from, and how risky is it?" },
    howTo: {
      th: "4 ทาง: เจาะตลาดเดิม, พัฒนาสินค้าใหม่, ขยายตลาดใหม่, กระจายธุรกิจ (เสี่ยงสุด)",
      en: "4 paths: market penetration, product development, market development, diversification (riskiest).",
    },
    trap: {
      th: "กระโดดไปกระจายธุรกิจก่อนชนะตลาดเดิม",
      en: "Jumping into diversification before winning the current market.",
    },
    stagePicks: ["enterprise"],
    stages: ["sme", "enterprise"],
    keywords: ["ขยาย", "expand", "ตลาดใหม่", "new market", "สินค้าใหม่", "new product", "เติบโต", "ต่างประเทศ", "สาขา"],
  },
  {
    key: "seven-powers",
    category: "strategy",
    name: { th: "7 Powers", en: "7 Powers" },
    question: { th: "ความได้เปรียบที่ยั่งยืนคืออะไร", en: "What is our lasting advantage?" },
    howTo: {
      th: "เช็ก 7 แหล่ง: scale economies, network effects, counter-positioning, switching costs, branding, cornered resource, process power",
      en: "Check 7 sources: scale economies, network effects, counter-positioning, switching costs, branding, cornered resource, process power.",
    },
    trap: {
      th: "สับสนระหว่าง \"ทำได้ดี\" กับ \"คู่แข่งลอกไม่ได้\"",
      en: "Confusing \"we do it well\" with \"competitors can't copy it\".",
    },
    stagePicks: ["enterprise"],
    stages: ["sme", "enterprise"],
    keywords: ["ได้เปรียบ", "advantage", "moat", "ลอก", "copy", "ยั่งยืน", "คู่แข่งตามทัน", "จุดแข็งระยะยาว"],
  },
  {
    key: "bcg",
    category: "strategy",
    name: { th: "BCG Matrix", en: "BCG Matrix" },
    question: {
      th: "จัดสรรทรัพยากรระหว่างหลายธุรกิจอย่างไร",
      en: "How do we allocate resources across several businesses?",
    },
    howTo: {
      th: "แบ่งตามการเติบโตของตลาด × ส่วนแบ่ง: Stars, Cash Cows, Question Marks, Dogs",
      en: "Plot market growth × share: Stars, Cash Cows, Question Marks, Dogs.",
    },
    trap: {
      th: "ใช้กับธุรกิจที่มีสินค้าตัวเดียว ซึ่งไม่มีประโยชน์",
      en: "Using it for a single-product business, where it adds nothing.",
    },
    stagePicks: ["enterprise"],
    stages: ["enterprise"],
    keywords: ["หลายธุรกิจ", "portfolio", "พอร์ต", "หลายสินค้า", "จัดสรร", "allocate", "งบประมาณ", "ตัดสินค้า", "product line"],
  },

  // 5. Innovation & testing
  {
    key: "rat",
    category: "innovation",
    name: { th: "Riskiest Assumption Test", en: "Riskiest Assumption Test" },
    question: { th: "สมมติฐานข้อไหนถ้าผิดแล้วธุรกิจล้ม", en: "Which assumption, if wrong, would sink the business?" },
    howTo: {
      th: "ลิสต์สมมติฐาน จัดอันดับตามความเสี่ยง × ความไม่แน่นอน แล้วทดสอบข้อที่สูงสุดด้วยวิธีที่ถูกที่สุด",
      en: "List assumptions, rank by risk × uncertainty, then test the top one in the cheapest way.",
    },
    trap: { th: "ทดสอบข้อที่ง่ายก่อนเพราะสบายใจ", en: "Testing the easy ones first because it feels good." },
    stagePicks: ["startup"],
    stages: ["startup", "sme"],
    keywords: ["สมมติฐาน", "assumption", "ความเสี่ยง", "risk", "ทดสอบ", "test", "validate", "พิสูจน์", "ไม่แน่ใจ"],
  },
  {
    key: "lean-startup",
    category: "innovation",
    name: { th: "Lean Startup (Build–Measure–Learn)", en: "Lean Startup (Build–Measure–Learn)" },
    question: {
      th: "ทดสอบไอเดียโดยใช้ทรัพยากรน้อยที่สุดได้อย่างไร",
      en: "How do we test an idea with the fewest resources?",
    },
    howTo: {
      th: "ตั้งสมมติฐาน → สร้าง MVP → วัดผลด้วยตัวเลขที่ตั้งไว้ก่อน → ตัดสินใจ pivot หรือเดินต่อ",
      en: "Set a hypothesis → build an MVP → measure against numbers set in advance → decide to pivot or persevere.",
    },
    trap: {
      th: "MVP ใหญ่เกินไป หรือไม่ได้ตั้งเกณฑ์ผ่าน/ไม่ผ่านไว้ล่วงหน้า",
      en: "An MVP that is too big, or no pass/fail bar set in advance.",
    },
    stagePicks: [],
    stages: ["startup", "sme"],
    keywords: ["mvp", "ทดลอง", "experiment", "pivot", "ไอเดีย", "idea", "prototype", "ลองตลาด", "ทดสอบตลาด"],
  },
  {
    key: "design-thinking",
    category: "innovation",
    name: { th: "Design Thinking", en: "Design Thinking" },
    question: { th: "ปัญหาที่แท้จริงของผู้ใช้คืออะไร", en: "What is the user's real problem?" },
    howTo: {
      th: "Empathize → Define → Ideate → Prototype → Test",
      en: "Empathize → Define → Ideate → Prototype → Test.",
    },
    trap: {
      th: "ใช้เวลากับ ideation มาก แต่ข้ามการทดสอบกับผู้ใช้จริง",
      en: "Spending lots of time on ideation but skipping tests with real users.",
    },
    stagePicks: [],
    stages: ["startup", "sme"],
    keywords: ["ผู้ใช้", "user", "ux", "ออกแบบ", "design", "ปัญหาจริง", "empathy", "สัมภาษณ์", "interview"],
  },
  {
    key: "pmf",
    category: "innovation",
    name: { th: "PMF Test (Sean Ellis)", en: "PMF Test (Sean Ellis)" },
    question: { th: "ถึงเวลาเร่งการเติบโตหรือยัง", en: "Is it time to push for growth?" },
    howTo: {
      th: "ถามผู้ใช้ \"ถ้าใช้สินค้านี้ไม่ได้อีก จะรู้สึกอย่างไร\" ถ้า ≥ 40% ตอบ \"ผิดหวังมาก\" ถือเป็นสัญญาณที่ดี",
      en: "Ask users \"How would you feel if you could no longer use this?\" If ≥ 40% say \"very disappointed\", that's a good sign.",
    },
    trap: {
      th: "ถามผู้ใช้ที่ไม่ได้ใช้งานจริงอย่างสม่ำเสมอ",
      en: "Asking people who don't actually use it regularly.",
    },
    stagePicks: ["startup"],
    stages: ["startup"],
    keywords: ["product-market fit", "pmf", "เร่งโต", "scale", "พร้อมขยาย", "ผิดหวัง", "survey", "แบบสอบถาม"],
  },

  // 6. Growth & marketing
  {
    key: "aarrr",
    category: "growth",
    name: { th: "AARRR", en: "AARRR" },
    question: { th: "funnel รั่วตรงไหน", en: "Where does the funnel leak?" },
    howTo: {
      th: "วัด conversion แต่ละขั้น: Acquisition → Activation → Retention → Referral → Revenue แล้วแก้ขั้นที่รั่วมากที่สุด",
      en: "Measure conversion at each step: Acquisition → Activation → Retention → Referral → Revenue. Fix the leakiest step.",
    },
    trap: {
      th: "เทงบ acquisition ทั้งที่ retention ยังรั่ว",
      en: "Pouring budget into acquisition while retention still leaks.",
    },
    stagePicks: ["sme"],
    stages: ALL,
    keywords: ["funnel", "conversion", "ยอดขายตก", "รั่ว", "leak", "retention", "ลูกค้าหาย", "ไม่กลับมา", "ซื้อซ้ำ", "churn", "การตลาด"],
    topSeven: true,
  },
  {
    key: "growth-loops",
    category: "growth",
    name: { th: "Growth Loops", en: "Growth Loops" },
    question: { th: "การเติบโตส่งต่อตัวเองได้อย่างไร", en: "How can growth feed itself?" },
    howTo: {
      th: "ออกแบบวงจรที่ผลลัพธ์ของลูกค้ารายหนึ่งนำไปสู่ลูกค้ารายถัดไป เช่น referral หรือ content ที่ผู้ใช้สร้าง",
      en: "Design a loop where one customer's outcome brings the next customer, such as referrals or user-generated content.",
    },
    trap: { th: "เรียกแคมเปญครั้งเดียวว่าเป็น loop", en: "Calling a one-off campaign a loop." },
    stagePicks: [],
    stages: ["startup", "sme"],
    keywords: ["ปากต่อปาก", "referral", "viral", "บอกต่อ", "loop", "community", "ชุมชน", "content"],
  },
  {
    key: "marketing-mix",
    category: "growth",
    name: { th: "4P / 7P", en: "4P / 7P" },
    question: { th: "ส่วนผสมการตลาดสอดคล้องกันไหม", en: "Does the marketing mix fit together?" },
    howTo: {
      th: "Product, Price, Place, Promotion (+ People, Process, Physical evidence สำหรับธุรกิจบริการ)",
      en: "Product, Price, Place, Promotion (+ People, Process, Physical evidence for service businesses).",
    },
    trap: {
      th: "ตัดสินใจแต่ละ P แยกกันจน positioning ขัดกันเอง",
      en: "Deciding each P separately until the positioning contradicts itself.",
    },
    stagePicks: [],
    stages: ["sme", "enterprise"],
    keywords: ["ราคา", "price", "โปรโมชั่น", "promotion", "ช่องทางขาย", "place", "การตลาด", "marketing", "4p", "7p"],
  },
  {
    key: "north-star",
    category: "growth",
    name: { th: "North Star Metric", en: "North Star Metric" },
    question: {
      th: "ตัวเลขเดียวที่สะท้อนคุณค่าที่ลูกค้าได้รับคืออะไร",
      en: "Which single number reflects the value customers get?",
    },
    howTo: {
      th: "เลือกตัวชี้วัดที่ขึ้นเมื่อลูกค้าได้คุณค่า และนำไปสู่รายได้ในระยะยาว",
      en: "Pick a metric that rises when customers get value and leads to revenue over time.",
    },
    trap: {
      th: "เลือกรายได้เป็น North Star ซึ่งเป็นผลลัพธ์ปลายทาง ไม่ใช่ตัวขับ",
      en: "Choosing revenue as the North Star. It is an outcome, not a driver.",
    },
    stagePicks: [],
    stages: ["startup", "sme"],
    keywords: ["kpi", "ตัวชี้วัด", "metric", "วัดผล", "เป้าหมายทีม", "north star", "โฟกัส"],
  },

  // 7. Management & execution
  {
    key: "okrs",
    category: "execution",
    name: { th: "OKRs", en: "OKRs" },
    question: { th: "ไตรมาสนี้จะไปถึงไหน และวัดอย่างไร", en: "Where will we be this quarter, and how do we measure it?" },
    howTo: {
      th: "1 Objective เชิงคุณภาพ + 2–4 Key Results ที่วัดเป็นตัวเลข ทบทวนทุกสัปดาห์",
      en: "1 qualitative Objective + 2–4 measurable Key Results, reviewed every week.",
    },
    trap: {
      th: "เขียน KR เป็นรายการงาน (\"ทำแคมเปญ X\") แทนผลลัพธ์",
      en: "Writing KRs as tasks (\"run campaign X\") instead of results.",
    },
    stagePicks: ["sme"],
    stages: ALL,
    keywords: ["เป้าหมาย", "goal", "okr", "ไตรมาส", "quarter", "แผนงาน", "plan", "วัดผล", "ทีม", "kpi"],
    topSeven: true,
  },
  {
    key: "balanced-scorecard",
    category: "execution",
    name: { th: "Balanced Scorecard", en: "Balanced Scorecard" },
    question: { th: "ผลงานครบทุกมิติหรือไม่", en: "Is performance balanced across every dimension?" },
    howTo: {
      th: "วัด 4 มุม: การเงิน, ลูกค้า, กระบวนการภายใน, การเรียนรู้และการเติบโต",
      en: "Measure 4 views: financial, customer, internal process, learning and growth.",
    },
    trap: { th: "ตัวชี้วัดมากจนไม่มีใครติดตามจริง", en: "So many metrics that nobody really tracks them." },
    stagePicks: ["enterprise"],
    stages: ["sme", "enterprise"],
    keywords: ["ประเมินผล", "performance", "ตัวชี้วัด", "kpi", "scorecard", "ผลงาน", "องค์กร"],
  },
  {
    key: "raci",
    category: "execution",
    name: { th: "RACI", en: "RACI" },
    question: { th: "ใครทำอะไรในแต่ละงาน", en: "Who does what on each task?" },
    howTo: {
      th: "กำหนด Responsible, Accountable (มีได้คนเดียว), Consulted, Informed ต่องาน",
      en: "Assign Responsible, Accountable (only one), Consulted and Informed for each task.",
    },
    trap: { th: "มี Accountable หลายคนในงานเดียว", en: "Several Accountable people on one task." },
    stagePicks: [],
    stages: ["sme", "enterprise"],
    keywords: ["ใครรับผิดชอบ", "responsible", "บทบาท", "role", "ทีม", "team", "งานซ้ำซ้อน", "raci", "มอบหมาย"],
  },
  {
    key: "mckinsey-7s",
    category: "execution",
    name: { th: "McKinsey 7S", en: "McKinsey 7S" },
    question: { th: "องค์กรพร้อมรองรับกลยุทธ์ใหม่ไหม", en: "Is the organization ready for the new strategy?" },
    howTo: {
      th: "เช็กความสอดคล้องของ Strategy, Structure, Systems, Shared values, Style, Staff, Skills",
      en: "Check the fit between Strategy, Structure, Systems, Shared values, Style, Staff and Skills.",
    },
    trap: {
      th: "เปลี่ยนแค่โครงสร้าง แต่ระบบและวัฒนธรรมยังเหมือนเดิม",
      en: "Changing only the structure while systems and culture stay the same.",
    },
    stagePicks: ["enterprise"],
    stages: ["enterprise"],
    keywords: ["องค์กร", "organization", "วัฒนธรรม", "culture", "ปรับโครงสร้าง", "restructure", "เปลี่ยนแปลง", "change", "transformation"],
  },

  // 8. Thinking & problem solving
  {
    key: "first-principles",
    category: "thinking",
    name: { th: "First Principles", en: "First Principles" },
    question: {
      th: "ต้องการทางออกใหม่ ไม่ใช่แค่ทำตามที่คนอื่นทำ",
      en: "When you need a new answer, not a copy of what others do.",
    },
    howTo: {
      th: "แตกปัญหาจนถึงความจริงพื้นฐานที่พิสูจน์ได้ แล้วประกอบทางแก้ขึ้นใหม่",
      en: "Break the problem down to provable basic truths, then rebuild a solution.",
    },
    trap: {
      th: "หยุดที่ \"ทุกคนก็ทำแบบนี้\" แทนข้อเท็จจริงที่พิสูจน์ได้",
      en: "Stopping at \"everyone does it this way\" instead of provable facts.",
    },
    stagePicks: [],
    stages: ALL,
    keywords: ["คิดใหม่", "ทางออกใหม่", "innovation", "ต้นทุน", "พื้นฐาน", "reinvent"],
  },
  {
    key: "issue-tree",
    category: "thinking",
    name: { th: "MECE / Issue Tree", en: "MECE / Issue Tree" },
    question: { th: "ปัญหาใหญ่และซับซ้อน", en: "When the problem is big and complex." },
    howTo: {
      th: "แตกปัญหาเป็นกิ่งที่ไม่ซ้ำกันและครอบคลุมครบ แล้วตัดกิ่งที่ไม่สำคัญ",
      en: "Break the problem into branches that don't overlap and cover everything, then cut the branches that don't matter.",
    },
    trap: {
      th: "กิ่งซ้อนทับกันหรือไม่ครบ และไม่ได้ตัดกิ่งที่ไม่สำคัญ",
      en: "Branches that overlap or leave gaps, and no pruning of what doesn't matter.",
    },
    stagePicks: [],
    stages: ALL,
    keywords: ["ซับซ้อน", "complex", "ปัญหาใหญ่", "สาเหตุ", "แตกปัญหา", "ยอดขายตก", "ทำไม", "why", "วิเคราะห์ปัญหา"],
    topSeven: true,
  },
  {
    key: "five-whys",
    category: "thinking",
    name: { th: "5 Whys", en: "5 Whys" },
    question: { th: "ปัญหาเดิมเกิดซ้ำ", en: "When the same problem keeps coming back." },
    howTo: {
      th: "ถาม \"ทำไม\" ต่อเนื่องจนเจอสาเหตุที่แก้แล้วปัญหาไม่กลับมา",
      en: "Keep asking \"why\" until you reach a cause that, once fixed, stops the problem coming back.",
    },
    trap: {
      th: "หยุดที่ \"คนทำพลาด\" แทนกระบวนการที่ปล่อยให้พลาด",
      en: "Stopping at \"someone made a mistake\" instead of the process that let it happen.",
    },
    stagePicks: [],
    stages: ALL,
    keywords: ["เกิดซ้ำ", "recurring", "สาเหตุ", "root cause", "ทำไม", "why", "ผิดพลาด", "ปัญหาซ้ำ"],
  },
  {
    key: "pareto",
    category: "thinking",
    name: { th: "Pareto 80/20", en: "Pareto 80/20" },
    question: { th: "ทรัพยากรมีจำกัด", en: "When resources are limited." },
    howTo: {
      th: "หา 20% ของสาเหตุ ลูกค้า หรือสินค้าที่สร้างผล 80% แล้วโฟกัสตรงนั้น",
      en: "Find the 20% of causes, customers or products that create 80% of the result, and focus there.",
    },
    trap: {
      th: "เดาว่า 20% คืออะไรโดยไม่ได้เรียงข้อมูลจริง",
      en: "Guessing the 20% without sorting the real data.",
    },
    stagePicks: [],
    stages: ALL,
    keywords: ["จำกัด", "limited", "โฟกัส", "focus", "ลูกค้าหลัก", "สินค้าขายดี", "80/20", "pareto", "จัดลำดับ"],
  },
  {
    key: "pyramid",
    category: "thinking",
    name: { th: "Pyramid Principle", en: "Pyramid Principle" },
    question: {
      th: "ต้องสื่อสารกับผู้บริหารหรือนักลงทุน",
      en: "When you need to communicate with executives or investors.",
    },
    howTo: {
      th: "ขึ้นต้นด้วยข้อสรุป ตามด้วยเหตุผล 3 ข้อ แล้วจึงเป็นข้อมูลสนับสนุน",
      en: "Start with the conclusion, follow with 3 reasons, then the supporting data.",
    },
    trap: {
      th: "เล่าตามลำดับที่ทำงาน แทนที่จะขึ้นต้นด้วยข้อสรุป",
      en: "Telling it in the order the work happened instead of leading with the conclusion.",
    },
    stagePicks: [],
    stages: ALL,
    keywords: ["นำเสนอ", "present", "ผู้บริหาร", "executive", "นักลงทุน", "investor", "สื่อสาร", "pitch", "สรุป"],
  },
  {
    key: "pre-mortem",
    category: "thinking",
    name: { th: "Pre-mortem", en: "Pre-mortem" },
    question: { th: "ก่อนเริ่มโปรเจกต์สำคัญ", en: "Before starting an important project." },
    howTo: {
      th: "สมมติว่าโปรเจกต์ล้มเหลวไปแล้ว ให้ทีมเขียนสาเหตุ แล้ววางแผนป้องกัน",
      en: "Imagine the project has already failed. Have the team write down why, then plan to prevent it.",
    },
    trap: {
      th: "เขียนสาเหตุแต่ไม่มีแผนป้องกันและเจ้าของเรื่อง",
      en: "Listing causes with no prevention plan or owner.",
    },
    stagePicks: [],
    stages: ALL,
    keywords: ["ความเสี่ยง", "risk", "โปรเจกต์ใหม่", "launch", "เปิดตัว", "ล้มเหลว", "fail", "ป้องกัน"],
  },
];
