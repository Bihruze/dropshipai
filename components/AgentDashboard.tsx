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
} from 'lucide-react';

interface AgentTask {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  result?: string;
}

const AgentDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<AgentTask[]>([
    {
      id: 'trend',
      name: 'Trend Analizi',
      description: 'Popüler ürün trendlerini ve niş pazarları analiz eder',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-green-500',
      status: 'idle',
    },
    {
      id: 'product',
      name: 'Ürün Araştırma',
      description: 'Yüksek kar marjlı ürünleri bulur ve değerlendirir',
      icon: <Search className="w-6 h-6" />,
      color: 'bg-blue-500',
      status: 'idle',
    },
    {
      id: 'content',
      name: 'İçerik Oluştur',
      description: 'SEO uyumlu ürün başlıkları ve açıklamaları yazar',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-purple-500',
      status: 'idle',
    },
    {
      id: 'price',
      name: 'Fiyat Optimizasyonu',
      description: 'Rekabetçi ve karlı fiyat önerileri sunar',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-orange-500',
      status: 'idle',
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const runTask = async (taskId: string) => {
    if (!inputText.trim()) {
      alert('Lütfen bir ürün veya niş girin');
      return;
    }

    // Update task status
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'running' as const } : t
    ));
    setOutputText('');

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2000));

    // Generate mock result based on task type
    let result = '';
    switch (taskId) {
      case 'trend':
        result = `📊 "${inputText}" için Trend Analizi:

• Arama hacmi: Yüksek (aylık 50K+)
• Büyüme trendi: %23 artış (son 3 ay)
• Rekabet seviyesi: Orta
• En iyi satış dönemi: Kasım-Ocak

💡 Öneri: Bu niş şu an yükselişte. Hızlı hareket edilmeli.`;
        break;
      case 'product':
        result = `🔍 "${inputText}" Ürün Değerlendirmesi:

• Tahmini maliyet: $8-15
• Önerilen satış fiyatı: $29.99
• Kar marjı: %45-60
• Kargo süresi: 7-14 gün

⭐ Skor: 85/100 - İyi potansiyel`;
        break;
      case 'content':
        result = `✍️ "${inputText}" için İçerik:

📌 Başlık:
"Premium ${inputText} - Ücretsiz Kargo | Hızlı Teslimat"

📝 Açıklama:
Yüksek kaliteli ${inputText} ile hayatınızı kolaylaştırın. Modern tasarım, dayanıklı malzeme ve 30 gün iade garantisi.

🏷️ Etiketler: ${inputText}, online alışveriş, hızlı kargo`;
        break;
      case 'price':
        result = `💰 "${inputText}" Fiyat Analizi:

• Rakip fiyat aralığı: $19.99 - $39.99
• Ortalama piyasa fiyatı: $27.50
• Önerilen giriş fiyatı: $24.99
• Premium fiyat: $34.99

📈 Strateji: Orta fiyatla başla, yorumlar gelince artır.`;
        break;
    }

    setOutputText(result);
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'completed' as const, result } : t
    ));
  };

  const resetTask = (taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'idle' as const, result: undefined } : t
    ));
    if (selectedTask === taskId) {
      setOutputText('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-indigo-600" />
          AI Asistan
        </h1>
        <p className="text-gray-500 mt-1">
          Yapay zeka ile ürün araştırması, içerik ve fiyat optimizasyonu yapın
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">AI Görevleri</h2>
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTask(task.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedTask === task.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${task.color} rounded-xl text-white`}>
                  {task.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{task.name}</h3>
                    {task.status === 'running' && (
                      <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    )}
                    {task.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {task.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Input/Output Panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTask ? (
            <>
              {/* Input Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">
                  {tasks.find(t => t.id === selectedTask)?.name}
                </h2>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">
                    Ürün adı veya niş girin:
                  </label>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Örn: Kablosuz kulaklık, Yoga matı, Pet malzemeleri..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => runTask(selectedTask)}
                    disabled={tasks.find(t => t.id === selectedTask)?.status === 'running'}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {tasks.find(t => t.id === selectedTask)?.status === 'running' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Çalışıyor...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Çalıştır
                      </>
                    )}
                  </button>
                  {tasks.find(t => t.id === selectedTask)?.status === 'completed' && (
                    <button
                      onClick={() => resetTask(selectedTask)}
                      className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                    >
                      Sıfırla
                    </button>
                  )}
                </div>
              </div>

              {/* Output Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Sonuç</h2>
                {outputText ? (
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                    {outputText}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Sonuçlar burada görünecek</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">AI Asistanı Kullanın</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Soldaki görevlerden birini seçin ve ürün/niş bilgisi girerek yapay zeka analizini başlatın.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <h3 className="font-semibold text-indigo-900 mb-2">Nasıl Çalışır?</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-indigo-700">
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Soldaki görevlerden birini seçin</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>Ürün veya niş adı girin</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>"Çalıştır" butonuna tıklayın</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>AI sonuçlarını inceleyin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
