import { getFramework } from "@/frameworks/registry";
import type { ProjectSummary } from "@/frameworks/summary";
import type { Data } from "@/frameworks/types";
import type { ClientLinkView, ReportSnapshot } from "@/lib/types";

// A fictional business used only by the demo page.

export const DEMO_PROFILE: Data = {
  businessName: "Healthy Box",
  offering: "ข้าวกล่องสุขภาพส่งถึงออฟฟิศ",
  targetCustomers: "พนักงานออฟฟิศย่านสีลม-สาทร อายุ 25–40",
  revenueModel: "ขายรายมื้อ และแพ็กเกจรายเดือนให้บริษัท",
  monthlyRevenue: "ประมาณ 450,000 บาท",
  teamSize: "12 คน",
  competitors: ["Delivery app", "ร้านสะดวกซื้อ"],
  challenges: ["ลูกค้าใหม่สั่งครั้งเดียวแล้วหาย", "ค่าโฆษณาสูงขึ้น"],
  goals: "เป็นตัวเลือกแรกของมื้อเที่ยงสุขภาพย่าน CBD ภายใน 2 ปี",
};

const closing: Record<string, Data> = {
  jtbd: {
    _sources: ["สัมภาษณ์ลูกค้า 8 ราย (ต.ค. 2026)"],
    _conclusion: "ลูกค้าจ้างเราเพื่อได้มื้อเที่ยงที่ดีต่อสุขภาพโดยไม่เสียเวลางาน ไม่ใช่เพราะราคาถูก",
    _next: "ทดสอบว่าการรับประกันส่งภายใน 15 นาทีทำให้ลูกค้าสั่งซ้ำเพิ่มขึ้นไหม ภายใน 4 สัปดาห์",
  },
  aarrr: {
    _sources: ["ข้อมูลคำสั่งซื้อจาก LINE OA เดือน ก.ย. 2026"],
    _conclusion: "รั่วมากที่สุดหลังลูกค้าสั่งซ้ำ มีเพียง 20% ที่สมัครแพ็กเกจรายเดือน",
    _next: "ทดสอบข้อเสนอแพ็กเกจหลังลูกค้าสั่งครบ 3 ครั้ง ตั้งเป้าสมัครจาก 20% เป็น 30%",
  },
  "issue-tree": {
    _sources: ["ยอดขาย POS ไตรมาส 2–3"],
    _conclusion: "ยอดขายลดเพราะลูกค้าเก่ามาน้อยลง ไม่ใช่เพราะราคาหรือยอดต่อบิล",
    _next: "ลงทุนกับการรักษาลูกค้าเก่าก่อนเพิ่มงบหาลูกค้าใหม่",
  },
  "unit-economics": {
    _sources: ["งบโฆษณาและลูกค้าใหม่แยกช่องทาง ก.ค.–ก.ย. 2026"],
    _conclusion: "ภาพรวมคุ้ม (LTV/CAC 2.5) แต่ LINE Ads ขาดทุน ส่วนช่องทาง HR บริษัทดีที่สุด",
    _next: "หยุดงบ LINE Ads 1 เดือน และย้ายงบไปทีมขายให้ HR บริษัท",
  },
  bmc: {
    _sources: ["เวิร์กช็อปกับทีมผู้บริหาร 20 ต.ค. 2026"],
    _conclusion: "ลูกค้าองค์กรผ่าน HR เป็นกลุ่มที่ทำเงินและส่งมอบได้คุ้มที่สุด",
    _next: "ตัดสินใจโฟกัสลูกค้าองค์กรเป็นกลุ่มหลักในปี 2027",
  },
  "playing-to-win": {
    _sources: ["เวิร์กช็อปกับทีมผู้บริหาร 20 ต.ค. 2026"],
    _conclusion: "ชนะด้วยความเร็วและการเป็นสวัสดิการที่ HR จัดการง่าย ในออฟฟิศ 50–500 คน",
    _next: "สร้างทีมขายองค์กร 2 คน ภายใน Q1",
  },
  "five-forces": {
    _sources: ["คุยกับ HR 5 บริษัท", "ค่าคอมของแพลตฟอร์ม delivery"],
    _conclusion: "น่าเล่นปานกลาง กำไรรั่วไปที่แพลตฟอร์ม delivery ถ้าขายตรงให้ HR",
    _next: "ขายตรงกับ HR แทนการพึ่งแพลตฟอร์ม",
  },
  "swot-tows": {
    _sources: ["เวิร์กช็อปกับทีมผู้บริหาร 20 ต.ค. 2026"],
    _conclusion: "ใช้ความใกล้ลูกค้าและความสัมพันธ์กับ HR รุกตลาดสวัสดิการ",
    _next: "จ้างเซลส์องค์กรเพิ่ม 1 คนใน Q1",
  },
  okrs: {
    _sources: ["ข้อมูลตั้งต้นจาก POS และ LINE OA"],
    _conclusion: "Q1 โฟกัสการกลับมาสั่งซ้ำและลูกค้าองค์กร",
    _next: "ทบทวน OKR ทุกวันจันทร์",
  },
};

const filled = (key: string): Data => ({ ...(getFramework(key)?.example ?? {}), ...(closing[key] ?? {}) });

export const DEMO_QUESTIONS = [
  { text: "ทำไมลูกค้าไม่กลับมาซื้อซ้ำ", frameworks: ["jtbd", "aarrr", "issue-tree"] },
  { text: "ลูกค้าแต่ละรายกำไรไหม และควรโตทางไหน", frameworks: ["unit-economics", "bmc", "playing-to-win"] },
  { text: "ตลาดนี้น่าเล่นไหม และเราจะชนะด้วยอะไร", frameworks: ["five-forces", "swot-tows"] },
  { text: "ไตรมาสหน้าจะไปถึงไหน", frameworks: ["okrs"] },
];

export const DEMO_ITEMS = DEMO_QUESTIONS.flatMap((q) => q.frameworks.map((key) => ({ question: q.text, frameworkKey: key, data: filled(key) })));

export const DEMO_SUMMARY: ProjectSummary = {
  exec_summary: {
    conclusion:
      "Healthy Box ควรเลิกเทงบหาลูกค้าใหม่ แล้วโฟกัสลูกค้าองค์กรผ่าน HR และการทำให้ลูกค้ากลับมาสั่งซ้ำ เพราะนั่นคือที่ที่เงินและการเติบโตอยู่",
    reasons: [
      {
        title: "ปัญหาอยู่ที่ลูกค้าไม่กลับมา ไม่ใช่หาลูกค้าไม่ได้",
        detail: "AARRR: ลูกค้า 25% สั่งซ้ำใน 30 วัน และมีเพียง 20% ของคนที่สั่งซ้ำที่สมัครแพ็กเกจ\nIssue tree: ยอดขายลดเพราะลูกค้าเก่ามาน้อยลง",
      },
      {
        title: "ช่องทาง HR บริษัทคุ้มที่สุด ส่วน LINE Ads ขาดทุน",
        detail: "Unit Economics: LTV 3,150 บาท, CAC ผ่าน HR 500 บาท (6.3×) เทียบกับ LINE Ads 4,000 บาท (0.8×)",
      },
      {
        title: "ลูกค้าจ้างเราเพื่อประหยัดเวลา ไม่ใช่เพราะราคาถูก",
        detail: "JTBD จากการสัมภาษณ์ 8 ราย: อยากได้มื้อเที่ยงที่ดีต่อสุขภาพโดยไม่ต้องลุกจากโต๊ะ",
      },
    ],
  },
  decisions: [
    { id: "d1", kind: "decision", text: "หยุดงบ LINE Ads 1 เดือน และย้ายงบไปทีมขายลูกค้าองค์กร", test: "" },
    { id: "d2", kind: "decision", text: "โฟกัสออฟฟิศ 50–500 คน ย่านสีลม-สาทร-อโศก เป็นกลุ่มหลักปี 2027", test: "" },
    {
      id: "h1",
      kind: "hypothesis",
      text: "การรับประกันส่งภายใน 15 นาทีทำให้ลูกค้าสั่งซ้ำเพิ่มขึ้น",
      test: "ทดลอง 4 สัปดาห์กับลูกค้าครึ่งหนึ่ง ผ่านถ้า retention 30 วันเพิ่มจาก 25% เป็น 32%",
    },
    {
      id: "h2",
      kind: "hypothesis",
      text: "เสนอแพ็กเกจหลังลูกค้าสั่งครบ 3 ครั้งจะเพิ่มการสมัคร",
      test: "ผ่านถ้าอัตราสมัครแพ็กเกจเพิ่มจาก 20% เป็น 30% ใน 6 สัปดาห์",
    },
  ],
  action_plan: {
    objective: "ทำให้ลูกค้าออฟฟิศกลับมาสั่งทุกสัปดาห์",
    period: "Q1 2027",
    keyResults: [
      { id: "k1", text: "เพิ่ม retention 30 วันจาก 25% เป็น 40%", target: "40%", owner: "ฝ้าย" },
      { id: "k2", text: "เพิ่มบริษัทที่สมัครแพ็กเกจจาก 3 เป็น 10 แห่ง", target: "10 แห่ง", owner: "ต้น" },
      { id: "k3", text: "ลดเวลาส่งเฉลี่ยจาก 25 เหลือ 15 นาที", target: "15 นาที", owner: "บอส" },
    ],
    tasks: [
      { id: "t1", task: "ปิดแคมเปญ LINE Ads", owner: "ต้น", due: "1 พ.ย." },
      { id: "t2", task: "จ้างทีมขายองค์กร 2 คน", owner: "บอส", due: "31 ธ.ค." },
      { id: "t3", task: "ทำข้อเสนอแพ็กเกจหลังสั่งครบ 3 ครั้ง", owner: "ฝ้าย", due: "15 พ.ย." },
    ],
  },
};

export const DEMO_REPORT: ReportSnapshot = {
  projectName: "วางกลยุทธ์ปี 2027",
  clientName: "Healthy Box",
  stage: "sme",
  summary: DEMO_SUMMARY,
  questions: DEMO_QUESTIONS.map((q) => ({
    text: q.text,
    analyses: q.frameworks.map((key) => ({ framework_key: key, data: filled(key) })),
  })),
};

export const DEMO_FILL: ClientLinkView = {
  project_name: "วางกลยุทธ์ปี 2027",
  client_name: "Healthy Box",
  lang: "th",
  label: "ข้อมูลก่อนเวิร์กช็อป",
  message: "รบกวนกรอกข้อมูลธุรกิจและตัวเลขช่องทางการตลาดก่อนประชุมวันศุกร์นะครับ ไม่ต้องครบทุกช่อง ทีมจะช่วยต่อให้",
  submitted_at: null,
  expires_at: null,
  profile_fields: ["businessName", "offering", "targetCustomers", "revenueModel"],
  profile: { businessName: "Healthy Box" },
  analyses: [
    {
      id: "00000000-0000-0000-0000-0000000000d1",
      framework_key: "unit-economics",
      question: "ลูกค้าแต่ละรายกำไรไหม และควรโตทางไหน",
      fields: ["arpu", "grossMargin", "churn", "channels"],
      data: {},
    },
  ],
};

export function demoAnalysisData(key: string, empty: boolean): Data {
  return empty ? {} : filled(key);
}

export function demoQuestionOf(key: string) {
  return DEMO_QUESTIONS.find((q) => q.frameworks.includes(key))?.text ?? "ทำไมลูกค้าไม่กลับมาซื้อซ้ำ";
}
