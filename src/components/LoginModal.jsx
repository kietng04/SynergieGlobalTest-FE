import React, { useState } from 'react'
import Modal from './Modal.jsx'

export default function LoginModal({ open, onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    alert(`Login: ${username}`)
    onClose?.()
  }

  return (
    <Modal open={open} onClose={onClose} title="Đăng nhập">
      <form onSubmit={onSubmit}>
        <input className="input" placeholder="Tên đăng nhập" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <input className="input" type="password" placeholder="Mật khẩu" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="btn primary" type="submit">Đăng nhập</button>
      </form>
    </Modal>
  )
}
