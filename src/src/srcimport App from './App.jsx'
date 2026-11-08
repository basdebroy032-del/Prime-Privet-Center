
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const sections = [
  { id: 'lessons', name: 'পড়ার বিষয়', icon: '📚' },
  { id: 'assignments', name: 'হোমওয়ার্ক', icon: '📝' },
  { id: 'notices', name: 'নোটিশ', icon: '📢' },
  { id: 'routines', name: 'ক্লাস রুটিন', icon: '🗓️' }
]

export default function App() {
  const [active, setActive] = useState('notices')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState(null)

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from(active)
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setItems(data || [])
    else console.error(error.message)

    setLoading(false)
  }

  async function checkAdmin(user) {
    if (!user) {
      setIsAdmin(false)
      return
    }

    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    setIsAdmin(!!data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      checkAdmin(data.session?.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        checkAdmin(newSession?.user)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    loadItems()

    const channel = supabase
      .channel('public-content-' + active)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: active },
        loadItems
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [active])

  async function login(e) {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) alert(error.message)
    else {
      setShowLogin(false)
      setPassword('')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setIsAdmin(false)
  }

  async function saveItem(e) {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('শিরোনাম ও বিস্তারিত লিখুন')
      return
    }

    const record = {
      title: title.trim(),
      content: content.trim()
    }

    let result

    if (editingId) {
      result = await supabase
        .from(active)
        .update(record)
        .eq('id', editingId)
    } else {
      result = await supabase.from(active).insert(record)
    }

    if (result.error) {
      alert(result.error.message)
      return
    }

    setTitle('')
    setContent('')
    setEditingId(null)
    loadItems()
  }

  async function deleteItem(id) {
    if (!confirm('এটি মুছে ফেলতে চান?')) return

    const { error } = await supabase
      .from(active)
      .delete()
      .eq('id', id)

    if (error) alert(error.message)
    else loadItems()
  }

  function editItem(item) {
    setTitle(item.title || '')
    setContent(item.content || '')
    setEditingId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">PPC</div>
          <div>
            <h1>Prime Private Center</h1>
            <p>Learn • Grow • Succeed</p>
          </div>
        </div>

        <button
          className="admin-button"
          onClick={() => isAdmin ? logout() : setShowLogin(!showLogin)}
        >
          {isAdmin ? 'Logout' : 'Admin Login'}
        </button>
      </header>

      <main>
        <section className="hero">
          <span className="hero-tag">WELCOME TO OUR CENTER</span>
          <h2>তোমার শিক্ষার নতুন ঠিকানা</h2>
          <p>পড়াশোনা, হোমওয়ার্ক, নোটিশ ও ক্লাস রুটিন এক জায়গায়।</p>
          <div className="rgb-line"></div>
        </section>

        {showLogin && !isAdmin && (
          <form className="login-box" onSubmit={login}>
            <h2>Admin Login</h2>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
        )}

        <nav className="tabs">
          {sections.map(section => (
            <button
              key={section.id}
              className={active === section.id ? 'tab active' : 'tab'}
              onClick={() => {
                setActive(section.id)
                setEditingId(null)
                setTitle('')
                setContent('')
              }}
            >
              <span>{section.icon}</span>
              {section.name}
            </button>
          ))}
        </nav>

        {isAdmin && (
          <form className="admin-form" onSubmit={saveItem}>
            <h2>{editingId ? 'তথ্য পরিবর্তন করুন' : 'নতুন তথ্য যোগ করুন'}</h2>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="শিরোনাম লিখুন"
              required
            />

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="বিস্তারিত লিখুন"
              rows="4"
              required
            />

            <button type="submit">
              {editingId ? 'Update' : 'Publish'}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setEditingId(null)
                  setTitle('')
                  setContent('')
                }}
              >
                Cancel
              </button>
            )}
          </form>
        )}

        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="small-label">LATEST UPDATES</span>
              <h2>{sections.find(s => s.id === active)?.name}</h2>
            </div>
            <span className="count">{items.length} টি</span>
          </div>

          {loading ? (
            <p className="empty">লোড হচ্ছে...</p>
          ) : items.length === 0 ? (
            <p className="empty">এখনো কোনো তথ্য প্রকাশ করা হয়নি।</p>
          ) : (
            <div className="cards">
              {items.map(item => (
                <article className="item-card" key={item.id}>
                  <span className="card-date">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('bn-BD')
                      : ''}
                  </span>

                  <h3>{item.title}</h3>
                  <p>{item.content}</p>

                  {isAdmin && (
                    <div className="card-actions">
                      <button onClick={() => editItem(item)}>Edit</button>
                      <button onClick={() => deleteItem(item.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <div className="rgb-line"></div>
        <h3>Prime Private Center</h3>
        <p>Made for Better Learning ❤️</p>
      </footer>
    </div>
  )
}
