import { useState, useEffect } from 'react'

interface Client {
  id: number
  name: string
  email: string
  phone: string
}

interface Employee {
  id: number
  fullname: string
  email: string
  phone: string
  role: string
}

const API_BASE = 'http://localhost:8080/api'

function App() {
  const [clients, setClients] = useState<Client[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/clients/`).then((r) => r.json()),
      fetch(`${API_BASE}/employees/`).then((r) => r.json()),
    ])
      .then(([c, e]) => {
        setClients(c)
        setEmployees(e)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="container">
      <h1>Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <>
          <h2>Clients</h2>
          <ul className="user-list">
            {clients.map((c) => (
              <li key={c.id} className="user-card">
                <strong>{c.name}</strong>
                <span>{c.email}</span>
                <span>{c.phone}</span>
              </li>
            ))}
          </ul>

          <h2>Employees</h2>
          <ul className="user-list">
            {employees.map((e) => (
              <li key={e.id} className="user-card">
                <strong>{e.fullname}</strong>
                <span>{e.role}</span>
                <span>{e.email}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default App
