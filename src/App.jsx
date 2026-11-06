import React, { useState, useEffect } from 'react';
// Import Database Terpisah
import { INITIAL_BOOKS } from './data/books';
import { DEFAULT_USERS } from './data/users';
import { INITIAL_SCHEDULES } from './data/schedules';

export default function App() {
  // State Akun Terdaftar
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('library_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  // State User yang Sedang Login
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('library_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // State Form Login / Register
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('pembaca');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // State Tab Navigasi ('katalog' | 'ai' | 'admin')
  const [activeTab, setActiveTab] = useState('katalog');

  // State Data Buku & Peminjaman
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem('library_books');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });

  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('library_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // AI Chat State
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Halo! Saya AI Asisten Perpustakaan. Ada yang bisa saya bantu terkait informasi atau rekomendasi buku?' }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form State Admin (Tambah Peminjaman)
  const [newBorrower, setNewBorrower] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // LocalStorage Effects
  useEffect(() => {
    localStorage.setItem('library_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('library_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('library_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('library_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('library_current_user');
    }
  }, [currentUser]);

  // Handler Login
  const handleLogin = (e) => {
    e.preventDefault();
    setFormError('');

    const foundUser = registeredUsers.find(
      (u) => u.username.toLowerCase() === formUsername.toLowerCase() && u.password === formPassword
    );

    if (!foundUser) {
      setFormError('Username atau password salah!');
      return;
    }

    setCurrentUser(foundUser);
    setFormUsername('');
    setFormPassword('');
    setActiveTab('katalog');
  };

  // Handler Register Akun Baru
  const handleRegister = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formUsername || !formPassword) {
      setFormError('Username dan password wajib diisi!');
      return;
    }

    const userExists = registeredUsers.some(
      (u) => u.username.toLowerCase() === formUsername.toLowerCase()
    );

    if (userExists) {
      setFormError('Username sudah digunakan!');
      return;
    }

    const newUser = { id: Date.now(), username: formUsername, password: formPassword, role: formRole };
    const updatedUsers = [...registeredUsers, newUser];
    
    setRegisteredUsers(updatedUsers);
    setFormSuccess('Akun berhasil dibuat! Silakan masuk.');
    setIsRegisterMode(false);
    setFormUsername('');
    setFormPassword('');
  };

  // Handler Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('katalog');
  };

  // Filter Buku
  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handler AI
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const userMsg = inputChat;
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputChat('');
    setIsAiLoading(true);

    setTimeout(() => {
      let responseText = "Saya sarankan Anda mengecek katalog utama kami untuk pilihan buku terkini.";
      const lowerUserMsg = userMsg.toLowerCase();

      if (lowerUserMsg.includes('pemrograman') || lowerUserMsg.includes('coding') || lowerUserMsg.includes('web')) {
        responseText = "Untuk topik pemrograman, kami memiliki buku 'Pemrograman Web Modern' dan 'Struktur Data & Algoritma'.";
      } else if (lowerUserMsg.includes('filsafat') || lowerUserMsg.includes('tenang') || lowerUserMsg.includes('hidup')) {
        responseText = "Anda bisa membaca 'Filosofi Teras' karya Henry Manampiring untuk panduan hidup tenang dengan Stoisisme.";
      } else if (lowerUserMsg.includes('sejarah')) {
        responseText = "Buku 'Sejarah Nusantara' sangat cocok untuk mempelajari peradaban Nusantara.";
      } else if (lowerUserMsg.includes('pinjam') || lowerUserMsg.includes('syarat')) {
        responseText = "Peminjaman buku berlaku selama 7 hari kerja. Anda dapat mengajukan peminjaman langsung ke perpustakaan.";
      }

      setMessages((prev) => [...prev, { sender: 'assistant', text: responseText }]);
      setIsAiLoading(false);
    }, 800);
  };

  // Handler Tambah Peminjaman (Admin Only)
  const handleAddSchedule = (e) => {
    e.preventDefault();
    if (!newBorrower || !newBookTitle || !newDueDate) return;

    const today = new Date().toISOString().split('T')[0];
    const newEntry = {
      id: Date.now(),
      borrower: newBorrower,
      bookTitle: newBookTitle,
      borrowDate: today,
      dueDate: newDueDate,
      status: 'Dipinjam'
    };

    setSchedules([newEntry, ...schedules]);

    setBooks(books.map(book => {
      if (book.title.toLowerCase() === newBookTitle.toLowerCase() && book.stock > 0) {
        return { ...book, stock: book.stock - 1 };
      }
      return book;
    }));

    setNewBorrower('');
    setNewBookTitle('');
    setNewDueDate('');
  };

  // Handler Ubah Status (Admin Only)
  const handleStatusChange = (id, newStatus, bookTitle) => {
    if (newStatus === 'Dikembalikan') {
      setSchedules(schedules.filter(item => item.id !== id));
      setBooks(books.map(book => {
        if (book.title.toLowerCase() === bookTitle.toLowerCase()) {
          return { ...book, stock: book.stock + 1 };
        }
        return book;
      }));
    } else {
      setSchedules(schedules.map(item => item.id === id ? { ...item, status: newStatus } : item));
    }
  };

  // ================= TAMPILAN HALAMAN LOGIN / REGISTER =================
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '420px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '3rem' }}>📚</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.5rem' }}>
              Perpustakaan Digital
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {isRegisterMode ? 'Daftar akun baru' : 'Silakan masuk ke akun Anda'}
            </p>
          </div>

          {formError && (
            <div style={{
              backgroundColor: '#fee2e2', color: '#b91c1c',
              padding: '0.75rem', borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center'
            }}>
              {formError}
            </div>
          )}

          {formSuccess && (
            <div style={{
              backgroundColor: '#dcfce7', color: '#15803d',
              padding: '0.75rem', borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center'
            }}>
              {formSuccess}
            </div>
          )}

          {isRegisterMode ? (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Username</label>
                <input 
                  type="text" className="search-input" style={{ paddingLeft: '1rem' }}
                  placeholder="Buat username" value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)} required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Password</label>
                <input 
                  type="password" className="search-input" style={{ paddingLeft: '1rem' }}
                  placeholder="Buat password" value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)} required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Daftar Sebagai</label>
                <select 
                  className="filter-select" style={{ width: '100%' }}
                  value={formRole} onChange={(e) => setFormRole(e.target.value)}
                >
                  <option value="pembaca">Pembaca / Anggota</option>
                  <option value="admin">Petugas Admin</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                Daftar Akun
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Sudah punya akun?{' '}
                <button 
                  type="button" 
                  onClick={() => { setIsRegisterMode(false); setFormError(''); }}
                  style={{ color: 'var(--primary-color)', fontWeight: 600, background: 'none', border: 'none' }}
                >
                  Masuk di sini
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Username</label>
                <input 
                  type="text" className="search-input" style={{ paddingLeft: '1rem' }}
                  placeholder="Masukkan username" value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)} required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Password</label>
                <input 
                  type="password" className="search-input" style={{ paddingLeft: '1rem' }}
                  placeholder="Masukkan password" value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)} required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                Masuk
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Belum punya akun?{' '}
                <button 
                  type="button" 
                  onClick={() => { setIsRegisterMode(true); setFormError(''); }}
                  style={{ color: 'var(--primary-color)', fontWeight: 600, background: 'none', border: 'none' }}
                >
                  Daftar sekarang
                </button>
              </p>
            </form>
          )}

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
            Akun Demo Bawaan:<br/>
            Admin: <strong>admin</strong> / <strong>admin123</strong><br/>
            Pembaca: <strong>budi</strong> / <strong>123</strong>
          </div>
        </div>
      </div>
    );
  }

  // ================= TAMPILAN UTAMA SETELAH LOGIN =================
  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <nav className="navbar">
        <div className="brand">
          <span>📚</span> Perpustakaan Digital
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="nav-links">
            <button 
              className={`nav-btn ${activeTab === 'katalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('katalog')}
            >
              Katalog Buku
            </button>
            <button 
              className={`nav-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              AI Asisten
            </button>

            {/* TAB ADMIN: Hanya untuk Admin */}
            {currentUser.role === 'admin' && (
              <button 
                className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                Admin Panel
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              👤 {currentUser.username} <small style={{ color: 'var(--text-muted)' }}>({currentUser.role})</small>
            </span>
            <button 
              onClick={handleLogout}
              style={{
                fontSize: '0.8rem', color: '#b91c1c', border: '1px solid #fecaca',
                padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#fef2f2'
              }}
            >
              Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {/* TAB 1: KATALOG BUKU */}
        {activeTab === 'katalog' && (
          <section>
            <div className="section-header">
              <h1 className="section-title">Katalog Koleksi Buku</h1>
              <p className="section-desc">Cari dan temukan buku yang ingin Anda baca hari ini.</p>
            </div>

            <div className="controls-bar">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" className="search-input"
                  placeholder="Cari berdasarkan judul atau pengarang..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Teknologi">Teknologi</option>
                <option value="Filsafat">Filsafat</option>
                <option value="Sejarah">Sejarah</option>
              </select>
            </div>

            <div className="books-grid">
              {filteredBooks.map((book) => (
                <article key={book.id} className="book-card">
                  <img src={book.cover} alt={book.title} className="book-cover" />
                  <div className="book-info">
                    <span className="book-category">{book.category}</span>
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">Penulis: {book.author}</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                      {book.description}
                    </p>
                    <div className="book-footer">
                      <span className={`badge-stock ${book.stock > 0 ? 'available' : 'empty'}`}>
                        {book.stock > 0 ? `Stok: ${book.stock}` : 'Stok Habis'}
                      </span>
                      {currentUser.role === 'admin' ? (
                        <button 
                          className="btn-primary" disabled={book.stock === 0}
                          onClick={() => { setNewBookTitle(book.title); setActiveTab('admin'); }}
                        >
                          {book.stock > 0 ? 'Proses Pinjam' : 'Kosong'}
                        </button>
                      ) : (
                        <button 
                          className="btn-primary" disabled={book.stock === 0}
                          onClick={() => alert(`Halo ${currentUser.username}, pengajuan pinjam buku "${book.title}" telah dikirim ke petugas perpustakaan.`)}
                        >
                          {book.stock > 0 ? 'Ajukan Pinjam' : 'Kosong'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: AI ASISTEN */}
        {activeTab === 'ai' && (
          <section>
            <div className="section-header">
              <h1 className="section-title">AI Pembantu Perpustakaan</h1>
              <p className="section-desc">Tanyakan rekomendasi buku, materi, atau jadwal peminjaman kepada AI.</p>
            </div>

            <div className="ai-container">
              <div className="chat-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}
                {isAiLoading && <div className="chat-bubble assistant">AI sedang berpikir...</div>}
              </div>
              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input 
                  type="text" className="chat-input"
                  placeholder="Ketik pertanyaan atau pencarian buku..."
                  value={inputChat} onChange={(e) => setInputChat(e.target.value)}
                />
                <button type="submit" className="btn-primary">Kirim</button>
              </form>
            </div>
          </section>
        )}

        {/* TAB 3: ADMIN PANEL (HANYA UNTUK ADMIN) */}
        {activeTab === 'admin' && currentUser.role === 'admin' && (
          <section>
            <div className="section-header">
              <h1 className="section-title">Panel Admin: Kelola Jadwal Peminjaman</h1>
              <p className="section-desc">Atur dan perbarui status transaksi peminjaman buku anggota.</p>
            </div>

            <form onSubmit={handleAddSchedule} style={{
              backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px',
              border: '1px solid #e2e8f0', marginBottom: '2rem',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem', alignItems: 'end'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Nama Peminjam</label>
                <input 
                  type="text" className="search-input" style={{ paddingLeft: '1rem' }} 
                  value={newBorrower} onChange={(e) => setNewBorrower(e.target.value)}
                  placeholder="Contoh: Budi Gunawan" required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Judul Buku</label>
                <input 
                  type="text" className="search-input" style={{ paddingLeft: '1rem' }} 
                  value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Judul buku" required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Tenggat Pengembalian</label>
                <input 
                  type="date" className="search-input" style={{ paddingLeft: '1rem' }} 
                  value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} required 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ height: '42px' }}>
                + Tambah Peminjaman
              </button>
            </form>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Peminjam</th>
                    <th>Judul Buku</th>
                    <th>Tanggal Pinjam</th>
                    <th>Tenggat Kembali</th>
                    <th>Status</th>
                    <th>Aksi Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                        Tidak ada data peminjaman aktif saat ini.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600 }}>{row.borrower}</td>
                        <td>{row.bookTitle}</td>
                        <td>{row.borrowDate}</td>
                        <td>{row.dueDate}</td>
                        <td>
                          <span className={`status-badge status-${row.status.toLowerCase()}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <select 
                            value={row.status} 
                            onChange={(e) => handleStatusChange(row.id, e.target.value, row.bookTitle)}
                            style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          >
                            <option value="Dipinjam">Dipinjam</option>
                            <option value="Terlambat">Terlambat</option>
                            <option value="Dikembalikan">Dikembalikan (Hapus Data)</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}