// A pure command resolver makes spoken navigation predictable and easy to extend.
export type AppScreen = 'overview' | 'finance' | 'health';

const navigationTerms: Record<string, Record<AppScreen, string[]>> = {
  en: { overview: ['home', 'overview', 'dashboard', 'summary'], finance: ['finance', 'money', 'transactions', 'spending', 'budget'], health: ['health', 'fitness', 'steps', 'sleep', 'workout'] },
  es: { overview: ['inicio', 'resumen', 'principal', 'casa'], finance: ['finanzas', 'dinero', 'gastos', 'presupuesto'], health: ['salud', 'ejercicio', 'pasos', 'sueño', 'entrenamiento'] },
  fr: { overview: ['accueil', 'aperçu', 'tableau de bord', 'résumé'], finance: ['finances', 'argent', 'transactions', 'dépenses', 'budget'], health: ['santé', 'forme', 'pas', 'sommeil', 'entraînement'] },
  de: { overview: ['startseite', 'übersicht', 'dashboard', 'zuhause'], finance: ['finanzen', 'geld', 'transaktionen', 'ausgaben', 'budget'], health: ['gesundheit', 'fitness', 'schritte', 'schlaf', 'training'] },
  hi: { overview: ['होम', 'मुख्य', 'डैशबोर्ड', 'सारांश'], finance: ['वित्त', 'पैसा', 'लेनदेन', 'खर्च', 'बजट'], health: ['स्वास्थ्य', 'सेहत', 'कदम', 'नींद', 'व्यायाम'] },
  ar: { overview: ['الرئيسية', 'ملخص', 'لوحة التحكم'], finance: ['المالية', 'المال', 'المعاملات', 'المصروفات', 'الميزانية'], health: ['الصحة', 'اللياقة', 'الخطوات', 'النوم', 'التمرين'] },
  zh: { overview: ['首页', '主页', '概览', '摘要'], finance: ['财务', '金钱', '交易', '支出', '预算'], health: ['健康', '健身', '步数', '睡眠', '锻炼'] },
  pt: { overview: ['início', 'resumo', 'painel', 'principal'], finance: ['finanças', 'dinheiro', 'transações', 'gastos', 'orçamento'], health: ['saúde', 'fitness', 'passos', 'sono', 'treino'] },
  ru: { overview: ['главная', 'обзор', 'сводка', 'домой'], finance: ['финансы', 'деньги', 'транзакции', 'расходы', 'бюджет'], health: ['здоровье', 'фитнес', 'шаги', 'сон', 'тренировка'] },
  ja: { overview: ['ホーム', '概要', 'ダッシュボード'], finance: ['金融', 'お金', '取引', '支出', '予算'], health: ['健康', 'フィットネス', '歩数', '睡眠', '運動'] },
  ko: { overview: ['홈', '개요', '대시보드'], finance: ['금융', '돈', '거래', '지출', '예산'], health: ['건강', '운동', '걸음', '수면', '운동 기록'] },
  it: { overview: ['home', 'panoramica', 'riepilogo', 'inizio'], finance: ['finanze', 'soldi', 'transazioni', 'spese', 'budget'], health: ['salute', 'fitness', 'passi', 'sonno', 'allenamento'] },
  nl: { overview: ['start', 'overzicht', 'dashboard', 'thuis'], finance: ['financiën', 'geld', 'transacties', 'uitgaven', 'budget'], health: ['gezondheid', 'fitness', 'stappen', 'slaap', 'training'] },
  tr: { overview: ['ana sayfa', 'genel bakış', 'özet', 'başlangıç'], finance: ['finans', 'para', 'işlemler', 'harcamalar', 'bütçe'], health: ['sağlık', 'fitness', 'adımlar', 'uyku', 'antrenman'] },
  id: { overview: ['beranda', 'ringkasan', 'dasbor', 'utama'], finance: ['keuangan', 'uang', 'transaksi', 'pengeluaran', 'anggaran'], health: ['kesehatan', 'kebugaran', 'langkah', 'tidur', 'olahraga'] },
  vi: { overview: ['trang chủ', 'tổng quan', 'tóm tắt'], finance: ['tài chính', 'tiền', 'giao dịch', 'chi tiêu', 'ngân sách'], health: ['sức khỏe', 'thể dục', 'bước chân', 'giấc ngủ', 'tập luyện'] },
  pl: { overview: ['strona główna', 'przegląd', 'podsumowanie'], finance: ['finanse', 'pieniądze', 'transakcje', 'wydatki', 'budżet'], health: ['zdrowie', 'fitness', 'kroki', 'sen', 'trening'] },
  bn: { overview: ['হোম', 'মূল পৃষ্ঠা', 'সারাংশ', 'ড্যাশবোর্ড'], finance: ['অর্থ', 'টাকা', 'লেনদেন', 'খরচ', 'বাজেট'], health: ['স্বাস্থ্য', 'ফিটনেস', 'পদক্ষেপ', 'ঘুম', 'ব্যায়াম'] },
  ur: { overview: ['ہوم', 'جائزہ', 'خلاصہ'], finance: ['مالیات', 'پیسہ', 'لین دین', 'اخراجات', 'بجٹ'], health: ['صحت', 'فٹنس', 'قدم', 'نیند', 'ورزش'] },
  ta: { overview: ['முகப்பு', 'கண்ணோட்டம்', 'சுருக்கம்'], finance: ['நிதி', 'பணம்', 'பரிவர்த்தனைகள்', 'செலவுகள்', 'பட்ஜெட்'], health: ['ஆரோக்கியம்', 'உடற்பயிற்சி', 'படிகள்', 'தூக்கம்', 'பயிற்சி'] },
  te: { overview: ['హోమ్', 'సారాంశం', 'డాష్‌బోర్డ్'], finance: ['ఆర్థికం', 'డబ్బు', 'లావాదేవీలు', 'ఖర్చులు', 'బడ్జెట్'], health: ['ఆరోగ్యం', 'ఫిట్‌నెస్', 'అడుగులు', 'నిద్ర', 'వ్యాయామం'] },
  mr: { overview: ['मुख्यपृष्ठ', 'आढावा', 'सारांश'], finance: ['वित्त', 'पैसे', 'व्यवहार', 'खर्च', 'अंदाजपत्रक'], health: ['आरोग्य', 'तंदुरुस्ती', 'पावले', 'झोप', 'व्यायाम'] },
  pa: { overview: ['ਮੁੱਖ ਪੰਨਾ', 'ਸੰਖੇਪ', 'ਡੈਸ਼ਬੋਰਡ'], finance: ['ਵਿੱਤ', 'ਪੈਸਾ', 'ਲੈਣ-ਦੇਣ', 'ਖਰਚੇ', 'ਬਜਟ'], health: ['ਸਿਹਤ', 'ਤੰਦਰੁਸਤੀ', 'ਕਦਮ', 'ਨੀਂਦ', 'ਕਸਰਤ'] },
  th: { overview: ['หน้าหลัก', 'ภาพรวม', 'สรุป'], finance: ['การเงิน', 'เงิน', 'ธุรกรรม', 'ค่าใช้จ่าย', 'งบประมาณ'], health: ['สุขภาพ', 'ฟิตเนส', 'ก้าวเดิน', 'การนอน', 'ออกกำลังกาย'] },
};

export function resolveVoiceCommand(transcript: string, locale = 'en-US'): AppScreen | null {
  const phrase = transcript.toLocaleLowerCase().trim();
  const language = locale.split('-')[0].toLowerCase();
  const terms = navigationTerms[language] ?? navigationTerms.en;
  for (const screen of ['finance', 'health', 'overview'] as const) {
    if (terms[screen].some((term) => phrase.includes(term))) return screen;
  }
  // Detection can be absent or stale; try the known command phrases across locales.
  for (const screen of ['finance', 'health', 'overview'] as const) {
    if (Object.values(navigationTerms).some((languageTerms) =>
      languageTerms[screen].some((term) => phrase.includes(term)),
    )) return screen;
  }
  return null;
}