// Declare missing types for Web Speech API
declare global {
    interface Window {
      SpeechRecognition: any;
      webkitSpeechRecognition: any;
      startListening: () => void;
      stopSpeaking: () => void;
      clearText: () => void;
      askCustomQuestion: () => void;
    }
  
    interface SpeechRecognitionEvent extends Event {
      results: SpeechRecognitionResultList;
    }
  }
  
  export {};
  
  // DOM elements
  const transcriptEl = document.getElementById('transcript')!;
  const responseEl = document.getElementById('response')!;
  const stopBtn = document.getElementById('stopSpeaking')!;
  const clearBtn = document.getElementById('clearText')!;
  const historyEl = document.getElementById('history')!;
  const dropdownEl = document.getElementById('customQuestion') as HTMLSelectElement;
  
  // Your Gemini API key
  const apiKey = 'AIzaSyBi2OE2UNv5s5-YMdZFaH4Z_XLUn8aSLVo';
  
  // Custom answers
  const customAnswers: Record<string, string> = {
    "How can I apply for a mortgage in UAE?": "I'm your awesome voice assistant built with Gemini!",
    "To whom I get connect to for mortgage?": "I was created by my developer with help from Google Gemini.",
    "How many mortgages can I apply for in UAE?": "I can chat, answer questions, and help you with tasks!"
  };
  
  // Populate dropdown
  for (const question in customAnswers) {
    const option = document.createElement('option');
    option.value = question;
    option.textContent = question;
    dropdownEl.appendChild(option);
  }
  
  // Start speech recognition
  function startListening(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
  
    recognition.lang = 'en-US';
    recognition.start();
  
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
    const lowerText = userText.toLowerCase();
  
    // Check for custom answer
    for (const question in customAnswers) {
      if (lowerText.includes(question)) {
        const reply = customAnswers[question];
        responseEl.textContent = `Assistant: ${reply}`;
        speak(reply);
        addToHistory(userText, reply);
        return;
      }
    }
  
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=AIzaSyBi2OE2UNv5s5-YMdZFaH4Z_XLUn8aSLVo`;
    const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Answer concisely and precisely, like a helpful assistant."
              },
              {
                text: userText
              }
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
  
  // Speak text
  function speak(text: string): void {
    const cleanedText = text.replace(/[*_`#>]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    speechSynthesis.speak(utterance);
  }
  
  // Stop speaking
  function stopSpeaking(): void {
    speechSynthesis.cancel();
  }
  stopBtn.addEventListener('click', stopSpeaking);
  
  // Clear transcript, response, and history
  function clearText(): void {
    transcriptEl.textContent = '';
    responseEl.textContent = '';
    historyEl.innerHTML = '';
    speechSynthesis.cancel();
  }
  clearBtn.addEventListener('click', clearText);
  
  // Expose functions
  window.startListening = startListening;
  window.stopSpeaking = stopSpeaking;
  window.clearText = clearText;
  window.askCustomQuestion = askCustomQuestion;
  