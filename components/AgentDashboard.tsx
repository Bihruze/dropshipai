import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  FileText,
  DollarSign,
  Sparkles,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Megaphone,
  Target,
  Copy,
  RotateCcw,
} from 'lucide-react';

interface AgentTask {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  endpoint: string;
  placeholder: string;
}

const TASKS: AgentTask[] = [
  {
    id: 'trend',
    name: 'Trend Analizi',
    description: 'Ürün trendlerini ve pazar potansiyelini analiz eder',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'bg-green-500',
    endpoint: '/api/ai/trend',
    placeholder: 'Örn: Kablosuz kulaklık, Akıllı saat, Yoga matı...',
  },
  {
    id: 'research',
    name: 'Ürün Araştırma',
    description: 'Maliyet, kar marjı ve potansiyel değerlendirmesi',
    icon: <Search className="w-5 h-5" />,
    color: 'bg-blue-500',
    endpoint: '/api/ai/research',
    placeholder: 'Örn: LED şerit ışık, Telefon kılıfı...',
  },
  {
    id: 'content',
    name: 'İçerik Oluştur',
    description: 'SEO uyumlu başlık, açıklama ve bullet point',
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-purple-500',
    endpoint: '/api/ai/content',
    placeholder: 'Ürün adını girin...',
  },
  {
    id: 'price',
    name: 'Fiyat Optimizasyonu',
    description: 'Rekabetçi fiyat stratejisi önerileri',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'bg-orange-500',
    endpoint: '/api/ai/price',
    placeholder: 'Ürün adını girin...',
  },
  {
    id: 'competitors',
    name: 'Rakip Analizi',
    description: 'Rakipleri analiz et ve strateji öner',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-red-500',
    endpoint: '/api/ai/competitors',
    placeholder: 'Ürün veya niş girin...',
  },
  {
    id: 'marketing',
    name: 'Reklam Metni',
    description: 'Facebook, Google, Instagram reklam içeriği',
    icon: <Megaphone className="w-5 h-5" />,
    color: 'bg-pink-500',
    endpoint: '/api/ai/marketing',
    placeholder: 'Ürün adını girin...',
  },
  {
    id: 'seo',
    name: 'SEO Optimizasyonu',
    description: 'Anahtar kelimeler ve meta etiketler',
    icon: <Target className="w-5 h-5" />,
    color: 'bg-indigo-500',
    endpoint: '/api/ai/seo',
    placeholder: 'Ürün adını girin...',
  },
];

const AgentDashboard: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [inputText, setInputText] = useState('');
  const [platform, setPlatform] = useState<'facebook' | 'google' | 'instagram' | 'email'>('facebook');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ task: string; input: string; result: string }>>([]);

  const runTask = async () => {
    if (!selectedTask || !inputText.trim()) {
      setError('Lütfen bir ürün veya niş girin');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const body: Record<string, string> = { product: inputText };

      if (selectedTask.id === 'marketing') {
        body.platform = platform;
      }

      const response = await fetch(`${apiUrl}${selectedTask.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setHistory(prev => [
          { task: selectedTask.name, input: inputText, result: data.data },
          ...prev.slice(0, 9), // Keep last 10
        ]);
      } else {
        // Fallback to mock if API not configured
        setResult(getMockResult(selectedTask.id, inputText));
        setError('Demo mod: Claude API bağlı değil. Render\'da CLAUDE_API_KEY ekleyin.');
      }
    } catch (err) {
      // Fallback to mock
      setResult(getMockResult(selectedTask.id, inputText));
      setError('Demo mod: Backend bağlantısı yok.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMockResult = (taskId: string, input: string): string => {
    const mocks: Record<string, string> = {
      trend: `📊 "${input}" Trend Analizi

📈 Arama Hacmi: Yüksek (aylık 45K+ arama)
📊 Büyüme Trendi: %28 artış (son 6 ay)
🎯 Rekabet: Orta seviye
📅 En İyi Dönem: Kasım-Ocak

💡 Öneriler:
• Şu an piyasaya giriş için uygun zaman
• Video içeriklerle ürünü tanıtın
• Mikro influencer işbirlikleri düşünün

⭐ Potansiyel Skoru: 82/100`,

      research: `🔍 "${input}" Ürün Değerlendirmesi

💰 Tahmini Maliyet: $8 - $15
🏷️ Önerilen Satış: $29.99 - $39.99
📊 Kar Marjı: %55-65
📦 Kargo Süresi: 7-14 gün (Çin'den)

⚠️ Riskler:
• Kargo süresinde gecikmeler olabilir
• Kalite kontrolü önemli

✅ Avantajlar:
• Yüksek talep
• Düşük iade oranı
• Tekrar satın alma potansiyeli

⭐ Genel Skor: 85/100 - ÖNERİLİR`,

      content: `✍️ "${input}" İçerik Paketi

📌 BAŞLIK:
"Premium ${input} | Ücretsiz Kargo | 30 Gün İade Garantisi"

📝 KISA AÇIKLAMA:
Hayatınızı kolaylaştıran ${input} ile tanışın. Yüksek kalite, modern tasarım.

📄 DETAYLI AÇIKLAMA:
${input} arayanlar için mükemmel seçim! Özenle seçilmiş malzemeler ve ergonomik tasarımıyla günlük kullanım için ideal. Dayanıklı yapısı sayesinde uzun ömürlü kullanım sunar.

• Özellikler:
✓ Premium kalite malzeme
✓ Ergonomik tasarım
✓ Kolay kullanım
✓ Hafif ve taşınabilir
✓ 30 gün iade garantisi

🏷️ SEO ETİKETLERİ:
${input}, online alışveriş, hızlı kargo, uygun fiyat, kaliteli ürün`,

      price: `💰 "${input}" Fiyat Stratejisi

📊 RAKIP ANALİZİ:
• Amazon: $24.99 - $45.99
• Yerel Mağazalar: $35 - $55
• Diğer Online: $29.99 - $39.99

💵 ÖNERİLEN FİYATLAR:
• Giriş Fiyatı: $27.99 (pazar payı kazan)
• Normal Fiyat: $34.99 (optimal)
• Premium: $44.99 (değer algısı)

📈 STRATEJİ:
1. İlk hafta %20 indirimle başla
2. İlk 50 yorum sonrası normal fiyata geç
3. Bundle teklifleri oluştur (+%25 sepet değeri)

🎯 Hedef Kar Marjı: %45-55`,

      competitors: `👥 "${input}" Rakip Analizi

🏪 ANA RAKİPLER:
1. Amazon Satıcıları - Fiyat avantajı, hızlı kargo
2. Trendyol/Hepsiburada - Yerel güven
3. Niche Mağazalar - Uzman imajı

💪 SENİN AVANTAJLARIN:
• Daha iyi müşteri hizmeti sunabilirsin
• Niş odaklı pazarlama yapabilirsin
• Sosyal medyada hikaye anlatabilirsin

🎯 FARKLALAŞMA STRATEJİLERİ:
1. Video içerik üret (kullanım rehberi)
2. Ürün paketleri oluştur
3. Hızlı müşteri desteği vaat et
4. Sosyal kanıt (UGC) topla

⚡ HIZLI KAZANIM:
İlk 30 gün yoğun sosyal medya + influencer`,

      marketing: `📣 "${input}" Reklam İçeriği

🔵 FACEBOOK REKLAMI:
━━━━━━━━━━━━━━━
"${input} arıyorsanız, arama bitti! 🎯

✅ Premium kalite
✅ Ücretsiz kargo
✅ 30 gün iade garantisi

⏰ Sınırlı süre %20 indirim!
👆 Hemen sipariş ver"
━━━━━━━━━━━━━━━

📸 INSTAGRAM CAPTION:
"${input} ile hayatın daha kolay! ✨

Siz de binlerce mutlu müşterimiz gibi kaliteyi keşfedin 🛍️

🔗 Link bio'da
📦 Ücretsiz kargo

#${input.replace(/\s/g, '')} #onlinealışveriş #kalite #indirim"

📧 EMAİL KONU:
"${input} - Sadece size özel %20 indirim! 🎁"`,

      seo: `🎯 "${input}" SEO Optimizasyonu

🔑 ANA ANAHTAR KELİMELER:
1. ${input}
2. ${input} fiyat
3. en iyi ${input}
4. ${input} satın al
5. ucuz ${input}

🔗 UZUN KUYRUK:
1. "${input} online satın al"
2. "en kaliteli ${input} markaları"
3. "${input} yorumları"
4. "${input} nasıl seçilir"
5. "2024 en iyi ${input}"

📝 META BAŞLIK:
"${input} | En Uygun Fiyat & Ücretsiz Kargo ✓"

📄 META AÇIKLAMA:
"${input} arayanlar için en iyi seçenekler. ✓ Kalite garantisi ✓ Hızlı kargo ✓ Kolay iade. Hemen sipariş verin!"

🔗 URL ÖNERİSİ:
/urunler/${input.toLowerCase().replace(/\s/g, '-')}`,
    };

    return mocks[taskId] || 'Sonuç oluşturulamadı.';
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setInputText('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-indigo-600" />
            AI Asistan
          </h1>
          <p className="text-gray-500 mt-1">
            Yapay zeka ile dropshipping otomasyonu
          </p>
        </div>
        {history.length > 0 && (
          <span className="text-sm text-gray-400">{history.length} analiz yapıldı</span>
        )}
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {TASKS.map((task) => (
          <button
            key={task.id}
            onClick={() => {
              setSelectedTask(task);
              setResult(null);
              setError(null);
            }}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              selectedTask?.id === task.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 ${task.color} rounded-xl text-white flex items-center justify-center mx-auto mb-2`}>
              {task.icon}
            </div>
            <h3 className="font-medium text-gray-900 text-sm">{task.name}</h3>
          </button>
        ))}
      </div>

      {/* Main Panel */}
      {selectedTask ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${selectedTask.color} rounded-xl text-white`}>
                {selectedTask.icon}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedTask.name}</h2>
                <p className="text-sm text-gray-500">{selectedTask.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && runTask()}
                placeholder={selectedTask.placeholder}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              {selectedTask.id === 'marketing' && (
                <div className="flex gap-2">
                  {(['facebook', 'google', 'instagram', 'email'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        platform === p
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={runTask}
                disabled={isLoading || !inputText.trim()}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analiz ediliyor...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Çalıştır
                  </>
                )}
              </button>
              {result && (
                <button
                  onClick={reset}
                  className="px-4 py-3 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Sonuç</h2>
              {result && (
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Kopyala"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            {result ? (
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700 text-sm leading-relaxed max-h-[500px] overflow-y-auto">
                {result}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">
                  Ürün/niş girin ve "Çalıştır" butonuna tıklayın
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900 text-xl mb-2">AI Asistanı Seçin</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Yukarıdaki görevlerden birini seçerek yapay zeka analizini başlatın.
          </p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Son Analizler</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">{item.task}</span>
                  <span className="text-sm text-gray-400">"{item.input}"</span>
                </div>
                <button
                  onClick={() => {
                    setResult(item.result);
                    setInputText(item.input);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Görüntüle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="font-semibold mb-2">💡 Gerçek AI için</h3>
        <p className="text-indigo-100 text-sm">
          Render'da <code className="bg-white/20 px-2 py-0.5 rounded">CLAUDE_API_KEY</code> ekleyerek gerçek Claude AI yanıtları alabilirsiniz.
          Key almak için: <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a>
        </p>
      </div>
    </div>
  );
};

export default AgentDashboard;
