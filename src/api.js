const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function getCategories(signal) {
  const res = await fetch(`${API_BASE}/api/category`, { signal });
  if (!res.ok) throw new Error('Lỗi tải danh mục');
  const json = await res.json();
  return json?.data || [];
}

export async function getCategoryById(id, signal) {
  const res = await fetch(`${API_BASE}/api/category/${id}`, { signal });
  if (!res.ok) throw new Error('Lỗi tải chi tiết danh mục');
  const json = await res.json();
  return json?.data || null;
}

export async function getTopArticles(categoryId, signal) {
  const url = `${API_BASE}/api/article/top-10-articles?categoryId=${encodeURIComponent(categoryId)}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('Lỗi tải bài viết')
  const json = await res.json()
  return json?.data || []
}

export async function register(payload, signal) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  })
  if (!res.ok) {
    let message = 'Register failed'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function login(payload, signal) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  })
  if (!res.ok) {
    let message = 'Login failed'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function validateToken(token, signal) {
  const res = await fetch(`${API_BASE}/api/auth/validate-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    signal
  })
  if (!res.ok) throw new Error('Validate token request failed')
  const json = await res.json()
  // Expecting { success, data: { isValid: boolean } }
  return Boolean(json?.data?.isValid)
}

export async function createCollection(payload, token, signal) {
  const res = await fetch(`${API_BASE}/api/collection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
    signal
  })
  if (!res.ok) {
    let message = 'Create collection failed'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function getCollections(token, signal) {
  const res = await fetch(`${API_BASE}/api/collection`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    signal
  })
  if (!res.ok) throw new Error('Failed to load collections')
  const json = await res.json()
  return json?.data || []
}

export async function addArticleToCollection(collectionId, articleId, token, signal) {
  const res = await fetch(`${API_BASE}/api/collection/${encodeURIComponent(collectionId)}/articles/${encodeURIComponent(articleId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    signal
  })
  if (!res.ok) {
    let message = 'Add article to collection failed'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function getArticlesInCollection(collectionId, token, signal) {
  const res = await fetch(`${API_BASE}/api/collection/${encodeURIComponent(collectionId)}/articles`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    signal
  })
  if (!res.ok) {
    let message = 'Failed to load collection articles'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  const json = await res.json()
  return json?.data || []
}

export async function updateCollection(collectionId, payload, token, signal) {
  const res = await fetch(`${API_BASE}/api/collection/${encodeURIComponent(collectionId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
    signal
  })
  if (!res.ok) {
    let message = 'Failed to update collection'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  const json = await res.json()
  return json?.data || null
}

export async function deleteCollection(collectionId, token, signal) {
  const res = await fetch(`${API_BASE}/api/collection/${encodeURIComponent(collectionId)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    signal
  })
  if (!res.ok) {
    let message = 'Failed to delete collection'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function requestPasswordReset(email, signal){
  const res = await fetch(`${API_BASE}/api/passwordreset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    signal
  })
  if(!res.ok){
    let message = 'Password reset request failed'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function confirmPasswordReset(payload, signal){
  const res = await fetch(`${API_BASE}/api/passwordreset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  })
  if(!res.ok){
    let message = 'Password reset confirm failed'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function createSubscription(categoryId, token, signal){
  const res = await fetch(`${API_BASE}/api/subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ categoryId, emailFrequency: 'Daily', isActive: true }),
    signal
  })
  if(!res.ok){
    let message = 'Create subscription failed'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function upsertArticle(article, token, signal) {
  const res = await fetch(`${API_BASE}/api/article`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(article),
    signal
  })
  if (!res.ok) {
    let message = 'Create/Upsert article failed'
    try { const err = await res.json(); message = err?.message || message } catch {}
    throw new Error(message)
  }
  const json = await res.json()
  return json?.data || null
}