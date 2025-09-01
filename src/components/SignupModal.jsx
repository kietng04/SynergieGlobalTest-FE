import React, { useState } from 'react'
import Modal from './Modal.jsx'

export default function SignupModal({ open, onClose }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', firstName: '', lastName: '' })

  function onChange(key) {
    return (e) => setForm({ ...form, [key]: e.target.value })
  }

  function onSubmit(e) {
    e.preventDefault()
    alert(`Signup:\nUser: ${form.username}\nFirst: ${form.firstName}\nLast: ${form.lastName}\nEmail: ${form.email}`)
    onClose?.()
  }

  return (
    <Modal open={open} onClose={onClose} title="Đăng ký">
      <form onSubmit={onSubmit}>
        <input className="input" placeholder="Tên đăng nhập" value={form.username} onChange={onChange('username')} />
        <input className="input" placeholder="Họ (First name)" value={form.firstName} onChange={onChange('firstName')} />
        <input className="input" placeholder="Tên (Last name)" value={form.lastName} onChange={onChange('lastName')} />
        <input className="input" placeholder="Email" value={form.email} onChange={onChange('email')} />
        <input className="input" type="password" placeholder="Mật khẩu" value={form.password} onChange={onChange('password')} />
        <button className="btn primary" type="submit">Đăng ký</button>
      </form>
    </Modal>
  )
}
