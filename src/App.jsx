import React, { useEffect, useState } from 'react'
import { getCategories, getTopArticles, register, login, validateToken, createCollection, getCollections, addArticleToCollection, getArticlesInCollection, updateCollection, deleteCollection, requestPasswordReset, confirmPasswordReset, createSubscription, removeArticleFromCollection, getCollectionsByArticle, updateSubscription, createSubscriptionWithParams } from './api.js'

function Modal({ title, onClose, children, footer }){
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{width:'100%',maxWidth:520,background:'#fff',borderRadius:12}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between'}}>
          <b>{title}</b>
          <button onClick={onClose}>Close</button>
        </div>
        <div style={{padding:16}}>{children}</div>
        {footer && (
          <div style={{padding:'12px 16px',borderTop:'1px solid #eee',display:'flex',justifyContent:'flex-end',gap:8}}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

function LoginModal({ onClose, onLoggedIn, onForgot }){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e){
    e?.preventDefault?.()
    setError(null)
    try{
      setLoading(true)
      const res = await login({ username, password })
      const data = res?.data
      if(data?.token){
        const existing = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'{}') } catch { return {} } })()
        const auth = { ...existing, token: data.token }
        localStorage.setItem('auth', JSON.stringify(auth))
        onLoggedIn?.()
      }
      onClose()
    }catch(err){ setError(err?.message || 'Login failed') }
    finally{ setLoading(false) }
  }

  return (
    <Modal title='Login' onClose={onClose} footer={<button onClick={handleSubmit} disabled={loading || !username || !password}>{loading ? 'Logging in...' : 'Login'}</button>}>
      <form onSubmit={handleSubmit} style={{display:'grid',gap:8}}>
        <input placeholder='username' value={username} onChange={e=>setUsername(e.target.value)} />
        <input type='password' placeholder='password' value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div style={{color:'#b91c1c',fontSize:12}}>{error}</div>}
        <button type='button' onClick={()=>{ onClose(); onForgot?.() }} style={{justifySelf:'start',background:'transparent',border:'none',color:'#2563eb',padding:0,cursor:'pointer'}}>Forgot password?</button>
      </form>
    </Modal>
  )
}

function SignupModal({ onClose, onSignedUp }){
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    try{
      setLoading(true)
      const res = await register({ username, email, password, firstName, lastName })
      const data = res?.data
      if(data){
        const auth = { token: data.token, user: { id: data.id, username: data.username, email: data.email, role: data.role } }
        localStorage.setItem('auth', JSON.stringify(auth))
        onSignedUp?.()
      }
      onClose()
    }catch(err){ setError(err?.message || 'Register failed') }
    finally{ setLoading(false) }
  }

  return (
    <Modal title='Sign up' onClose={onClose} footer={<button onClick={handleSubmit} disabled={loading}>{loading ? 'Signing up...' : 'Sign up'}</button>}>
      <form onSubmit={handleSubmit} style={{display:'grid',gap:8}}>
        <input placeholder='first name' value={firstName} onChange={e=>setFirstName(e.target.value)} />
        <input placeholder='last name' value={lastName} onChange={e=>setLastName(e.target.value)} />
        <input placeholder='username' value={username} onChange={e=>setUsername(e.target.value)} />
        <input type='email' placeholder='email@example.com' value={email} onChange={e=>setEmail(e.target.value)} />
        <input type='password' placeholder='password' value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div style={{color:'#b91c1c',fontSize:12}}>{error}</div>}
      </form>
    </Modal>
  )
}

function CreateCollectionModal({ onClose, onCreated }){
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    try{
      setLoading(true)
      const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
      const token = auth?.token
      if(!token) throw new Error('Missing token')
      await createCollection({ name, description }, token)
      try { window.location.reload() } catch { /* no-op */ }
      return
    }catch(err){ setError(err?.message || 'Create collection failed') }
    finally{ setLoading(false) }
  }

  return (
    <Modal title='Create collection' onClose={onClose} footer={<button onClick={handleSubmit} disabled={loading || !name}>{loading ? 'Creating...' : 'Create'}</button>}>
      <form onSubmit={handleSubmit} style={{display:'grid',gap:8}}>
        <input placeholder='name' value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder='description' value={description} onChange={e=>setDescription(e.target.value)} />
        {error && <div style={{color:'#b91c1c',fontSize:12}}>{error}</div>}
      </form>
    </Modal>
  )
}

function ArticleModal({ article, onClose }){
  if(!article) return null
  const dt = new Date(article.publicationDate)
  const [loadingCollectionsByArticle, setLoadingCollectionsByArticle] = useState(false)
  const [errorCollectionsByArticle, setErrorCollectionsByArticle] = useState(null)
  const [collectionsByArticle, setCollectionsByArticle] = useState([])

  useEffect(()=>{
    if(!article?.id) return
    const ac = new AbortController()
    ;(async()=>{
      try{
        setLoadingCollectionsByArticle(true)
        setErrorCollectionsByArticle(null)
        const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
        const token = auth?.token
        if(!token) return
        const list = await getCollectionsByArticle(article.id, token, ac.signal)
        setCollectionsByArticle(Array.isArray(list)? list : [])
      }catch(err){ setErrorCollectionsByArticle(err?.message || 'Failed to load collections') }
      finally{ setLoadingCollectionsByArticle(false) }
    })()
    return ()=> ac.abort()
  },[article?.id])
  return (
    <Modal title={article.headline} onClose={onClose}>
      <div style={{display:'grid',gap:8}}>
        {article.summary && <p style={{margin:0}}>{article.summary}</p>}
        <div style={{fontSize:12,color:'#666'}}>Date: {dt.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })} · Source: <b>{article.source}</b></div>
        {article.url && <a href={article.url} target='_blank' rel='noreferrer'>Read full article</a>}
        {(loadingCollectionsByArticle) && <div style={{fontSize:12,color:'#666'}}>Loading collections...</div>}
        {(errorCollectionsByArticle) && <div style={{color:'#b91c1c',fontSize:12}}>{errorCollectionsByArticle}</div>}
        {(!loadingCollectionsByArticle && collectionsByArticle && collectionsByArticle.length>0) && (
          <div style={{fontSize:12}}>
            <div style={{fontWeight:600, marginBottom:4}}>In your collections:</div>
            <ul style={{margin:0, paddingLeft:18}}>
              {collectionsByArticle.map(col => (
                <li key={col.id}>{col.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function App(){
  const [categories,setCategories] = useState([])
  const [selectedCategoryId,setSelectedCategoryId] = useState(null)
  const [articles,setArticles] = useState([])
  const [loadingCategories,setLoadingCategories] = useState(true)
  const [loadingArticles,setLoadingArticles] = useState(false)
  const [error,setError] = useState(null)
  const [showLogin,setShowLogin] = useState(false)
  const [showSignup,setShowSignup] = useState(false)
  const [showForgotPassword,setShowForgotPassword] = useState(false)
  const [activeArticle,setActiveArticle] = useState(null)
  const [isAuthenticated,setIsAuthenticated] = useState(false)
  const [showCreateCollection,setShowCreateCollection] = useState(false)
  const [activeTab,setActiveTab] = useState('articles')
  const [collections,setCollections] = useState([])
  const [loadingCollections,setLoadingCollections] = useState(false)
  const [showSelectCollection,setShowSelectCollection] = useState(false)
  const [articleForCollection,setArticleForCollection] = useState(null)
  const [showCollectionArticles,setShowCollectionArticles] = useState(false)
  const [activeCollection,setActiveCollection] = useState(null)
  const [showEditCollection,setShowEditCollection] = useState(false)
  const [subscribing,setSubscribing] = useState(false)
  const [subEmailFrequency, setSubEmailFrequency] = useState('Daily')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  useEffect(()=>{
    if(!isAuthenticated) return
    const ac = new AbortController()
    ;(async()=>{
      try{
        setLoadingCollections(true)
        const auth = JSON.parse(localStorage.getItem('auth')||'null')
        const token = auth?.token
        const data = await getCollections(token, ac.signal)
        setCollections(Array.isArray(data)? data : [])
      }catch(e){ /* optional: setError('Failed to load collections') */ }
      finally{ setLoadingCollections(false) }
    })()
    return ()=> ac.abort()
  },[isAuthenticated])

  useEffect(()=>{
    const ac = new AbortController()
    try{
      const existing = JSON.parse(localStorage.getItem('auth')||'null')
      const token = existing?.token
      if(!token){ setIsAuthenticated(false); return }
      ;(async()=>{
        try{
          const ok = await validateToken(token, ac.signal)
          if(ok){
            setIsAuthenticated(true)
          }else{
            localStorage.removeItem('auth')
            setIsAuthenticated(false)
            setShowLogin(true)
          }
        }catch{
          localStorage.removeItem('auth')
          setIsAuthenticated(false)
          setShowLogin(true)
        }
      })()
    }catch{
      localStorage.removeItem('auth')
      setIsAuthenticated(false)
    }
    return ()=> ac.abort()
  },[])

  useEffect(()=>{
    const ac = new AbortController()
    ;(async()=>{
      try{
        setLoadingCategories(true)
        const list = await getCategories(ac.signal)
        const map = new Map(list.map(c=>[String(c.name||'').toLowerCase(), c]))
        const deduped = Array.from(map.values())
        setCategories(deduped)
        if(deduped.length && !selectedCategoryId) setSelectedCategoryId(deduped[0].id)
      }catch(e){ setError('Failed to load categories') }
      finally{ setLoadingCategories(false) }
    })()
    return ()=> ac.abort()
  },[])

  useEffect(()=>{
    if(!selectedCategoryId || activeTab !== 'articles') return
    const ac = new AbortController()
    ;(async()=>{
      try{
        setLoadingArticles(true)
        const data = await getTopArticles(selectedCategoryId, ac.signal)
        setArticles(Array.isArray(data)? data : [])
      }catch(e){ setError('Failed to load articles') }
      finally{ setLoadingArticles(false) }
    })()
    return ()=> ac.abort()
  },[selectedCategoryId, activeTab])

  return (
    <div style={{maxWidth:1100,margin:'0 auto',padding:16,fontFamily:'system-ui,Segoe UI,Roboto'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0'}}>
        <b>News Frontend (Vite)</b>
        <div style={{display:'flex',gap:8}}>
          {!isAuthenticated && <button onClick={()=>setShowLogin(true)}>Login</button>}
          {!isAuthenticated && <button onClick={()=>setShowSignup(true)}>Sign up</button>}
          {isAuthenticated && <button onClick={()=>setShowCreateCollection(true)}>Create collection</button>}
          {isAuthenticated && (
            <button
              onClick={()=>{ try{ localStorage.clear() } catch{} window.location.reload() }}
              title='Logout'
            >Logout</button>
          )}
        </div>
      </header>
      <section>
        <div style={{display:'flex',gap:8,margin:'8px 0'}}>
          <button onClick={()=>setActiveTab('articles')} style={{background:activeTab==='articles'?'#2563eb':'#fff',color:activeTab==='articles'?'#fff':'#000',border:'1px solid #e5e7eb',padding:'6px 10px',borderRadius:8}}>Articles</button>
          <button onClick={()=>setActiveTab('collections')} style={{background:activeTab==='collections'?'#2563eb':'#fff',color:activeTab==='collections'?'#fff':'#000',border:'1px solid #e5e7eb',padding:'6px 10px',borderRadius:8}}>Collections</button>
        </div>
        {activeTab==='articles' && (
          <>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'8px 0'}}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  style={{
                    background: cat.id === selectedCategoryId ? '#2563eb' : '#fff',
                    color: cat.id === selectedCategoryId ? '#fff' : '#000',
                    border: '1px solid #e5e7eb',
                    padding: '6px 10px',
                    borderRadius: 8
                  }}
                >
                  {cat.name}
                </button>
              ))}
              {isAuthenticated && selectedCategoryId && (
                <button
                  onClick={()=> setShowSubscriptionModal(true)}
                  disabled={subscribing}
                  style={{marginLeft:8}}
                  title='Subscribe to this topic'
                >Subscribe to this topic</button>
              )}
              {isAuthenticated && selectedCategoryId && (
                <>
                  <select value={subEmailFrequency} onChange={e=>setSubEmailFrequency(e.target.value)} style={{marginLeft:8}}>
                    <option value='Daily'>Daily</option>
                    <option value='Weekly'>Weekly</option>
                  </select>
                  <button
                    onClick={async()=>{
                      try{
                        const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
                        const token = auth?.token
                        if(!token) throw new Error('Unauthorized')
                        const updated = await updateSubscription(selectedCategoryId, { emailFrequency: subEmailFrequency }, token)
                        alert('Subscription updated')
                      }catch(err){ alert(err?.message || 'Failed to update subscription') }
                    }}
                    style={{marginLeft:8}}
                    title='Update subscription frequency'
                  >Update subscription</button>
                  <button
                    onClick={async()=>{
                      try{
                        const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
                        const token = auth?.token
                        if(!token) throw new Error('Unauthorized')
                        await updateSubscription(selectedCategoryId, { isActive: false }, token)
                        alert('Subscription deactivated')
                      }catch(err){ alert(err?.message || 'Failed to deactivate subscription') }
                    }}
                    style={{marginLeft:8}}
                    title='Deactivate subscription'
                  >Deactivate</button>
                </>
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
              {articles.map((a,i) => (
                <div key={a.url || i} style={{border:'1px solid #e5e7eb',borderRadius:10,padding:12,background:'#fff'}}>
                  <h4 style={{margin:'0 0 4px',fontSize:16}}>{a.headline}</h4>
                  <div style={{fontSize:12,color:'#666'}}>{new Date(a.publicationDate).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}  {a.source}</div>
                  <div style={{marginTop:8}}>
                    <button onClick={() => setActiveArticle(a)} style={{padding:'6px 10px'}}>View details</button>
                    <button
                      onClick={() => {
                        if(!isAuthenticated){ setShowLogin(true); return }
                        setArticleForCollection(a)
                        setShowSelectCollection(true)
                      }}
                      style={{padding:'6px 10px',marginLeft:8}}
                    >
                      Add to collection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {activeTab==='collections' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
            {loadingCollections && <div>Loading collections...</div>}
            {!loadingCollections && collections.map((c)=> (
              <div
                key={c.id}
                style={{border:'1px solid #e5e7eb',borderRadius:10,padding:12,background:'#fff'}}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                  <h4 style={{margin:'0 0 4px',fontSize:16}}>{c.name}</h4>
                  <div style={{display:'flex',gap:8}}>
                    <button
                      onClick={()=>{ setActiveCollection(c); setShowCollectionArticles(true) }}
                      title='View articles'
                    >View</button>
                    <button
                      onClick={()=>{ setActiveCollection(c); setShowEditCollection(true) }}
                      title='Edit collection'
                    >Edit</button>
                    <button
                      onClick={async()=>{
                        try{
                          if(!window.confirm('Delete this collection?')) return
                          const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
                          const token = auth?.token
                          if(!token) throw new Error('Unauthorized')
                          await deleteCollection(c.id, token)
                          setCollections(prev => Array.isArray(prev) ? prev.filter(item => item.id !== c.id) : prev)
                          if(activeCollection?.id === c.id){
                            setShowCollectionArticles(false)
                            setShowEditCollection(false)
                            setActiveCollection(null)
                          }
                          alert('Collection deleted successfully')
                        }catch(err){ alert(err?.message || 'Failed to delete collection') }
                      }}
                      title='Delete collection'
                    >Delete</button>
                  </div>
                </div>
                <div style={{fontSize:12,color:'#666'}}>{c.description}</div>
                <div style={{fontSize:12,color:'#666',marginTop:6}}>Created: {c.createdAt ? new Date(c.createdAt).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}</div>
              </div>
            ))}
          </div>
        )}
      </section>
      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLoggedIn={()=>setIsAuthenticated(true)} onForgot={()=>{ setShowLogin(false); setShowForgotPassword(true) }} />}
      {showSignup && <SignupModal onClose={()=>setShowSignup(false)} onSignedUp={()=>setIsAuthenticated(true)} />}
      {showCreateCollection && <CreateCollectionModal onClose={()=>setShowCreateCollection(false)} />}
      {activeArticle && <ArticleModal article={activeArticle} onClose={()=>setActiveArticle(null)} />}
      {showSelectCollection && (
        <SelectCollectionModal
          onClose={()=>{ setShowSelectCollection(false); setArticleForCollection(null) }}
          collections={collections}
          article={articleForCollection}
          onAdded={()=>{ setShowSelectCollection(false); setArticleForCollection(null) }}
          onCreateNewCollection={()=>{ setShowSelectCollection(false); setShowCreateCollection(true) }}
        />
      )}
      {showCollectionArticles && (
        <CollectionArticlesModal
          collection={activeCollection}
          onClose={()=>{ setShowCollectionArticles(false); setActiveCollection(null) }}
        />
      )}
      {showEditCollection && (
        <EditCollectionModal
          collection={activeCollection}
          onClose={()=>{ setShowEditCollection(false); setActiveCollection(null) }}
          onUpdated={(updated)=>{
            setCollections(prev => Array.isArray(prev) ? prev.map(item => item.id === updated.id ? updated : item) : prev)
            setShowEditCollection(false)
            setActiveCollection(null)
          }}
        />
      )}
      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={()=> setShowForgotPassword(false)}
          onCompleted={()=>{ setShowForgotPassword(false); setShowLogin(true) }}
        />
      )}
      {showSubscriptionModal && (
        <SubscriptionModal
          categoryId={selectedCategoryId}
          onClose={()=> setShowSubscriptionModal(false)}
          onDone={()=> setShowSubscriptionModal(false)}
        />
      )}
    </div>
  )
}

function SelectCollectionModal({ onClose, collections, article, onAdded, onCreateNewCollection }){
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [localCollections, setLocalCollections] = useState(Array.isArray(collections)? collections : [])


  useEffect(()=>{
    if(localCollections && localCollections.length) return
    ;(async()=>{
      try{
        const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
        const token = auth?.token
        if(!token) return
        const list = await getCollections(token)
        setLocalCollections(Array.isArray(list)? list : [])
      }catch{ /* ignore */ }
    })()
  },[])

  async function handleSubmit(e){
    e?.preventDefault?.()
    setError(null)
    try{
      setLoading(true)
      const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
      const token = auth?.token
      if(!token) throw new Error('Unauthorized')
      if(!selectedId) throw new Error('Please select a collection')
      const articleId = article?.id
      if(!articleId) throw new Error('Missing article id from fetched data')
      const resp = await addArticleToCollection(selectedId, articleId, token)
      onAdded?.()
      onClose()
      alert(resp?.message || 'Article added to collection')
    }catch(err){ setError(err?.message || 'Failed to add article') }
    finally{ setLoading(false) }
  }

  return (
    <Modal
      title='Add to collection'
      onClose={onClose}
      footer={<button onClick={handleSubmit} disabled={loading || !selectedId}>{loading ? 'Adding...' : 'Add'}</button>}
    >
      <div style={{display:'grid',gap:8}}>
        {(!localCollections || localCollections.length===0) ? (
          <div style={{display:'grid',gap:8}}>
            <div>No collections found.</div>
            <button onClick={onCreateNewCollection}>Create a new collection</button>
          </div>
        ) : (
          <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
            <option value=''>Select a collection</option>
            {localCollections.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        {error && <div style={{color:'#b91c1c',fontSize:12}}>{error}</div>}
      </div>
    </Modal>
  )
}

function EditCollectionModal({ collection, onClose, onUpdated }){
  const [name, setName] = useState(collection?.name || '')
  const [description, setDescription] = useState(collection?.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e){
    e?.preventDefault?.()
    setError(null)
    try{
      setLoading(true)
      const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
      const token = auth?.token
      if(!token) throw new Error('Unauthorized')
      const payload = { name, description }
      const updated = await updateCollection(collection?.id, payload, token)
      if(!updated) throw new Error('No response data')
      onUpdated?.(updated)
      alert('Collection updated successfully')
    }catch(err){ setError(err?.message || 'Failed to update collection') }
    finally{ setLoading(false) }
  }

  return (
    <Modal title='Edit collection' onClose={onClose} footer={<button onClick={handleSubmit} disabled={loading || !name}>{loading ? 'Saving...' : 'Save'}</button>}>
      <form onSubmit={handleSubmit} style={{display:'grid',gap:8}}>
        <input placeholder='name' value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder='description' value={description} onChange={e=>setDescription(e.target.value)} />
        {error && <div style={{color:'#b91c1c',fontSize:12}}>{error}</div>}
      </form>
    </Modal>
  )
}

function ForgotPasswordModal({ onClose, onCompleted }){
  const [step, setStep] = useState('request') // 'request' | 'confirm'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState('')

  async function handleRequest(){
    setError(null); setInfo('')
    try{
      setLoading(true)
      const res = await requestPasswordReset(email)
      setInfo(res?.message || 'If an account exists, a code was sent')
      setStep('confirm')
    }catch(err){ setError(err?.message || 'Request failed') }
    finally{ setLoading(false) }
  }

  async function handleConfirm(){
    setError(null); setInfo('')
    try{
      setLoading(true)
      const res = await confirmPasswordReset({ email, code, newPassword })
      alert(res?.message || 'Password reset successfully')
      onCompleted?.()
      onClose()
    }catch(err){ setError(err?.message || 'Confirm failed') }
    finally{ setLoading(false) }
  }

  return (
    <Modal
      title='Forgot password'
      onClose={onClose}
      footer={step==='request'
        ? <button onClick={handleRequest} disabled={loading || !email}>{loading ? 'Sending...' : 'Send code'}</button>
        : <button onClick={handleConfirm} disabled={loading || !email || !code || !newPassword}>{loading ? 'Resetting...' : 'Reset password'}</button>
      }
    >
      <div style={{display:'grid',gap:8}}>
        <input type='email' placeholder='email@example.com' value={email} onChange={e=>setEmail(e.target.value)} />
        {step==='confirm' && (
          <>
            <input placeholder='code' value={code} onChange={e=>setCode(e.target.value)} />
            <input type='password' placeholder='new password' value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          </>
        )}
        {error && <div style={{color:'#b91c1c',fontSize:12}}>{error}</div>}
        {info && <div style={{color:'#166534',fontSize:12}}>{info}</div>}
        {step==='request' && (
          <button type='button' onClick={()=> setStep('confirm')} style={{justifySelf:'start',background:'transparent',border:'1px solid #e5e7eb',padding:'6px 10px',borderRadius:8}}>Already have a code?</button>
        )}
      </div>
    </Modal>
  )
}

function SubscriptionModal({ categoryId, onClose, onDone }) {
  const [frequency, setFrequency] = useState('Daily')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e){
    e?.preventDefault?.()
    setError('')
    try{
      setLoading(true)
      const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
      const token = auth?.token
      if(!token) throw new Error('Unauthorized')
      try{
        await createSubscriptionWithParams(categoryId, { emailFrequency: frequency, isActive: true }, token)
      }catch(err){
        await updateSubscription(categoryId, { emailFrequency: frequency, isActive: true }, token)
      }
      alert('Subscription saved')
      onDone?.()
      onClose?.()
    }catch(err){ setError(err?.message || 'Failed to save subscription') }
    finally{ setLoading(false) }
  }

  return (
    <Modal
      title='Subscribe to this topic'
      onClose={onClose}
      footer={<button onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>}
    >
      <div style={{display:'grid',gap:8, minWidth:280}}>
        <label>
          Frequency
          <select value={frequency} onChange={e=>setFrequency(e.target.value)} style={{marginLeft:8}}>
            <option value='Daily'>Daily</option>
            <option value='Weekly'>Weekly</option>
          </select>
        </label>
        {error && <div style={{color:'#b91c1c',fontSize:12}}>{error}</div>}
      </div>
    </Modal>
  )
}
function CollectionArticlesModal({ collection, onClose }){
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [articles, setArticles] = useState([])
  const [removingId, setRemovingId] = useState(null)

  useEffect(()=>{
    const ac = new AbortController()
    ;(async()=>{
      try{
        setLoading(true)
        const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
        const token = auth?.token
        if(!token) throw new Error('Unauthorized')
        const list = await getArticlesInCollection(collection?.id, token, ac.signal)
        setArticles(Array.isArray(list)? list : [])
      }catch(err){ setError(err?.message || 'Failed to load articles') }
      finally{ setLoading(false) }
    })()
    return ()=> ac.abort()
  },[collection?.id])

  return (
    <Modal title={collection?.name || 'Collection'} onClose={onClose}>
      <div style={{minWidth:300,maxHeight:'60vh',overflowY:'auto',display:'grid',gap:8}}>
        {loading && <div>Loading...</div>}
        {error && <div style={{color:'#b91c1c',fontSize:12}}>{error}</div>}
        {!loading && !error && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
            {articles.map((a,i)=>(
              <div key={a.id || a.url || i} style={{border:'1px solid #e5e7eb',borderRadius:10,padding:12,background:'#fff'}}>
                <h4 style={{margin:'0 0 4px',fontSize:16}}>{a.headline}</h4>
                <div style={{fontSize:12,color:'#666'}}>{a.publicationDate ? new Date(a.publicationDate).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : ''}  {a.source}</div>
                {a.url && <a href={a.url} target='_blank' rel='noreferrer' style={{marginTop:8,display:'inline-block'}}>Open</a>}
                <div style={{marginTop:8}}>
                  <button
                    onClick={async()=>{
                      try{
                        if(!a?.id) throw new Error('Missing article id')
                        setRemovingId(a.id)
                        const auth = (()=>{ try{ return JSON.parse(localStorage.getItem('auth')||'null') } catch { return null } })()
                        const token = auth?.token
                        if(!token) throw new Error('Unauthorized')
                        const resp = await removeArticleFromCollection(collection?.id, a.id, token)
                        setArticles(prev => Array.isArray(prev) ? prev.filter(item => item.id !== a.id) : prev)
                        alert(resp?.message || 'Article removed from collection')
                      }catch(err){ alert(err?.message || 'Failed to remove article') }
                      finally{ setRemovingId(null) }
                    }}
                    disabled={removingId === a?.id}
                    title='Remove from this collection'
                  >{removingId === a?.id ? 'Removing...' : 'Remove'}</button>
                </div>
              </div>
            ))}
            {articles.length === 0 && <div>No articles in this collection.</div>}
          </div>
        )}
      </div>
    </Modal>
  )
}
