declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    startListening: () => void;
    clearText: () => void;
    askCustomQuestion: () => void;
    showQuestionSection: () => void;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
}

export {};

// Language selector + map
const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
let selectedLanguage = languageSelect.value;

const languageMap: Record<string, { langCode: string; voiceLang: string }> = {
  en: { langCode: 'en-US', voiceLang: 'en' },
  ar: { langCode: 'ar-EG', voiceLang: 'ar' },
  ru: { langCode: 'ru-RU', voiceLang: 'ru' },
};

// DOM elements
const transcriptEl = document.getElementById('transcript')!;
const responseEl = document.getElementById('response')!;
const clearBtn = document.getElementById('clearText')!;
const historyEl = document.getElementById('history')!;
const dropdownEl = document.getElementById('customQuestion') as HTMLSelectElement;
const textInput = document.getElementById('textInput') as HTMLInputElement;
const sendBtn = document.getElementById('sendBtn')!;
const pauseBtn = document.getElementById('pauseSpeaking')!;
const resumeBtn = document.getElementById('resumeSpeaking')!;
const assistantImg = document.getElementById('assistantImg') as HTMLImageElement | null;




// Initially hide the question section
function hideQuestionSection() {
  const section = document.getElementById('question-section');
  if (section) {
    section.style.display = 'none'; // Hide it by default
  }
}

// Always show the question section when clicking a segment
function showQuestionSection() {
  const section = document.getElementById('question-section');
  if (section) {
    section.style.display = 'block'; // Always show the question section
  }
}

// Initially hide the question section
document.addEventListener('DOMContentLoaded', () => {
  hideQuestionSection();
  window.showQuestionSection = showQuestionSection;
});



// Gemini API key
const apiKey = 'AIzaSyBi2OE2UNv5s5-YMdZFaH4Z_XLUn8aSLVo';

const segmentedQuestions: Record<string, Record<string, Record<string, string>>> = {
  mortgage: {
    en: {
      "How can I apply for a mortgage in UAE?": "You can apply through banks or mortgage brokers.",
      "To whom I get connect to for mortgage?": "You should speak to a mortgage advisor or financial institution.",
      "How many mortgages can I apply for in UAE?": "You may apply for multiple, but approval depends on eligibility.",
      "What are the mortgage benefits for the UAE residents?": "Residents will get 1.Lower Interest Rates. 2. Residents typically receive rates of 3% to 4%, while non-residents face 4.5% to 6%. 3. Higher Loan-to-Value Ratios Up to 80% forresidents vs. 50% to 60% for non-residents. 4. Faster Approval Processes, Banks favor residents for quicker approvals.",
      "If someone is employed and got a mortgage in the UAE, paying installments but he receives a good offer overseas and wants to go outside the UAE. Then how bank takes care of such cases?": "1.He can maintain installments regularly through ur payment account. 2.He can maintain installments regularly through ur payment account.",
      "How does an Islamic mortgage work, given that Muslim clients are prohibited from taking out loans with interest?":"Through 3 ways: murabaha, ijara and musharaka 1.Murabaha, bank buys the property and sells to client on a pre-agreed profit. 2.Ijara, bank buys the property and lease it to client and client pays the monthly rental payment until its fully paid then ownership transfer.3.Musharaka, its like bank and client both buys the property on partnership and slowly client buys the shares of the bank."
    },
    ar: {
      "كيف يمكنني التقديم على قرض عقاري في الإمارات؟": "يمكنك التقديم من خلال البنوك أو وسطاء الرهن العقاري.",
      "مع من يجب أن أتواصل للحصول على قرض عقاري؟": "يجب أن تتحدث إلى مستشار رهن عقاري أو مؤسسة مالية.",
      "كم عدد القروض العقارية التي يمكنني التقديم لها في الإمارات؟": "يمكنك التقديم لأكثر من قرض، لكن الموافقة تعتمد على الأهلية.",
     '? ما هي فوائد الرهن العقاري لسكان دولة الإمارات العربية المتحدة':'سيحصل المقيمون على: ١. أسعار فائدة أقل. ٢. يحصل المقيمون عادةً على أسعار فائدة تتراوح بين ٣٪ و٤٪، بينما يحصل غير المقيمين على أسعار فائدة تتراوح بين ٤.٥٪ و٦٪. ٣. نسبة قرض إلى قيمة أعلى تصل إلى ٨٠٪ للمقيمين مقابل ٥٠٪ إلى ٦٠٪ لغير المقيمين. ٤. إجراءات موافقة أسرع، حيث تُفضل البنوك المقيمين لموافقاتهم السريعة.',
    "إذا كان شخص ما يعمل وحصل على قرض عقاري في الإمارات، ويسدد أقساطه، ثم تلقى عرضًا جيدًا من الخارج ويرغب في السفر خارج الإمارات، فكيف يتعامل البنك مع هذه الحالات؟": "١. يمكنه سداد الأقساط بانتظام من خلال حساب السداد الخاص به. ٢. يمكنه سداد الأقساط بانتظام من خلال حساب السداد الخاص به.",
    "كيف يعمل الرهن العقاري الإسلامي، مع العلم أنه يحظر على العملاء المسلمين الحصول على قروض بفائدة؟": "من خلال ثلاث طرق:من خلال ثلاث طرق: المرابحة، الإجارة، والمشاركة.1. المرابحة: يشتري البنك العقار ويبيعه للعميل بربح متفق عليه مسبقًا. 2. الإجارة: يشتري البنك العقار ويؤجره للعميل، ويدفع العميل الإيجار الشهري حتى سداده بالكامل، ثم تنتقل الملكية. 3. المشاركة: يشتري البنك والعميل العقار بالشراكة، ويشتري العميل أسهم البنك تدريجيًا"
    },
    ru: {
      "Как подать заявку на ипотеку в ОАЭ?": "Вы можете подать заявку через банки или ипотечных брокеров.",
      "С кем мне связаться по поводу ипотеки?": "Вам следует обратиться к ипотечному консультанту или в финансовое учреждение.",
      "Сколько ипотек я могу получить в ОАЭ?": "Вы можете подать несколько заявок, но одобрение зависит от вашей платежеспособности.",
      'Каковы преимущества ипотеки для резидентов ОАЭ?':'«Резиденты получат 1. Более низкие процентные ставки. 2. Резиденты обычно получают ставки от 3% до 4%, в то время как нерезиденты сталкиваются с 4,5% до 6%. 3. Более высокие коэффициенты соотношения суммы кредита к стоимости залога — до 80% для резидентов против 50%-60% для нерезидентов. 4. Более быстрые процессы одобрения. Банки отдают предпочтение резидентам за более быстрые одобрения».',
      "Если кто-то работает и получил ипотеку в ОАЭ, выплачивает взносы, но получает хорошее предложение за границей и хочет уехать за пределы ОАЭ. Как банк поступает в таких случаях?" : "1. Он может регулярно вносить взносы через ваш расчетный счет. 2. Он может регулярно вносить взносы через ваш расчетный счет.",
      "Как работает исламская ипотека, учитывая, что клиентам-мусульманам запрещено брать кредиты под проценты?": "3 способами: мурабаха, иджара и мушарака1. Мурабаха, банк покупает недвижимость и продает клиенту с заранее оговоренной прибылью2. Иджара, банк покупает недвижимость и сдает ее в аренду клиенту, а клиент выплачивает ежемесячную арендную плату до полной оплаты, после чего происходит передача права собственности.3. Мушарака, это как если бы банк и клиент оба покупали недвижимость на условиях партнерства, а клиент постепенно покупает акции банка."
    }
  },
  auto: {
    en: {
      "Can I get a car loan with zero down payment?": "Some banks offer zero down payment options with certain conditions.",
      "What documents are needed for an auto loan?": "Usually: Emirates ID, salary certificate, and driving license.",
      "How long is the repayment period for car loans?": "Typically between 1 to 5 years."
    },
    ar: {
      "هل يمكنني الحصول على قرض سيارة بدون دفعة مقدمة؟": "تقدم بعض البنوك خيارات بدون دفعة مقدمة بشروط معينة.",
      "ما هي المستندات المطلوبة لقرض السيارة؟": "عادة: بطاقة الهوية الإماراتية، شهادة الراتب، ورخصة القيادة.",
      "ما هي مدة سداد قرض السيارة؟": "عادةً ما تكون بين سنة إلى خمس سنوات."
    },
    ru: {
      "Могу ли я получить автокредит без первоначального взноса?": "Некоторые банки предлагают такие условия при соблюдении определённых требований.",
      "Какие документы нужны для автокредита?": "Обычно: Emirates ID, справка о зарплате и водительское удостоверение.",
      "Каков срок погашения автокредита?": "Обычно от 1 до 5 лет."
    }
  },
  company: {
    en: {
      "How to start a business in UAE?": "You need to choose a legal structure and register with DED or a freezone.",
      "What are the costs of company formation?": "It varies by business type, location, and license category.",
      "Do I need a local sponsor?": "For mainland businesses, a UAE national partner is often required.",
      "If client wants to buy property in Abu Dhabi, the same only DlD -2 % ?" : "Yes"
    },
    ar: {
      "كيف أبدأ عملاً تجاريًا في الإمارات؟": "تحتاج إلى اختيار الهيكل القانوني والتسجيل لدى دائرة التنمية الاقتصادية أو في منطقة حرة.",
      "ما هي تكلفة تأسيس الشركة؟": "تختلف حسب نوع العمل والموقع وفئة الرخصة.",
      "هل أحتاج إلى كفيل محلي؟": "بالنسبة للشركات في المناطق الرئيسية، غالباً ما تحتاج إلى شريك إماراتي."
    },
    ru: {
      "Как начать бизнес в ОАЭ?": "Вам нужно выбрать юридическую форму и зарегистрироваться в DED или свободной экономической зоне.",
      "Каковы расходы на открытие компании?": "Это зависит от типа бизнеса, места и категории лицензии.",
      "Нужен ли местный спонсор?": "Для компаний в материковой части часто требуется партнер — гражданин ОАЭ."
    }
  },
  general: {
    en: {
      "Who created you?": "I was developed using the Google Gemini API.",
      "What can you do?": "I can answer questions, assist with tasks, and speak responses aloud!"
    },
    ar: {
      "من أنشأك؟": "تم تطويري باستخدام Google Gemini API.",
      "ماذا يمكنك أن تفعل؟": "يمكنني الإجابة على الأسئلة، والمساعدة في المهام، والتحدث بصوت مرتفع!"
    },
    ru: {
      "Кто тебя создал?": "Я был разработан с использованием Google Gemini API.",
      "Что ты умеешь?": "Я могу отвечать на вопросы, помогать с задачами и озвучивать ответы!"
    }
  }
};




// Populate dropdown based on category
function populateDropdown(category: string) {
  dropdownEl.innerHTML = '<option value="">Select a question</option>';
  const languageQuestions = segmentedQuestions[category]?.[selectedLanguage];
  if (languageQuestions) {
    for (const q in languageQuestions) {
      const option = document.createElement('option');
      option.value = q;
      option.textContent = q;
      dropdownEl.appendChild(option);
    }
  }
}



// Handle language change
languageSelect.addEventListener('change', () => {
  selectedLanguage = languageSelect.value;

  // Re-populate the dropdown with the new language
  const activeCategoryBtn = document.querySelector('.segment.active');
  if (activeCategoryBtn) {
    const category = activeCategoryBtn.getAttribute('data-category')!;
    populateDropdown(category);
  }
});


// Segment button logic
const segments = document.querySelectorAll('.segment');
segments.forEach(btn => {
  btn.addEventListener('click', () => {
    segments.forEach(b => b.classList.remove('active')); // Remove 'active' class from all segments
    btn.classList.add('active'); // Add 'active' class to the clicked segment
    const category = btn.getAttribute('data-category')!;
    populateDropdown(category); // Populate the dropdown based on selected category
    showQuestionSection(); // Always show the question section when a segment is clicked
  });
});

const defaultSegment = document.querySelector('.segment[data-category="mortgage"]') as HTMLElement;
if (defaultSegment) {
  defaultSegment.classList.add('active');
  populateDropdown('mortgage'); // Populate dropdown with default category
  showQuestionSection(); // Show the section for the default category
}


// Start speech recognition
let chunks: string[] = [];

let currentChunkIndex = 0;
let isPaused = false;

function saySpeaking() {
  const text = "Привет! Это длинное предложение, предназначенное для тестирования функции приостановки и возобновления. Надеюсь, это сработает хорошо.";
  speak(text); // Reuse the same function as other languages
}


function speakNextChunk() {
  if (currentChunkIndex >= chunks.length || isPaused) return;

  const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex]);
  utterance.lang = 'ru-RU';

  // Choose Russian voice manually
  const voice = speechSynthesis.getVoices().find(v => v.lang === 'ru-RU' && v.name.includes('Google'));
  if (voice) utterance.voice = voice;

  utterance.onend = () => {
    currentChunkIndex++;
    if (!isPaused) {
      speakNextChunk(); // Speak next sentence
    }
  };

  speechSynthesis.speak(utterance);
}

function pauseSpeaking() {
  isPaused = true;

  // For Russian (manual chunking), use pause instead of cancel
  if (selectedLanguage === 'ru') {
    speechSynthesis.pause();
  } else {
    speechSynthesis.pause(); // Works for others too
  }

  console.log("Speech paused");
}

function resumeSpeaking() {
  if (isPaused) {
    isPaused = false;

    if (selectedLanguage === 'ru') {
      // Resume Russian by manually calling speakNextChunk
      if (!speechSynthesis.speaking) {
        speakNextChunk();
      } else {
        speechSynthesis.resume(); // Resume if it's paused
      }
    } else {
      speechSynthesis.resume();
    }

    console.log("Speech resumed");
  }
}

function startListening(): void {
  speechSynthesis.cancel();
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = languageMap[selectedLanguage].langCode;
  recognition.start();
  console.log("Recognition language:", recognition.lang);


  recognition.onresult = function (event: SpeechRecognitionEvent): void {
    const text = event.results[0][0].transcript;
    transcriptEl.textContent = `You said: ${text}`;
    getGeminiResponse(text);
  };
}

// Ask custom question from dropdown
function askCustomQuestion(): void {
  const selected = dropdownEl.value;
  if (selected) {
    speechSynthesis.cancel();
    transcriptEl.textContent = `You selected: ${selected}`;
    getGeminiResponse(selected);
  }
}

// Add Q&A to history
function addToHistory(question: string, answer: string): void {
  const item = document.createElement('li');
  item.innerHTML = `<strong>You:</strong> ${question}<br><strong>Assistant:</strong> ${answer}`;
  historyEl.appendChild(item);
}

// Get Gemini response
async function getGeminiResponse(userText: string): Promise<void> {
  speechSynthesis.cancel();
  const lowerText = userText.toLowerCase();

  // Check for predefined answer
  for (const category in segmentedQuestions) {
    const questions = segmentedQuestions[category][selectedLanguage];
    for (const q in questions) {
      if (userText.trim() === q.trim()) {
        const reply = questions[q];
        responseEl.textContent = `Assistant: ${reply}`;
        speak(reply);
        addToHistory(userText, reply);
        return;
      }
    }
  }
  
  

  const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=AIzaSyBi2OE2UNv5s5-YMdZFaH4Z_XLUn8aSLVo`;
  const requestBody = {
    contents: [
      {
        parts: [
          { text: "Answer concisely and precisely, like a helpful assistant. Only provide answers that are relevant to the UAE market. Do not include information unrelated to the UAE." },
          { text: userText }
        ]
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't get that.";
  responseEl.textContent = `Assistant: ${reply}`;
  speak(reply);
  addToHistory(userText, reply);
}

// Speak response text
function speak(text: string): void {
  const cleanedText = text.replace(/[*_`#>]/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanedText);

  const voiceLang = languageMap[selectedLanguage].voiceLang;

  const speakWithVoice = () => {
    const voices = speechSynthesis.getVoices();

    console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));

    const matchedVoice = voices.find(voice => voice.lang.startsWith(voiceLang));
    
    if (matchedVoice) {
      console.log(`Using voice: ${matchedVoice.name} (${matchedVoice.lang})`);
      utterance.voice = matchedVoice;
    } else {
      console.warn(`No matching voice for: ${voiceLang}`);
    }

    speechSynthesis.cancel(); // Ensure no prior speech
    speechSynthesis.speak(utterance);
  };

  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = speakWithVoice;
  } else {
    speakWithVoice();
  }
}



// Pause / Resume
pauseBtn?.addEventListener("click", () => {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    console.log("Speech paused");
  }
});

resumeBtn?.addEventListener("click", () => {
  if (speechSynthesis.paused) {
    setTimeout(() => {
      speechSynthesis.resume();
      console.log("Speech resumed");
    }, 150); // Fixes timing bug in Chrome
  }
});

const askBtn = document.getElementById('askQuestionBtn');
askBtn?.addEventListener('click', () => {
  const activeCategoryBtn = document.querySelector('.segment.active');
  const category = activeCategoryBtn?.getAttribute('data-category') || 'mortgage';
  populateDropdown(category);
});



// Clear UI
function clearText(): void {
  transcriptEl.textContent = '';
  responseEl.textContent = '';
  historyEl.innerHTML = '';
  speechSynthesis.cancel();
}
clearBtn.addEventListener('click', clearText);

// Send typed question
sendBtn.addEventListener('click', () => {
  const typedText = textInput.value.trim();
  if (typedText !== '') {
    speechSynthesis.cancel();
    transcriptEl.textContent = `You typed: ${typedText}`;
    getGeminiResponse(typedText);
    textInput.value = '';
  }
});

// Expose to window
window.startListening = startListening;
window.clearText = clearText;
window.askCustomQuestion = askCustomQuestion;
window.speechSynthesis.onvoiceschanged = () => {
  const voices = speechSynthesis.getVoices();
  console.log('Available voices:');
  voices.forEach(v => {
    console.log(`${v.name} — ${v.lang} — ${v.default}`);
  });

  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
  }
  
}; 