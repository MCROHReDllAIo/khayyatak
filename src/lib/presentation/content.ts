import type { DemoLink, JudgeQuestion, SlideDefinition } from "./types";

export const DEMO_LINKS: DemoLink[] = [
  { step: 1, label_ar: "AI Concierge — الرئيسية", label_en: "AI Concierge — Home", href: "/customer" },
  { step: 2, label_ar: "استوديو التصميم", label_en: "Design Studio", href: "/customer/designer" },
  { step: 3, label_ar: "القياسات AI", label_en: "AI Measurements", href: "/customer/measurements" },
  { step: 4, label_ar: "مطابقة الخياطين", label_en: "Tailor Matching", href: "/customer" },
  { step: 5, label_ar: "مواصفات التفصيل", label_en: "Tailoring Specification", href: "/customer/specification" },
  { step: 6, label_ar: "لوحة الخياط", label_en: "Tailor Dashboard", href: "/tailor/dashboard" },
  { step: 7, label_ar: "مركز القيادة الوطني", label_en: "National Command Center", href: "/admin" },
];

export const JUDGE_QUESTIONS: JudgeQuestion[] = [
  {
    question_ar: "هل أنتم تستبدلون الخياط؟",
    question_en: "Are you replacing the tailor?",
    answer_ar:
      "لا، بالعكس. المنتج مبني حول الخياط. نحن نأخذ الأشياء التشغيلية المتكررة ونساعده فيها، بينما الحرفة والتنفيذ والقرار النهائي يبقى عنده.",
    answer_en:
      "No — the opposite. The product is built around the tailor. We handle repetitive operational tasks while craft, execution, and final decisions stay with them.",
  },
  {
    question_ar: "ما المختلف عن متجر إلكتروني للخياطة؟",
    question_en: "How is this different from an e-commerce tailor shop?",
    answer_ar:
      "المتجر الإلكتروني يعرض المنتجات ويأخذ الطلب. خياطك يفهم العميل، يصمم معه، يحلل الصور، يساعد في القياسات، يطابقه مع الخياط، ثم يعطي الخياط ذكاءً لإدارة عمله.",
    answer_en:
      "E-commerce lists products and takes orders. Khayyatak understands the customer, co-designs, analyzes images, assists with measurements, matches tailors, and gives tailors intelligence to run their business.",
  },
  {
    question_ar: "أين الذكاء الاصطناعي فعلًا؟",
    question_en: "Where is the AI actually?",
    answer_ar:
      "في عدة طبقات: Concierge، Image Understanding، Design، Measurement، Matching، Style DNA، Pricing، Forecasting، Inventory، Business Advisor — بالإضافة إلى AI Agents مستقبلًا.",
    answer_en:
      "Across multiple layers: Concierge, Image Understanding, Design, Measurement, Matching, Style DNA, Pricing, Forecasting, Inventory, Business Advisor — plus future AI Agents.",
  },
  {
    question_ar: "هل لديكم AI حقيقي؟",
    question_en: "Do you have real AI?",
    answer_ar:
      "نعم في الميزات المتصلة بـ API — Concierge، تحليل الصور، والتصميم باللغة الطبيعية. وبعض الطبقات جاهزة معماريًا وتعمل بمنطق حقيقي من بيانات Supabase. لا ندّعي ميزة غير موجودة — إذا شيء قادم نقول: هذه ضمن المرحلة القادمة.",
    answer_en:
      "Yes for API-connected features — Concierge, image analysis, and natural-language design. Other layers are architecture-ready with real Supabase logic. We never claim a feature that isn't built — if it's coming, we say so.",
  },
  {
    question_ar: "كيف تأخذون القياسات؟",
    question_en: "How do you take measurements?",
    answer_ar:
      "نستخدم computer vision للحصول على تقدير، ونضع Confidence Score، لكن القياس النهائي يتم تأكيده من الخياط. نحن لا نقدم القياس كحقيقة مضمونة.",
    answer_en:
      "Computer vision gives an estimate with a Confidence Score, but the tailor confirms final measurements. We never present estimates as guaranteed truth.",
  },
  {
    question_ar: "كيف تربحون؟",
    question_en: "How do you make money?",
    answer_ar: "عمولة على الطلبات، اشتراكات AI للخياطين، Merchant Pro، وخدمات B2B مستقبلًا.",
    answer_en: "Transaction commission, AI subscriptions for tailors, Merchant Pro, and future B2B services.",
  },
  {
    question_ar: "لماذا سيستخدم الخياط منصتكم؟",
    question_en: "Why would a tailor use your platform?",
    answer_ar:
      "لأننا لا نطلب منه تغيير مهنته. نحن نعطيه عملاء جدد، تنظيم للطلبات، تحليلات، تسعير، مخزون، وتوصيات AI تساعده على النمو.",
    answer_en:
      "We don't ask them to change their craft. We bring new customers, order organization, analytics, pricing, inventory, and AI recommendations that help them grow.",
  },
  {
    question_ar: "ماذا يمنع خياطًا من استخدام WhatsApp والاستمرار؟",
    question_en: "Why not just keep using WhatsApp?",
    answer_ar:
      "WhatsApp قناة تواصل ممتازة، لكن لا يعطي الخياط طبقة ذكاء تربط العميل بالتصميم والمقاسات والطلبات والمخزون والتحليلات. نحن نبني النظام التشغيلي والذكاء خلف رحلة الخياطة.",
    answer_en:
      "WhatsApp is great for chat, but it doesn't connect design, measurements, orders, inventory, and analytics into one intelligent operating layer.",
  },
  {
    question_ar: "كيف تحمون بيانات العملاء؟",
    question_en: "How do you protect customer data?",
    answer_ar:
      "المقاسات والصور بيانات خاصة. نستخدم صلاحيات وصول، RLS في Supabase، تخزين آمن، ومبدأ تقليل الاحتفاظ بالصور. المستخدم يملك التحكم في بياناته.",
    answer_en:
      "Measurements and photos are private. We use access controls, Supabase RLS, secure storage, and minimal image retention. Users control their data.",
  },
  {
    question_ar: "كيف تتوسعون؟",
    question_en: "How do you scale?",
    answer_ar:
      "نبدأ بعمان لأننا نريد حل مشكلة واضحة في سوق نعرفه، ثم يمكن توسيع نفس البنية إلى أسواق الخليج مع تغيير taxonomy والعملة واللغة والخدمات المحلية.",
    answer_en:
      "Start in Oman with a problem we know deeply, then expand the same architecture across GCC markets with localized taxonomy, currency, and services.",
  },
];

export const PITCH_SLIDES: SlideDefinition[] = [
  {
    id: "hook",
    index: 1,
    label: "01",
    type: "hook",
    notes: {
      opening: "تخيلوا معي أنكم تريدون تفصيل ثوب.",
      main: [
        "اليوم، غالبًا تبدأ الرحلة برسالة واتساب أو زيارة للخياط.",
        "لكن ماذا لو بدل ما نشرح للخياط كل التفاصيل بأنفسنا، كان عندنا ذكاء اصطناعي يفهم ما نريده، يصممه، يأخذ قياساتنا، ويجد لنا الخياط الأنسب؟",
        "هذه هي خياطك.",
      ],
      transition: "خلوني أوريكم أولًا أين المشكلة الحقيقية — وليس في الخياط نفسه.",
    },
  },
  {
    id: "problem",
    index: 2,
    label: "02",
    type: "problem",
    notes: {
      opening: "خلوني أوضح نقطة مهمة.",
      main: [
        "نحن لا نرى أن الخياط التقليدي هو المشكلة.",
        "بالعكس، عندنا خياطين عندهم خبرة وحرفة ممتازة.",
        "المشكلة أن الأدوات التي يستخدمونها اليوم متفرقة.",
        "العميل يتواصل في واتساب، القياسات ممكن تكون في ورقة، الطلب يتابع يدويًا، والخياط ما عنده أدوات تساعده يفهم عملاءه أو يتوقع الطلب.",
        "فقلنا: لماذا لا نرقمن العملية نفسها؟",
      ],
      transition: "وهنا وصلنا للفكرة الكبيرة.",
      judgeTip: "إذا سألوا 'من عندكم المشكلة؟' — العميل والخياط معًا. العميل يضيع في البحث، والخياط يضيع في التشغيل.",
    },
  },
  {
    id: "big-idea",
    index: 3,
    label: "03",
    type: "big-idea",
    notes: {
      opening: "هنا بدأت فكرتنا.",
      main: [
        "بدل ما نستخدم AI لاستبدال الإنسان، نستخدمه لرفع قدرته.",
        "الخياط يبقى هو صاحب الحرفة والقرار.",
        "والذكاء الاصطناعي يتولى الأشياء التي تستهلك وقته: تحليل الطلبات، فهم العملاء، التسعير، المخزون، والتوقعات.",
        "وهذا هو جوهر خياطك.",
      ],
      transition: "خلوني أريكم الرحلة الكاملة التي بنيناها.",
    },
  },
  {
    id: "journey",
    index: 4,
    label: "04",
    type: "journey",
    notes: {
      opening: "هذه هي الرحلة التي بنيناها.",
      main: [
        "العميل يبدأ بفكرة بسيطة.",
        "AI يفهم الفكرة، ثم يحولها إلى تصميم.",
        "بعدها نقدر القياسات، نطابقه مع الخياط المناسب، ونحول كل شيء إلى طلب واضح.",
        "وأخيرًا العميل يتابع طلبه إلى أن يستلمه.",
      ],
      transition: "بدل ما أشرح أكثر — خلوني أوريكم المنتج الحقيقي.",
      demoCue: "بعد هذه الشريحة: اضغط D وافتح العرض الحي من /customer",
    },
  },
  {
    id: "demo-break",
    index: 5,
    label: "05",
    type: "demo-break",
    hidden: true,
    notes: {
      opening: "بدل ما أشرح لكم، خلوني أوريكم.",
      main: [
        "افتح /customer واكتب: أبغى دشدASHة بيضاء صيفية رسمية وفخمة لكن بسيطة.",
        "لاحظوا — ما اخترنا من قائمة. تكلمنا بشكل طبيعي.",
        "AI يحول الكلام إلى تصميم. قل 'خلّه أنحف' — التصميم يتغير.",
        "شوف Tailor Rail — AI Match من بيانات حقيقية، مو رقم ثابت.",
        "افتح مواصفات التفصيل، ثم انتقل للخياط في /tailor/dashboard.",
        "إذا ميزة مو جاهزة — قل: هذه ضمن المرحلة القادمة.",
      ],
      transition: "رجعنا للشرائح — هذا هو AI Concierge.",
      demoCue: "LIVE DEMO — اتبع DEMO_LINKS بالترتيب.",
    },
  },
  {
    id: "concierge",
    index: 5,
    label: "05",
    type: "concierge",
    notes: {
      opening: "خلوني أوريكم الجزء الذي يبدأ منه كل شيء.",
      main: [
        "بدل ما يدخل العميل في عشر قوائم، يتكلم مع AI بشكل طبيعي.",
        "مثلًا: أبغى دشداشة بيضاء صيفية رسمية وفخمة لكن بسيطة.",
        "AI يفهم: لون، موسم، مناسبة، ستايل، وحتى تفضيل في البساطة.",
        "وهنا تبدأ التجربة.",
      ],
      transition: "وبعد ما AI يفهم — يحول الكلام إلى تصميم فعلي.",
    },
  },
  {
    id: "design-studio",
    index: 6,
    label: "06",
    type: "design-studio",
    notes: {
      opening: "والميزة أن العميل ما يحتاج يعرف مصطلحات التصميم.",
      main: [
        "يقدر يقول: خليه أنحف. أو: أبغاه صيفي. أو: أبغى تطريز بسيط.",
        "والـAI يحول الكلام إلى خصائص تصميم فعلية.",
        "الذكاء الاصطناعي هنا لا يكتب كلامًا فقط — هو يغير المنتج نفسه.",
      ],
      transition: "لكن التصميم ليس كل شيء.",
    },
  },
  {
    id: "vision-measure",
    index: 7,
    label: "07",
    type: "vision-measure",
    notes: {
      opening: "لكن التصميم ليس كل شيء.",
      main: [
        "العميل يقدر يرفع صورة أعجبته — AI يحلل اللون والقماش والقصة والتطريز.",
        "وبعدها نستخدم الكاميرا للحصول على قياسات تقديرية مع Confidence Score.",
        "والقياسات تقديرية — الخياط يراجعها قبل التنفيذ.",
        "Virtual Try-On — ضمن المرحلة القادمة إذا ما كان جاهز في العرض.",
      ],
      transition: "الآن السؤال: من هو الخياط المناسب لهذا التصميم؟",
      judgeTip: "كن صريحًا عن Try-On إذا مو شغال.",
    },
  },
  {
    id: "matching",
    index: 8,
    label: "08",
    type: "matching",
    notes: {
      opening: "الآن عندنا سؤال مهم.",
      main: [
        "من هو الخياط المناسب لهذا التصميم؟",
        "بدل ما العميل يبحث بنفسه، AI يقارن: التخصص، السعر، الجودة، التقييم، الموقع، وقت الإنجاز.",
        "ويعطي Match Score مع سبب واضح — محسوب من بيانات حقيقية، مو رقم ثابت.",
        "بدل: هذا خياط مشهور — نقول: هذا الخياط مناسب لك أنت، ولهذا السبب.",
      ],
      transition: "وهنا واحدة من أهم نقاط التمايز.",
    },
  },
  {
    id: "specification",
    index: 9,
    label: "09",
    type: "specification",
    notes: {
      opening: "وهنا واحدة من أهم الأشياء التي تميز فكرتنا.",
      main: [
        "العميل يتكلم بطريقة طبيعية — لكن الخياط يحتاج مواصفات واضحة.",
        "خياطك يأخذ المحادثة والتصميم والقياسات والصورة، ويحولها إلى Tailoring Specification.",
        "الخياط يستلم الطلب وهو فاهم بالضبط ماذا يريد العميل.",
        "وهذا يقلل سوء الفهم والأخطاء.",
      ],
      transition: "لكن نحن لم نبنِ AI للعميل فقط.",
    },
  },
  {
    id: "tailor-ai",
    index: 10,
    label: "10",
    type: "tailor-ai",
    notes: {
      opening: "لكن نحن لم نبنِ AI للعميل فقط.",
      main: [
        "الخياط عنده AI خاص به — مساعد خياطك الذكي.",
        "يشوف الطلبات، يفهم المخزون، يساعده في التسعير.",
        "ويخبره بالطلبات التي تحتاج تدخل.",
        "بدل برنامج يسجل البيانات — نظام يساعده في اتخاذ القرار.",
      ],
      transition: "وهنا نبدأ نبني علاقة طويلة مع العميل.",
    },
  },
  {
    id: "style-dna",
    index: 11,
    label: "11",
    type: "style-dna",
    notes: {
      opening: "وهنا نبدأ نبني علاقة طويلة مع العميل.",
      main: [
        "النظام يتعلم ذوق العميل: ألوانه، أقمشته، قصاته، ميزانيته، وخياطينه المفضلين.",
        "بعد أول طلب، المرة القادمة لا يبدأ من الصفر.",
        "يضغط إعادة الطلب — المقاسات والتصميم موجودة.",
        "تجربة أسرع، وعودة أعلى.",
      ],
      transition: "خلوني أريكم الصورة الأكبر.",
    },
  },
  {
    id: "ecosystem",
    index: 12,
    label: "12",
    type: "ecosystem",
    notes: {
      opening: "وهنا الصورة الأكبر.",
      main: [
        "خياطك ليس Feature واحدة — هو Ecosystem.",
        "العميل يدخل من AI Concierge — البيانات تنتقل للتصميم والقياسات والمطابقة والطلب.",
        "الخياط يستخدم نفس البيانات في إدارة متجره.",
        "كل جزء يغذي الجزء الآخر.",
      ],
      transition: "ليش عمان؟",
    },
  },
  {
    id: "oman",
    index: 13,
    label: "13",
    type: "oman",
    notes: {
      opening: "ليش عمان؟",
      main: [
        "لأن عندنا قطاع محلي كبير من الخياطين والحرفيين — لكن جزءًا كبيرًا من التجربة ما زال غير رقمي.",
        "نبدأ من عمان، نبني شبكة الخياطين، نفهم احتياجات العملاء.",
        "مع نمو الشبكة — رؤى مجمعة عن اتجاهات السوق بدون كشف بيانات الأفراد.",
        "ما نعرض أرقام وهمية — إذا ما في بيانات، نعرض الرؤية.",
      ],
      transition: "والنموذج التجاري؟",
    },
  },
  {
    id: "business",
    index: 14,
    label: "14",
    type: "business",
    notes: {
      opening: "النموذج التجاري بسيط.",
      main: [
        "نحن ننمو عندما ينمو الخياط.",
        "عمولة على الطلبات، اشتراكات AI للخياطين، Merchant Pro، ومستقبلًا B2B والموردين.",
        "البنية التقنية ليست مرتبطة بعمان فقط.",
        "نبدأ من عمان — بعد إثبات النموذج، التوسع خليجيًا.",
      ],
      transition: "في النهاية...",
    },
  },
  {
    id: "final",
    index: 15,
    label: "15",
    type: "final",
    notes: {
      opening: "في النهاية...",
      main: [
        "نحن لا نحاول أن نأخذ مكان الخياط.",
        "الخياط عنده شيء لا يستطيع AI أن يخلقه وحده: الخبرة، الحرفة، والهوية.",
        "دورنا: نعطيه الأدوات التي تساعده يوصل لعملاء أكثر، ويدير متجره بشكل أفضل.",
        "وهذا هو خياطك.",
        "من أول قياس... إلى آخر غرزة. كل شيء أذكى.",
      ],
      transition: "ارجع للمنتج الحي — Customer → AI → Tailor → Intelligence — ثم اختم.",
      demoCue: "FINAL — افتح /customer ثم /admin للختام.",
    },
  },
  {
    id: "judge-questions",
    index: 17,
    label: "Q&A",
    type: "judge-questions",
    hidden: true,
    notes: {
      opening: "قسم مخفي — اضغط ? للعرض.",
      main: ["استخدم الإجابات الجاهزة — كن صريحًا عن ما هو live وما هو قادم."],
      transition: "",
    },
  },
];

/** Visible slide count for counter (excludes hidden Q&A unless shown) */
export const VISIBLE_SLIDE_COUNT = 15;

export const LIVE_DEMO_SCRIPT = {
  opening: "بدل ما أشرح لكم، خلوني أوريكم.",
  steps: [
    { say: "افتح AI Concierge في /customer", action: "Type: أبغى دشداشة بيضاء صيفية رسمية وفخمة لكن بسيطة" },
    { say: "لاحظوا — ما اخترنا من قائمة. تكلمنا بشكل طبيعي.", action: null },
    { say: "الآن AI حوّل كلامي إلى تصميم.", action: "Open /customer/designer" },
    { say: "خلّه أنحف.", action: "Show design changing via NL" },
    { say: "الآن أريد أعرف من أفضل خياط لهذا التصميم.", action: "Show Tailor Rail on /customer" },
    { say: "AI يقارن بناءً على التصميم — مو ترتيب عشوائي.", action: "Open tailor sheet" },
    { say: "يحول كل شيء إلى مواصفات يستطيع الخياط تنفيذها.", action: "Open /customer/specification" },
    { say: "ومن الطرف الآخر، الخياط يستلم الطلب.", action: "Open /tailor/dashboard" },
    { say: "AI يساعده في إدارة متجره.", action: "Show AI insights" },
  ],
};
