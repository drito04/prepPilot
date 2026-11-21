import { Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<div className="p-8">Page not found</div>} />
    </Routes>
  )
}