import React, { useState, useEffect } from 'react';

// Models matching the Go backend hardcoded API
interface Client {
  id: number;
  name: string;
  industry: string;
}

interface Employee {
  id: number;
  name: string;
  role: string;
}

const API_BASE = 'http://localhost:8080';

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');
  
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('');

  // Fetch all initial data
  const loadData = async () => {
    try {
      const [clientRes, empRes] = await Promise.all([
        fetch(`${API_BASE}/clients`),
        fetch(`${API_BASE}/employees`)
      ]);
      const clientsData = await clientRes.json();
      const empsData = await empRes.json();
      setClients(clientsData || []);
      setEmployees(empsData || []);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Generic Create
  const handleCreate = async (endpoint: string, payload: any, onSuccess: () => void) => {
    try {
      await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      onSuccess();
      loadData();
    } catch (err) {
      console.error('Create error', err);
    }
  };

  // Generic Update
  const handleUpdate = async (endpoint: string, id: number, payload: any) => {
    try {
      await fetch(`${API_BASE}/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      loadData();
    } catch (err) {
      console.error('Update error', err);
    }
  };

  // Generic Delete
  const handleDelete = async (endpoint: string, id: number) => {
    try {
      await fetch(`${API_BASE}/${endpoint}/${id}`, {
        method: 'DELETE'
      });
      loadData();
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading amazing API data...</div>;
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Admin Dashboard</h1>
      </header>

      <div className="dashboard-grid">
        {/* Clients Panel */}
        <section className="panel">
          <div className="panel-header">
            <h2>Our Clients</h2>
          </div>
          
          <div className="add-form">
            <input 
              type="text" className="input-field" placeholder="Client Name"
              value={newClientName} onChange={(e) => setNewClientName(e.target.value)} 
            />
            <input 
              type="text" className="input-field" placeholder="Industry"
              value={newClientIndustry} onChange={(e) => setNewClientIndustry(e.target.value)} 
            />
            <button 
              className="btn"
              onClick={() => handleCreate('clients', { name: newClientName, industry: newClientIndustry }, () => {
                setNewClientName('');
                setNewClientIndustry('');
              })}
            >
              Add
            </button>
          </div>

          <div className="list-container">
            {clients.map(c => (
              <div key={c.id} className="card">
                <div className="card-info">
                  <div className="card-title">{c.name}</div>
                  <div className="card-subtitle">{c.industry}</div>
                </div>
                <div className="card-actions">
                  <button className="btn" onClick={() => {
                    const newName = prompt('Enter new name', c.name);
                    if (newName) handleUpdate('clients', c.id, { name: newName });
                  }}>Edit</button>
                  <button className="btn danger" onClick={() => handleDelete('clients', c.id)}>Delete</button>
                </div>
              </div>
            ))}
            {clients.length === 0 && <p className="card-subtitle">No clients found.</p>}
          </div>
        </section>

        {/* Employees Panel */}
        <section className="panel">
          <div className="panel-header">
            <h2>Our Team</h2>
          </div>

          <div className="add-form">
            <input 
              type="text" className="input-field" placeholder="Employee Name"
              value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} 
            />
            <input 
              type="text" className="input-field" placeholder="Role"
              value={newEmployeeRole} onChange={(e) => setNewEmployeeRole(e.target.value)} 
            />
            <button 
              className="btn"
              onClick={() => handleCreate('employees', { name: newEmployeeName, role: newEmployeeRole }, () => {
                setNewEmployeeName('');
                setNewEmployeeRole('');
              })}
            >
              Add
            </button>
          </div>

          <div className="list-container">
            {employees.map(e => (
              <div key={e.id} className="card">
                <div className="card-info">
                  <div className="card-title">{e.name}</div>
                  <div className="card-subtitle">{e.role}</div>
                </div>
                <div className="card-actions">
                  <button className="btn" onClick={() => {
                    const newRole = prompt('Enter new role', e.role);
                    if (newRole) handleUpdate('employees', e.id, { role: newRole });
                  }}>Edit</button>
                  <button className="btn danger" onClick={() => handleDelete('employees', e.id)}>Delete</button>
                </div>
              </div>
            ))}
            {employees.length === 0 && <p className="card-subtitle">No employees found.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
