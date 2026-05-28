import { useState, useEffect } from 'react';
import './App.css';

type Genre = '💻 開発' | '📦 メルカリ' | '🧹 生活' | '🎨 その他';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: 'weekday' | 'weekend';
  priority: 'high' | 'medium' | 'low';
  genre: Genre;
  isPinned: boolean;
  createdAt: number;
  completedAt?: number;
}

// プロンプト図鑑・編集用のインターフェース
interface PromptTemplate {
  id: string;
  keyword: string; // 反応する文字（カンマ区切りで複数保持可能）
  title: string;   // ボタンの表示名
  description: string; // 何のためのプロンプトか
  promptText: string;  // プロンプトの本体
  isSystem?: boolean;  // システム初期プロンプトかどうか
}

// 初期テンプレートの定義
const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'step',
    keyword: '',
    title: '🛠️ タスク分解',
    description: 'どんなタスクでも、最短で終わらせるための具体的なステップと注意点に分解します。',
    promptText: '私は今、TODOタスク『${todoText}』をやろうとしています。このタスクを効率よく最短で終わらせるための具体的なステップ、必要なもの、および注意点を箇条書きで分かりやすく出力してください。',
    isSystem: true
  },
  {
    id: 'structure',
    keyword: '',
    title: '📄 構成案作成',
    description: 'ブログ、ドキュメント、報告書などのロジカルな目次と要点を自動構築します。',
    promptText: '『${todoText}』に関する制作・執筆を行いたいです。全体のロジカルな構成案（目次・セクション分け）と、各セクションで書くべき要点を詳しく提示してください。',
    isSystem: true
  },
  {
    id: 'mercari',
    keyword: 'メルカリ,フリマ,出品',
    title: '📦 メルカリ出品文',
    description: 'タスク名の商品から、購入者に刺さるタイトル、説明文、タグをフルセットで生成します。',
    promptText: '『${todoText}』に関するメルカリ出品を行います。購入者に刺さる魅力的な商品タイトル（30文字以内）、商品説明文（状態・サイズ・発送方法のテンプレート含む）、およびハッシュタグを5つ生成してください。',
    isSystem: true
  },
  {
    id: 'shareholder',
    keyword: '株主優待,優待,投資',
    title: '🎁 優待リサーチ',
    description: '銘柄名から、利回り、優待条件、AIによる将来性・改悪リスク評価をまとめた最強のNotionコピペ用テーブルを作ります。',
    promptText: '【目的：株主優待の定期的なリサーチ・メモ作成】\n私は今、隙間時間を利用して『${todoText}』についてリサーチし、あとで見返したときに一発で投資判断ができる完璧なメモを作成したいと考えています。\n\n以下の【リサーチ確認項目】について、最新のデータとAIによる客観的な企業評価を統合し、Notionやメモ帳にそのままコピペしてデータベース化できる「Markdownの表（テーブル）形式」および「箇条書き」で不足なく情報を出力してください。\n\n■ リサーチ確認項目：\n1. 株の銘柄名\n2. 銘柄コード\n3. 現在の株価\n4. 最低株主優待の取得に必要な株数\n5. 株主優待の具体的な内容\n6. 優待取得に必要な最低投資金額（現在の株価×最低株数）\n7. 長期保有優遇制度の有無\n8. 長期保有優遇がある場合、その具体的な内容と条件\n9. 優待のジャンル（例：飲食券、買い物券、自社製品、カタログギフト等）\n10. 株主権利確定月\n11. 優待取得の特殊な条件（例：○年以上の継続保有必須など）\n12. 優待取得条件を達成しているかどうかの確認方法（企業HPでの確認方法や基準）\n13. 予想配当金（1株あたりおよび最低株数あたり）\n\n■ AIによる企業評価（詳細に分析してください）：\n・今後の株価の方向性（業績推移、成長性からの予測）\n・配当金の割合（配当利回り）\n・株主優待を含めた総合実質利回り（優待＋配当の割合）\n・配当の安定性（過去の減配リスク、利益剰余金の余裕度）\n・【補足重要項目】過去3年間における優待の改悪・廃止リスクの歴史や前兆\n・【補足重要項目】優待の有効期限、および電子化されているかなど実際の使いやすさ\n・その他、投資する上で知っておくべき有益な情報\n\n上記の項目を、漏れなく見やすく整理して出力してください。',
    isSystem: true
  },
  {
    id: 'summary',
    keyword: '要約,読書,本,記事',
    title: '📚 超スピード要約',
    description: 'インプットした本や長文記事の核心を3つの要点と2つの行動プランに限界まで凝縮します。',
    promptText: '『${todoText}』に関するインプット（本・記事・動画など）を行います。この内容から得られる最重要のエッセンス（要点）を3つ、今日から実践できる具体的なアクションプランを2つに凝縮し、中学生でも一発で理解できるように分かりやすく要約・出力してください。',
    isSystem: true
  },
  {
    id: 'routine',
    keyword: '習慣,ルーティン,継続',
    title: '🔄 爆速習慣化',
    description: '意志の力に頼らず、心理学的な行動トリガー（if-thenプラン）を用いて行動を自動ルーティン化します。',
    promptText: '私は『${todoText}』という行動を三日坊主で終わらせず、自分の意志の力に頼らずに自動で習慣化したいです。心理学的に行動のハードルを限界まで下げるための「if-thenプランニング（例：Aをしたら、必ずBをする）」の具体的な仕組みを3パターン提案してください。',
    isSystem: true
  },
  {
    id: 'idea',
    keyword: 'アイデア,ブレスト,企画',
    title: '💡 脳汁ブレスト',
    description: '煮詰まったテーマに対し、手堅い凡才案3つと、常識を破壊する変態案3つを同時に引き出します。',
    promptText: '『${todoText}』というテーマについてブレインストーミングを行います。誰もが思いつく「一般的な凡才のアイデア」を3つと、常識を覆すような「誰も思いつかない狂った変態的アイデア」を3つ、合わせて6つの異なる切り口やアプローチを具体的に提案してください。',
    isSystem: true
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'weekday' | 'weekend' | 'history' | 'prompts'>('weekday');
  
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('taskbuddy-todos');
    return saved ? JSON.parse(saved) : [];
  });

  const [prompts, setPrompts] = useState<PromptTemplate[]>(() => {
    const saved = localStorage.getItem('taskbuddy-templates');
    return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
  });

  const [inputText, setInputText] = useState('');
  const [inputPriority, setInputPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [inputGenre, setInputGenre] = useState<Genre>('💻 開発');
  const [toastMessage, setToastMessage] = useState('');

  // 新規カスタムプロンプト作成用のフォーム状態
  const [customKeyword, setCustomKeyword] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customPromptText, setCustomPromptText] = useState('');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

  useEffect(() => {
    const cleanupExpiredTodos = () => {
      const NOW = Date.now();
      const FORTY_EIGHT_HOURS = 2 * 24 * 60 * 60 * 1000;
      setTodos(prevTodos => prevTodos.filter(todo => {
        if (todo.completed && todo.completedAt) {
          return NOW - todo.completedAt < FORTY_EIGHT_HOURS;
        }
        return true;
      }));
    };
    cleanupExpiredTodos();
    const interval = setInterval(cleanupExpiredTodos, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('taskbuddy-todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('taskbuddy-templates', JSON.stringify(prompts));
  }, [prompts]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputText,
      completed: false,
      category: activeTab === 'history' || activeTab === 'prompts' ? 'weekday' : activeTab,
      priority: inputPriority,
      genre: inputGenre,
      isPinned: false,
      createdAt: Date.now()
    };

    setTodos([newTodo, ...todos]);
    setInputText('');
    setInputPriority('medium');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        const nextCompleted = !todo.completed;
        return {
          ...todo,
          completed: nextCompleted,
          isPinned: nextCompleted ? false : todo.isPinned,
          completedAt: nextCompleted ? Date.now() : undefined
        };
      }
      return todo;
    }));
  };

  const togglePin = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, isPinned: !todo.isPinned } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 複数キーワード（カンマ区切り）に対応する判定ロジック
  const checkPromptMatch = (todoText: string, template: PromptTemplate) => {
    if (!template.keyword) return false;
    
    const lowerText = todoText.toLowerCase();
    const keywords = template.keyword.split(/[,，、]/).map(k => k.trim().toLowerCase());
    
    return keywords.some(kw => kw !== '' && lowerText.includes(kw));
  };

  // コピー実行処理
  const handleAiAssist = (todoText: string, template: PromptTemplate) => {
    const finalPrompt = template.promptText.replace(/\${todoText}/g, todoText);

    navigator.clipboard.writeText(finalPrompt).then(() => {
      setToastMessage(`📋 【${template.title}】のプロンプトをクリップボードにコピーしました！`);
      setTimeout(() => setToastMessage(''), 3000);
    });
  };

  // カスタムプロンプトの追加・編集保存
  const saveCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customPromptText.trim()) {
      alert('タイトル、プロンプト本文は必須入力です！');
      return;
    }

    if (editingPromptId) {
      setPrompts(prompts.map(p => p.id === editingPromptId ? {
        ...p,
        keyword: customKeyword.trim(),
        title: customTitle.trim(),
        description: customDesc.trim(),
        promptText: customPromptText
      } : p));
      setEditingPromptId(null);
      setToastMessage('💾 プロンプトを更新しました！');
    } else {
      const newPrompt: PromptTemplate = {
        id: crypto.randomUUID(),
        keyword: customKeyword.trim(),
        title: customTitle.trim(),
        description: customDesc.trim(),
        promptText: customPromptText,
        isSystem: false
      };
      setPrompts([...prompts, newPrompt]);
      setToastMessage('✨ 新しいAIプロンプトを登録しました！');
    }

    setCustomKeyword('');
    setCustomTitle('');
    setCustomDesc('');
    setCustomPromptText('');
    setTimeout(() => setToastMessage(''), 2000);
  };

  const deletePrompt = (id: string) => {
    if (window.confirm('このプロンプトを削除してもよろしいですか？')) {
      setPrompts(prompts.filter(p => p.id !== id));
    }
  };

  const startEditPrompt = (p: PromptTemplate) => {
    setEditingPromptId(p.id);
    setCustomKeyword(p.keyword);
    setCustomTitle(p.title);
    setCustomDesc(p.description);
    setCustomPromptText(p.promptText);
    document.getElementById('custom-prompt-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyDailyReport = () => {
    const historyTodos = todos.filter(todo => todo.completed);
    if (historyTodos.length === 0) {
      setToastMessage('⚠️ 完了したタスクがありません');
      setTimeout(() => setToastMessage(''), 2000);
      return;
    }
    const todayStr = new Date().toLocaleDateString('ja-JP');
    let reportText = `### 📅 成果報告（${todayStr}）\n今日も圧倒的成長！直近2日間で完了したタスクのまとめです。\n\n`;
    const priorityJa = { high: '🔥高', medium: '⚡中', low: '🌱低' };
    historyTodos.forEach(todo => {
      reportText += `- [${todo.genre}] ${todo.text} （優先度：${priorityJa[todo.priority]}）\n`;
    });

    navigator.clipboard.writeText(reportText).then(() => {
      setToastMessage('📝 【Markdown成果日報】をクリップボードにコピーしました！');
      setTimeout(() => setToastMessage(''), 3000);
    });
  };

  const getFilteredAndSortedTodos = () => {
    const filtered = todos.filter(todo => {
      if (activeTab === 'history') return todo.completed;
      if (activeTab === 'prompts') return false;
      return todo.category === activeTab && !todo.completed;
    });
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  };

  const displayTodos = getFilteredAndSortedTodos();
  const pinnedTodo = activeTab !== 'history' && activeTab !== 'prompts' ? displayTodos.find(t => t.isPinned) : null;

  const historyTodos = todos.filter(todo => todo.completed);
  const genreCounts = historyTodos.reduce((acc, todo) => {
    acc[todo.genre] = (acc[todo.genre] || 0) + 1;
    return acc;
  }, {} as Record<Genre, number>);

  const totalHistory = historyTodos.length;
  const currentCategoryTodos = todos.filter(todo => todo.category === (activeTab === 'history' || activeTab === 'prompts' ? 'weekday' : activeTab));
  const progressPercentage = currentCategoryTodos.length > 0 ? Math.round((currentCategoryTodos.filter(todo => todo.completed).length / currentCategoryTodos.length) * 100) : 0;

  const activeDetectedPrompts = prompts.filter(p => checkPromptMatch(inputText, p));

  return (
    <div className="app-container">
      {toastMessage && <div className="toast-fixed-top">{toastMessage}</div>}

      <header className="app-header">
        <h1>🚀 TaskBuddy</h1>
        <p>Your Ultimate AI-Powered Task Companion</p>
      </header>

      <div className="tab-container">
        <button className={`tab-button ${activeTab === 'weekday' ? 'active' : ''}`} onClick={() => setActiveTab('weekday')}>
          💼 平日
        </button>
        <button className={`tab-button ${activeTab === 'weekend' ? 'active' : ''}`} onClick={() => setActiveTab('weekend')}>
          🏕️ 土日・祝日
        </button>
        <button className={`tab-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          ⏳ 過去ログ (2日制限)
        </button>
        <button className={`tab-button ${activeTab === 'prompts' ? 'active' : ''}`} style={{ borderLeft: '1px solid #374151' }} onClick={() => setActiveTab('prompts')}>
          💡 AIプロンプト図鑑
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="analytics-container">
          <div className="analytics-header">
            <h3>📊 直近2日間の成果ジャンル</h3>
            {totalHistory > 0 && (
              <button type="button" onClick={copyDailyReport} className="report-copy-button">
                📋 成果日報をコピー
              </button>
            )}
          </div>
          {totalHistory > 0 ? (
            <div className="analytics-bar-wrapper">
              {(['💻 開発', '📦 メルカリ', '🧹 生活', '🎨 その他'] as Genre[]).map(g => {
                const count = genreCounts[g] || 0;
                const pct = totalHistory > 0 ? Math.round((count / totalHistory) * 100) : 0;
                if (count === 0) return null;
                return (
                  <div key={g} className="analytics-row">
                    <span className="analytics-label">{g} ({count}個)</span>
                    <div className="analytics-bar-bg">
                      <div className="analytics-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="analytics-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-message" style={{ padding: '10px 0 0 0' }}>まだ集計データがありません。</p>
          )}
        </div>
      )}

      {pinnedTodo && (
        <div className="focus-card">
          <div className="focus-badge">🔥 NOW FOCUSING</div>
          <h2 className="focus-text">{pinnedTodo.text}</h2>
          <div className="focus-meta">
            <span>ジャンル: {pinnedTodo.genre}</span>
            <span>|</span>
            <span>優先度: {pinnedTodo.priority === 'high' ? '🔥高' : pinnedTodo.priority === 'medium' ? '⚡中' : '🌱低'}</span>
          </div>
        </div>
      )}

      {activeTab !== 'history' && activeTab !== 'prompts' && (
        <div className="progress-container">
          <div className="progress-bar-header">
            <span>バディの本日達成度</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      )}

      {activeTab !== 'history' && activeTab !== 'prompts' && (
        <>
          <form onSubmit={addTodo} className="todo-form-grid">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="バディ、次は何をやる？"
              className="todo-input"
            />
            <div className="form-controls">
              <select value={inputGenre} onChange={(e) => setInputGenre(e.target.value as Genre)} className="priority-select">
                <option value="💻 開発">💻 開発</option>
                <option value="📦 メルカリ">📦 メルカリ</option>
                <option value="🧹 生活">🧹 生活</option>
                <option value="🎨 その他">🎨 その他</option>
              </select>
              <select value={inputPriority} onChange={(e) => setInputPriority(e.target.value as any)} className="priority-select">
                <option value="high">🔥 高</option>
                <option value="medium">⚡ 中</option>
                <option value="low">🌱 低</option>
              </select>
              <button type="submit" className="submit-button">追加</button>
            </div>
          </form>

          {activeDetectedPrompts.length > 0 && (
            <div className="ai-suggest-container">
              {activeDetectedPrompts.map(p => (
                <span key={p.id} className="ai-suggest-badge">
                  ✨ AI自動検知: <strong>{p.title}</strong> テンプレートが使えます
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab !== 'prompts' && (
        <ul className="todo-list">
          {displayTodos.length === 0 ? (
            <p className="empty-message">
              {activeTab === 'history' ? '過去2日以内に完了したタスクはありません。' : 'タスクはすべて完了、または登録されていません！'}
            </p>
          ) : (
            displayTodos.map(todo => {
              const matchedPrompts = prompts.filter(p => !p.keyword || checkPromptMatch(todo.text, p));
              const showAiButton = matchedPrompts.length > 0;

              return (
                <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''} ${todo.isPinned ? 'pinned-item' : ''}`}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="todo-checkbox"
                  />
                  
                  {activeTab !== 'history' && (
                    <button type="button" onClick={() => togglePin(todo.id)} className={`pin-button ${todo.isPinned ? 'active' : ''}`}>
                      📌
                    </button>
                  )}

                  <div className="todo-content-block">
                    <span className="todo-genre-label">{todo.genre}</span>
                    <span className="todo-text">{todo.text}</span>
                  </div>
                  
                  {showAiButton && !todo.completed && (
                    <div className="ai-dropdown-container">
                      <span className="ai-trigger-icon">💡 AIバディ</span>
                      <div className="ai-dropdown-menu">
                        {matchedPrompts.map(p => (
                          <button key={p.id} type="button" onClick={() => handleAiAssist(todo.text, p)}>
                            {p.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className={`priority-badge ${todo.priority}`}>
                    {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                  </span>
                  <button onClick={() => deleteTodo(todo.id)} className="delete-button">🗑️</button>
                </li>
              );
            })
          )}
        </ul>
      )}

      {activeTab === 'prompts' && (
        <div className="prompt-dictionary-container">
          <h2>💡 AIプロンプト資産図鑑</h2>
          <p className="section-intro">タスク内の文字に応じて自動出現する、裏側で稼働中のプロンプト一覧です。ここから直接内容を確認・編集できます。</p>
          
          <div className="prompt-grid">
            {prompts.map(p => (
              <div key={p.id} className="prompt-card">
                <div className="prompt-card-header">
                  <h3>{p.title}</h3>
                  <div className="prompt-card-actions">
                    <button type="button" onClick={() => startEditPrompt(p)} className="prompt-edit-btn">✏️ 編集</button>
                    {!p.isSystem && (
                      <button type="button" onClick={() => deletePrompt(p.id)} className="prompt-delete-btn">×</button>
                    )}
                  </div>
                </div>
                <div className="prompt-badge-row">
                  {p.keyword ? <span className="p-keyword-badge">反応ワード: {p.keyword}</span> : <span className="p-universal-badge">全タスクで出現</span>}
                  {p.isSystem && <span className="p-system-badge">初期標準</span>}
                </div>
                <p className="prompt-card-desc">{p.description}</p>
                <div className="prompt-code-box">
                  <pre>{p.promptText}</pre>
                </div>
                <button type="button" className="prompt-direct-copy" onClick={() => {
                  navigator.clipboard.writeText(p.promptText);
                  setToastMessage(`📋 【${p.title}】のベース文章をコピーしました！`);
                  setTimeout(() => setToastMessage(''), 2000);
                }}>このテンプレート文章を直接コピー</button>
              </div>
            ))}
          </div>

          <div id="custom-prompt-form" className="custom-prompt-form-section">
            <h3>{editingPromptId ? '✏️ プロンプトの編集' : '➕ オリジナルAIプロンプトの新規登録'}</h3>
            <form onSubmit={saveCustomPrompt} className="prompt-edit-form">
              <div className="form-row-twin">
                <div className="form-group">
                  <label>表示タイトル (例: 📝 ブログ下書き)</label>
                  <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="メニューボタンに表示される名前" />
                </div>
                <div className="form-group">
                  <label>トリガーとなるキーワード（複数可。カンマで区切る）</label>
                  <input 
                    type="text" 
                    value={customKeyword} 
                    onChange={(e) => setCustomKeyword(e.target.value)} 
                    placeholder="例: ブログ,記事,執筆 (どれか1つヒットで出現)" 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>プロンプトの説明</label>
                <input type="text" value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="図鑑に表示される簡単な用途説明" />
              </div>
              <div className="form-group">
                <label>プロンプトの本体文章（タスク名を挿入したい位置に <code>{"${todoText}"}</code> と書いてください）</label>
                <textarea rows={6} value={customPromptText} onChange={(e) => setCustomPromptText(e.target.value)} placeholder="例: 以下のタスクを行うためのブログの導入文を作成してください。対象タスク: ${todoText}" />
              </div>
              <div className="form-buttons">
                {editingPromptId && (
                  <button type="button" className="cancel-edit-btn" onClick={() => {
                    setEditingPromptId(null);
                    setCustomKeyword('');
                    setCustomTitle('');
                    setCustomDesc('');
                    setCustomPromptText('');
                  }}>キャンセル</button>
                )}
                <button type="submit" className="save-prompt-btn">{editingPromptId ? '更新を保存する' : 'この内容で新しく図鑑に登録する'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab !== 'prompts' && (
        <div className="keyword-management-section">
          <h3>🔑 現在有効なAI連動タグ一覧</h3>
          <p style={{fontSize: '11px', color: '#9ca3af', margin: '-8px 0 12px 0'}}>※ これらのキーワードがTODOのタイトルに含まれていると、専用メニューが開きます。</p>
          <div className="keyword-badge-container">
            {prompts.filter(p => p.keyword).map(p => (
              <span key={p.id} className="keyword-badge" style={{ background: '#1f2937', border: '1px solid #374151' }}>
                🏷️ {p.keyword} ({p.title.split(' ')[1] || p.title})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}