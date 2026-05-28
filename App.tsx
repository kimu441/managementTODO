import { useState, useEffect } from 'react';
import './App.css';

// タスクの型定義
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: 'weekday' | 'weekend'; // 平日用か土日用か
  priority: 'high' | 'medium' | 'low'; // 優先度
  createdAt: number;
}

export default function App() {
  // 1. 状態管理（タブ切り替え）
  const [activeTab, setActiveTab] = useState<'weekday' | 'weekend'>('weekday');
  
  // 2. 状態管理（TODOリスト：初回起動時にLocalStorageから読み込む）
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('management-todos');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. 状態管理（入力フォーム）
  const [inputText, setInputText] = useState('');
  const [inputPriority, setInputPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // 4. todosが更新されたら自動でLocalStorageに保存する（自動セーブ機能）
  useEffect(() => {
    localStorage.setItem('management-todos', JSON.stringify(todos));
  }, [todos]);

  // 5. タスク追加機能
  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(), // Mac標準の安全なUUID生成機能
      text: inputText,
      completed: false,
      category: activeTab, // 現在開いているタブ（平日 or 土日）に自動振り分け
      priority: inputPriority,
      createdAt: Date.now()
    };

    setTodos([newTodo, ...todos]);
    setInputText('');
    setInputPriority('medium');
  };

  // 6. タスクの完了・未完了切り替え
  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // 7. タスク削除機能
  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 8. 現在のタブに対応するタスクだけを絞り込む
  const filteredTodos = todos.filter(todo => todo.category === activeTab);

  // 9. 進捗率（プログレスバー）の計算
  const totalTasks = filteredTodos.length;
  const completedTasks = filteredTodos.filter(todo => todo.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📝 タスク管理アプリ</h1>
      </header>

      {/* タブ切り替え部分 */}
      <div className="tab-container">
        <button 
          className={`tab-button ${activeTab === 'weekday' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekday')}
        >
          💼 平日のタスク
        </button>
        <button 
          className={`tab-button ${activeTab === 'weekend' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekend')}
        >
          🏕️ 土日・祝日のタスク
        </button>
      </div>

      {/* 進捗プログレスバー */}
      <div className="progress-container">
        <div className="progress-bar-header">
          <span>今日の達成度</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      {/* タスク入力フォーム */}
      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`${activeTab === 'weekday' ? '平日' : '土日'}にやることを入力...`}
          className="todo-input"
        />
        <select 
          value={inputPriority} 
          onChange={(e) => setInputPriority(e.target.value as any)}
          className="priority-select"
        >
          <option value="high">🔥 高</option>
          <option value="medium">⚡ 中</option>
          <option value="low">🌱 低</option>
        </select>
        <button type="submit" className="submit-button">追加</button>
      </form>

      {/* タスク一覧表示 */}
      <ul className="todo-list">
        {filteredTodos.length === 0 ? (
          <p className="empty-message">タスクはすべて完了、または登録されていません！</p>
        ) : (
          filteredTodos.map(todo => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="todo-checkbox"
              />
              <span className="todo-text">{todo.text}</span>
              <span className={`priority-badge ${todo.priority}`}>
                {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
              </span>
              <button onClick={() => deleteTodo(todo.id)} className="delete-button">🗑️</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}