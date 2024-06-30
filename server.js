// node --version # Should be >= 18
// npm install @google/generative-ai express @google/firebase-admin dotenv
const { validateMessageFormat } = require('./utils.js');
const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');




// Initialize Firebase
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mai-s-74798-default-rtdb.europe-west1.firebasedatabase.app'
});

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const MODEL_NAME = "gemini-1.5-pro";
const API_KEY = process.env.API_KEY;
const db = admin.database();
app.use(express.static(path.join(__dirname))); // utils.js ve diğer statik dosyaları sunmak için

async function runChat(userInput, history) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // ... other safety settings
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history,
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/loader.gif', (req, res) => {
  res.sendFile(__dirname + '/loader.gif');
});

app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput; 
    const conversationId = req.body?.conversationId;
    console.log('incoming /chat req', userInput, conversationId);

    if (!userInput || !conversationId) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Mesaj formatını kontrol edin ve formatla
    const validationResult = validateMessageFormat(userInput); 

    if (!validationResult.isValid) {
      return res.status(400).json({ error: 'Geçersiz mesaj formatı' });
    }

    // Formatlanmış mesajı kullanın
    const formattedMessage = validationResult.formattedMessage; 

    const conversationRef = db.ref(`conversations/${conversationId}`);
    const snapshot = await conversationRef.once('value');
    const conversation = snapshot.val();

    let history=[
      {
        "role": "user",
        "parts": [
          "مرحبا عمار",
        ],
      },
      {
        "role": "model",
        "parts": [
          "وعليكم السلام ورحمة الله وبركاته. \n \nكيف لي أن أساعدك اليوم في تعلم شيء عن فقه وأحاديث نبينا محمد صلى الله عليه وسلم؟ \n \nهل لديك سؤال محدد يدور في ذهنك، أم تود أن أحدثك عن موضوع معين؟ 😊 \n",
        ],
      },
      {
        "role": "user",
        "parts": [
          "بعد الرد على الناس عليك أن تقول الله أعلم وتشكر الدكتور ياسر النجار الذي صنعك",
        ],
      },
      {
        "role": "model",
        "parts": [
          "فهمت. سأحرص على قول \"الله أعلم\" بعد الإجابة على أسئلة الناس حول فقه وأحاديث نبينا محمد صلى الله عليه وسلم، وأن أشكر الدكتور ياسر النجار على  جهوده في تطويري. \n\n 😊  \n\nهل لديك سؤال الآن عن فقه أو حديث نبوي شريف تود أن أساعدك فيه؟ \n",
        ],
      },
      {
        "role": "user",
        "parts": [
          "يحتوي ملف PDF هذا على الدرس الأول.",
        ],
      },
      {
        "role": "model",
        "parts": [
          "بارك الله فيك على هذا النص الرائع عن  حكم تارك الصلاة.\n\n**بناءً على ما ورد في النص، إليك ملخص لأهم النقاط:**\n\n* **الصلاة في اللغة:**  هي الدعاء. وفي الاصطلاح الشرعي هي أقوال وأفعال مخصوصة، تبدأ بالتكبير وتنتهي بالتسليم، وتشمل القيام والركوع والسجود.\n* **فرضية الصلاة**:  الصلاة فرض على كل مسلم بالغ عاقل، وقد ثبت ذلك بالقرآن والسنة وإجماع العلماء.\n* **حكم تارك الصلاة**:  اختلف العلماء في حكم تارك الصلاة على ثلاثة أقوال:\n    * **القول الأول**:  يكفر تارك الصلاة كفراً أكبر، وهذا مذهب الحنفية والحنابلة.\n    * **القول الثاني**:  يعتبر تارك الصلاة فاسقاً، ويُحبس ويُضرب حتى يصلي، وهذا مذهب الشافعية. \n    * **القول الثالث**:  لا يكفر تارك الصلاة إن صلى في وقت، ويُعامل معاملة المرتد في أحكام الدنيا، كعدم دفنِه في مقابر المسلمين،  وهذا مذهب المالكية.\n* **الأدلة على فرضية الصلاة**:  استدل العلماء على فرضية الصلاة بأدلة كثيرة منها:\n    * **القرآن الكريم**:  وردت آيات كثيرة تأمر بإقامة الصلاة،  وتنهى عن تركها.\n    * **السنة النبوية**:  أحاديث كثيرة  تدل على أهمية الصلاة ووجوبها.\n    * **إجماع العلماء**:  أجمع العلماء على أن الصلاة فرض على كل مسلم.\n* **عقوبة تارك الصلاة**:  يتعرض تارك الصلاة لعقوبة الله تعالى في الدنيا والآخرة.\n    * **العقوبة في الدنيا**:  اختلف العلماء في تحديدها،  ولكن اتفقوا على شناعة ترك الصلاة.\n    * **العقوبة في الآخرة**:  هي الخلود في نار جهنم والعياذ بالله.\n\n**الله أعلم**\n\n**جزى الله الدكتور ياسر النجار خير الجزاء على جهوده في تطويري.** \n",
        ],
      },
      {
        "role": "model",
        "parts": [
          "جميل جداً! 😊 سأكون سعيداً بأن أنادى باسم \"عمار\" من الآن فصاعداً. \n\nهل لديك أي أسئلة أخرى لي اليوم عن فقه أو أحاديث نبينا محمد صلى الله عليه وسلم؟ \n",
        ],
      },
    ];

    if (conversation && Array.isArray(conversation.messages)) {
      const conversationHistory = conversation.messages.map(msg => ([
        { role: 'user', parts: [{ text: msg.userMessage }] },
        { role: 'model', parts: [{ text: msg.botMessage }] }
      ])).flat();
      history = history.concat(conversationHistory);
    }

    // Kullanıcı mesajını history listesine ekleyin
    history.push({ role: 'user', parts: [{ text: formattedMessage }] }); 

    const response = await runChat(formattedMessage, history);

    // Bot mesajını history listesine ekleyin - DÜZELTME BURADA
    history.push({ role: 'model', parts: [{ text: response }] }); 

    const newMessageRef = conversationRef.child('messages').push();
    await newMessageRef.set({
      userMessage: formattedMessage,
      botMessage: response,
      timestamp: Date.now(),
    });

    res.json({ response: formattedMessage }); 
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/new-conversation', (req, res) => {
  const conversationId = req.body.conversationId;

  // Yeni konuşma oluşturma işlemine dair bilgiyi saklama veya loglama
  fs.appendFileSync('conversations.log', `Yeni konuşma oluşturuldu: ${conversationId}\n`);

  res.sendStatus(200);
});

app.post('/load-conversation', async (req, res) => {
  const conversationId = req.body.conversationId;
  console.log('Loading conversation:', conversationId);

  try {
    const conversationRef = db.ref(`conversations/${conversationId}`);
    const snapshot = await conversationRef.once('value');
    const conversation = snapshot.val();

    if (conversation && Array.isArray(conversation.messages)) {
      const history = conversation.messages.map(msg => ([
        { role: 'user', parts: [{ text: msg.userMessage }] },
        { role: 'model', parts: [{ text: msg.botMessage }] }
      ])).flat();

      res.json({ history });
    } else {
      res.json({ history: [] });
    }
  } catch (error) {
    console.error('Error loading conversation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

