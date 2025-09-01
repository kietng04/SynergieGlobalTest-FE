import React from 'react'

export default function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header>{title}</header>
        <section>{children}</section>
        <footer>
          {footer ?? <button className="btn" onClick={onClose}>Đóng</button>}
        </footer>
      </div>
    </div>
  )
}
