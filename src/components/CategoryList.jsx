import React, { useEffect, useState } from 'react'
import { getCategories } from '../api.js'

export default function CategoryList({ onOpenDetail }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    getCategories(ac.signal)
      .then(setCategories)
      .catch((e)=> setError(e.message || 'Lỗi tải danh mục'))
      .finally(()=> setLoading(false))
    return () => ac.abort()
  }, [])

  if (loading) return <div className="card">Đang tải danh mục...</div>
  if (error) return <div className="card" style={{ color: 'crimson' }}>Lỗi: {error}</div>

  return (
    <div className="grid">
      {categories.map(c => (
        <div className="card" key={c.id}>
          <h4>{c.name}</h4>
          <div style={{ fontSize: 13, color: '#555', minHeight: 34 }}>{c.description}</div>
          <div style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => onOpenDetail(c.id)}>Chi tiết</button>
          </div>
        </div>
      ))}
    </div>
  )
}
