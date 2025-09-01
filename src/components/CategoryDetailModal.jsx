import React, { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { getCategoryById } from '../api.js'

export default function CategoryDetailModal({ open, id, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState(null)

  useEffect(() => {
    if (!open || !id) return
    const ac = new AbortController()
    setLoading(true)
    setError('')
    getCategoryById(id, ac.signal)
      .then(setCategory)
      .catch((e) => setError(e.message || 'Lỗi tải chi tiết'))
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [open, id])

  return (
    <Modal open={open} onClose={onClose} title="Chi tiết danh mục">
      {loading && <div>Đang tải...</div>}
      {error && <div style={{ color: 'crimson' }}>Lỗi: {error}</div>}
      {!loading && !error && category && (
        <div>
          <div><strong>Tên:</strong> {category.name}</div>
          <div><strong>Mô tả:</strong> {category.description || '—'}</div>
          <div><strong>Tạo lúc:</strong> {new Date(category.createdAt).toLocaleString()}</div>
          <div><strong>Cập nhật:</strong> {new Date(category.updatedAt).toLocaleString()}</div>
        </div>
      )}
    </Modal>
  )
}
