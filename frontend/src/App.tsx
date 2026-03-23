import { Outlet } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import './App.css'

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
