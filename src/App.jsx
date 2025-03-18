import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import PresupuestoForm from "./components/PresupuestoForm"
import "./App.css"

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<PresupuestoForm />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

