import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const sections = [
  { id: 'lessons', name: 'পড়ার বিষয়', icon: '📚' },
  { id: 'assignments', name: 'হোমওয়ার্ক', icon: '📝' },
  { id: 'notices', name: 'নোটিশ', icon: '📢' },
  { id: 'routines', name: 'ক্লাস রুটিন', icon: '🗓️' }
]

export default function App() {
  const [active, setActive] = useState('notices')
  const [items, setItems] = useState([])
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState(null)

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

  async function loadItems() {
    setLoading(true)

    const { data, error } = await supabase
      .from(active)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error.message)
      setItems([])
    } else {
      setItems(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadItems()

    const channel = supabase
      .channel('content-' + active)
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

    if (error) {
      alert(error.message)
    } else {
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

    const record = {
      title: title.trim(),
      content: content.trim()
    }

    if (!record.title || !record.content) return

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
    if (!confirm('মুছে ফেলতে চান?')) return

    const { error } = await supabase
      .from(active)
      .delete()
      .eq('id', id)

    if (error) alert(error.message)
    else loadItems()
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

        <button onClick={() => isAdmin ? logout() : setShowLogin(!showLogin)}>
          {isAdmin ? 'Logout' : 'Admin Login'}
        </button>
      </header>

      <main>
        <section className="hero">
          <span>WELCOME TO OUR CENTER</span>
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
              {section.icon} {section.name}
            </button>
          ))}
        </nav>

        {isAdmin && (
          <form className="admin-form" onSubmit={saveItem}>
            <h2>{editingId ? 'তথ্য পরিবর্তন' : 'নতুন তথ্য যোগ করুন'}</h2>
            <input
              placeholder="শিরোনাম লিখুন"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="বিস্তারিত লিখুন"
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
            <button type="submit">
              {editingId ? 'Update' : 'Publish'}
            </button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null)
                setTitle('')
                setContent('')
              }}>
                Cancel
              </button>
            )}
          </form>
        )}

        <section className="content-section">
          <h2>{sections.find(s => s.id === active)?.name}</h2>

          {loading ? (
            <p>লোড হচ্ছে...</p>
          ) : items.length === 0 ? (
            <p>এখনো কোনো তথ্য প্রকাশ করা হয়নি।</p>
          ) : (
            <div className="cards">
              {items.map(item => (
                <article className="item-card" key={item.id}>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>

                  {isAdmin && (
                    <div className="card-actions">
                      <button onClick={() => {
                        setTitle(item.title)
                        setContent(item.content)
                        setEditingId(item.id)
                      }}>
                        Edit
                      </button>
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
