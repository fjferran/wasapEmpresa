import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  Shield,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  AlertTriangle,
  Building,
  Smartphone,
  Eye,
  Key,
  User,
  Info,
  CalendarPlus,
  ShieldAlert,
  MapPin,
  Map
} from 'lucide-react';

const API_BASE = window.location.origin.includes("localhost")
  ? "http://localhost:8000/api/v1"
  : (window.location.origin + "/app2/api/v1");

export default function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [companyId, setCompanyId] = useState(localStorage.getItem('companyId') || '');

  // Tab State
  const [activeTab, setActiveTab] = useState('dashboard');

  // Login/Register Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Landing Page state
  const [showLanding, setShowLanding] = useState(true);
  const [simulatorMessages, setSimulatorMessages] = useState([
    { sender: 'bot', text: '🤖 ¡Hola! Soy el asistente virtual de WhatsAppFichajes. ¿En qué puedo ayudarte hoy?', time: '09:00' }
  ]);

  const addSimulatorMessage = (sender, text) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSimulatorMessages(prev => [...prev, { sender, text, time: timeStr }]);
  };

  useEffect(() => {
    const el = document.getElementById('simulator-phone-body');
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [simulatorMessages]);

  // Register Form State
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regCompanyCif, setRegCompanyCif] = useState('');
  const [regCompanyCcc, setRegCompanyCcc] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('+34600000000');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Core Data Lists
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [clockRecords, setClockRecords] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [whatsappLogs, setWhatsappLogs] = useState([]);

  // Data Actions Loading & Forms
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // New Employee State
  const [newEmpFirst, setNewEmpFirst] = useState('');
  const [newEmpLast, setNewEmpLast] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('+34');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPass, setNewEmpPass] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('employee');
  const [newEmpNifNie, setNewEmpNifNie] = useState('');
  const [newEmpNss, setNewEmpNss] = useState('');
  const [newEmpDefaultStart, setNewEmpDefaultStart] = useState('09:00');
  const [newEmpDefaultEnd, setNewEmpDefaultEnd] = useState('17:00');
  const [newEmpDefaultDays, setNewEmpDefaultDays] = useState([true, true, true, true, true, false, false]);

  // Editing Employee State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editEmpFirst, setEditEmpFirst] = useState('');
  const [editEmpLast, setEditEmpLast] = useState('');
  const [editEmpPhone, setEditEmpPhone] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpRole, setEditEmpRole] = useState('employee');
  const [editEmpNifNie, setEditEmpNifNie] = useState('');
  const [editEmpNss, setEditEmpNss] = useState('');
  const [editEmpDefaultStart, setEditEmpDefaultStart] = useState('');
  const [editEmpDefaultEnd, setEditEmpDefaultEnd] = useState('');
  const [editEmpDefaultDays, setEditEmpDefaultDays] = useState([true, true, true, true, true, false, false]);
  const [editEmpIsActive, setEditEmpIsActive] = useState(true);

  // Work Orders (Repartos & Servicios de Campo) State
  const [workOrders, setWorkOrders] = useState([]);
  const [newOrderClient, setNewOrderClient] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderLat, setNewOrderLat] = useState(40.4167);
  const [newOrderLon, setNewOrderLon] = useState(-3.7037);
  const [newOrderEmployeeId, setNewOrderEmployeeId] = useState('');
  const [originLat, setOriginLat] = useState(40.4167);
  const [originLon, setOriginLon] = useState(-3.7037);
  const [optimizingEmployeeId, setOptimizingEmployeeId] = useState('');
  const [selectedMapEmployee, setSelectedMapEmployee] = useState(null);

  // Auto-select first employee with active coordinates for the map
  useEffect(() => {
    if (employees.length > 0) {
      const firstWithLoc = employees.find(e => e.last_latitude !== null && e.last_longitude !== null);
      if (firstWithLoc && !selectedMapEmployee) {
        setSelectedMapEmployee(firstWithLoc);
      }
    }
  }, [employees, selectedMapEmployee]);

  // Inspection Token State
  const [inspectionTokens, setInspectionTokens] = useState([]);
  const [tokenDuration, setTokenDuration] = useState(24);
  const [inspectToken, setInspectToken] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/inspect/')) {
      return hash.replace('#/inspect/', '');
    }
    return '';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/inspect/')) {
        setInspectToken(hash.replace('#/inspect/', ''));
      } else {
        setInspectToken('');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // New Shift State
  const [newShiftEmpId, setNewShiftEmpId] = useState('');
  const [newShiftDate, setNewShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [newShiftStart, setNewShiftStart] = useState('09:00');
  const [newShiftEnd, setNewShiftEnd] = useState('17:00');
  const [newShiftIsForever, setNewShiftIsForever] = useState(true);

  // Edit Clock Record State
  const [editingClock, setEditingClock] = useState(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');

  // Fetch all lists from backend when token changes
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, activeTab]);

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (activeTab === 'dashboard' || activeTab === 'employees' || activeTab === 'work-orders') {
        const empRes = await fetch(`${API_BASE}/employees/`, { headers });
        if (empRes.ok) setEmployees(await empRes.json());
      }
      if (activeTab === 'dashboard' || activeTab === 'shifts') {
        const shiftRes = await fetch(`${API_BASE}/shifts/`, { headers });
        if (shiftRes.ok) setShifts(await shiftRes.json());
      }
      if (activeTab === 'dashboard' || activeTab === 'clocks' || activeTab === 'work-orders') {
        const clockRes = await fetch(`${API_BASE}/clock-records/`, { headers });
        if (clockRes.ok) setClockRecords(await clockRes.json());
      }
      if (activeTab === 'dashboard' || activeTab === 'requests') {
        const reqRes = await fetch(`${API_BASE}/requests/`, { headers });
        if (reqRes.ok) setRequests(await reqRes.json());
      }
      if (activeTab === 'dashboard' || activeTab === 'work-orders') {
        const orderRes = await fetch(`${API_BASE}/work-orders/`, { headers });
        if (orderRes.ok) setWorkOrders(await orderRes.json());
      }
      if (activeTab === 'logs') {
        const auditRes = await fetch(`${API_BASE}/audit-logs/`, { headers });
        if (auditRes.ok) setAuditLogs(await auditRes.json());

        // WhatsApp logs
        const waRes = await fetch(`${API_BASE}/clock-records/whatsapp-logs`, { headers });
        if (waRes.ok) setWhatsappLogs(await waRes.json());

        // Inspection tokens
        const tokensRes = await fetch(`${API_BASE}/inspection/tokens`, { headers });
        if (tokensRes.ok) setInspectionTokens(await tokensRes.json());
      }
    } catch (err) {
      console.error("Error loading dashboard data", err);
    }
  };

  // Auth: Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const formDetails = new URLSearchParams();
      formDetails.append('username', loginEmail);
      formDetails.append('password', loginPassword);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formDetails
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Login fallido');
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('companyId', data.company_id);

      setToken(data.access_token);
      setUserRole(data.role);
      setUserName(data.name);
      setCompanyId(data.company_id);
      setActiveTab('dashboard');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Auth: Register Company + Admin
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/companies/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: { name: regCompanyName, cif: regCompanyCif, ccc: regCompanyCcc || null },
          admin: {
            first_name: regFirstName,
            last_name: regLastName,
            phone_number: regPhone,
            email: regEmail,
            password: regPassword,
            role: 'admin'
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Registro fallido');
      }

      // Auto login after registration
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
      setIsRegistering(false);
      setActionSuccess('¡Empresa registrada con éxito! Inicia sesión para continuar.');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Auth: Logout
  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUserRole('');
    setUserName('');
    setCompanyId('');
    setActiveTab('dashboard');
  };

  // Day Conversion Helpers
  const daysArrayToString = (daysBoolArray) => {
    const result = [];
    daysBoolArray.forEach((val, idx) => {
      if (val) {
        result.push(String(idx + 1));
      }
    });
    return result.join(',');
  };

  const stringToDaysArray = (daysString) => {
    const arr = [false, false, false, false, false, false, false];
    if (!daysString) return arr;
    daysString.split(',').forEach(d => {
      const val = parseInt(d.trim(), 10);
      if (val >= 1 && val <= 7) {
        arr[val - 1] = true;
      }
    });
    return arr;
  };

  // Action: Add Employee
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const daysStr = daysArrayToString(newEmpDefaultDays);
      const res = await fetch(`${API_BASE}/employees/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: newEmpFirst,
          last_name: newEmpLast,
          phone_number: newEmpPhone,
          email: newEmpEmail,
          password: newEmpPass,
          role: newEmpRole,
          nif_nie: newEmpNifNie || null,
          nss: newEmpNss || null,
          default_start_time: newEmpDefaultStart || null,
          default_end_time: newEmpDefaultEnd || null,
          default_working_days: daysStr || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'No se pudo crear el empleado');
      }

      setActionSuccess('Empleado registrado correctamente.');
      setNewEmpFirst('');
      setNewEmpLast('');
      setNewEmpPhone('+34');
      setNewEmpEmail('');
      setNewEmpPass('');
      setNewEmpNifNie('');
      setNewEmpNss('');
      setNewEmpDefaultStart('09:00');
      setNewEmpDefaultEnd('17:00');
      setNewEmpDefaultDays([true, true, true, true, true, false, false]);
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Update Employee
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const daysStr = daysArrayToString(editEmpDefaultDays);
      const res = await fetch(`${API_BASE}/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: editEmpFirst,
          last_name: editEmpLast,
          phone_number: editEmpPhone,
          email: editEmpEmail,
          role: editEmpRole,
          is_active: editEmpIsActive,
          nif_nie: editEmpNifNie || null,
          nss: editEmpNss || null,
          default_start_time: editEmpDefaultStart || null,
          default_end_time: editEmpDefaultEnd || null,
          default_working_days: daysStr || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'No se pudo actualizar el empleado');
      }

      setActionSuccess('Empleado actualizado correctamente.');
      setEditingEmployee(null);
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const startEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEditEmpFirst(emp.first_name);
    setEditEmpLast(emp.last_name);
    setEditEmpPhone(emp.phone_number);
    setEditEmpEmail(emp.email);
    setEditEmpRole(emp.role);
    setEditEmpNifNie(emp.nif_nie || '');
    setEditEmpNss(emp.nss || '');
    setEditEmpDefaultStart(emp.default_start_time || '');
    setEditEmpDefaultEnd(emp.default_end_time || '');
    setEditEmpDefaultDays(stringToDaysArray(emp.default_working_days));
    setEditEmpIsActive(emp.is_active);
  };

  // Action: Create Inspection Token
  const handleCreateInspectionToken = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`${API_BASE}/inspection/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          duration_hours: Number(tokenDuration)
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'No se pudo crear el token de inspección');
      }
      setActionSuccess('Token de inspección temporal generado con éxito.');
      // Fetch again
      const headers = { 'Authorization': `Bearer ${token}` };
      const tokensRes = await fetch(`${API_BASE}/inspection/tokens`, { headers });
      if (tokensRes.ok) setInspectionTokens(await tokensRes.json());
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Revoke Inspection Token
  const handleRevokeInspectionToken = async (tokenId) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`${API_BASE}/inspection/tokens/${tokenId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'No se pudo revocar el token de inspección');
      }
      setActionSuccess('Token de inspección revocado correctamente.');
      // Fetch again
      const headers = { 'Authorization': `Bearer ${token}` };
      const tokensRes = await fetch(`${API_BASE}/inspection/tokens`, { headers });
      if (tokensRes.ok) setInspectionTokens(await tokensRes.json());
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Copy Link
  const handleCopyLink = (tokenStr) => {
    const link = `${window.location.origin}${window.location.pathname}#/inspect/${tokenStr}`;
    navigator.clipboard.writeText(link);
    setActionSuccess('Enlace de inspección copiado al portapapeles.');
  };

  // Action: GDPR Anonymize Employee
  const handleAnonymizeEmployee = async (empId) => {
    if (!window.confirm("¿Seguro que deseas anonimizar este empleado? Sus datos personales serán borrados permanentemente según la RGPD, pero sus fichajes se conservarán de forma inmutable durante 4 años por imperativo legal.")) return;
    
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`${API_BASE}/employees/${empId}/anonymize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al anonimizar');
      }

      setActionSuccess('Empleado anonimizado correctamente bajo regulaciones RGPD.');
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Create Shift
  const handleCreateShift = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!newShiftEmpId) {
      setActionError('Por favor selecciona un empleado.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/shifts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: newShiftEmpId,
          date: newShiftDate,
          start_time: newShiftStart.length === 5 ? `${newShiftStart}:00` : newShiftStart,
          end_time: newShiftEnd.length === 5 ? `${newShiftEnd}:00` : newShiftEnd,
          is_forever: newShiftIsForever
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al crear turno');
      }

      setActionSuccess(newShiftIsForever ? 'Turno por defecto configurado para siempre.' : 'Turno específico planificado correctamente.');
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Create Work Order
  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!newOrderClient || !newOrderAddress) {
      setActionError('Por favor introduce el nombre del cliente y la dirección.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/work-orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_name: newOrderClient,
          address: newOrderAddress,
          destination_latitude: parseFloat(newOrderLat) || 40.4167,
          destination_longitude: parseFloat(newOrderLon) || -3.7037,
          employee_id: newOrderEmployeeId || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al crear la orden de trabajo');
      }

      setActionSuccess('Orden de trabajo creada correctamente.');
      setNewOrderClient('');
      setNewOrderAddress('');
      setNewOrderLat(40.4167);
      setNewOrderLon(-3.7037);
      setNewOrderEmployeeId('');
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Delete Work Order
  const handleDeleteWorkOrder = async (orderId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta orden de trabajo?')) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`${API_BASE}/work-orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al eliminar la orden de trabajo');
      }

      setActionSuccess('Orden de trabajo registrada como eliminada.');
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Optimize Route (TSP)
  const handleOptimizeRoute = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!optimizingEmployeeId) {
      setActionError('Por favor selecciona un conductor/técnico para optimizar su ruta.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/work-orders/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: optimizingEmployeeId,
          origin_latitude: parseFloat(originLat) || 40.4167,
          origin_longitude: parseFloat(originLon) || -3.7037
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al optimizar ruta');
      }

      const data = await res.json();
      if (data.length === 0) {
        setActionSuccess('No hay tareas/entregas pendientes asignadas a este trabajador.');
      } else {
        setActionSuccess(`¡Ruta optimizada! Se han ordenado ${data.length} paradas en secuencia óptima.`);
      }
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Open Edit Clock Modal
  const openEditClock = (record) => {
    setEditingClock(record);
    setEditClockIn(record.clock_in ? record.clock_in.substring(0, 16) : '');
    setEditClockOut(record.clock_out ? record.clock_out.substring(0, 16) : '');
  };

  // Action: Submit Clock Edit
  const handleUpdateClock = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const payload = {
        clock_in: editClockIn ? new Date(editClockIn).toISOString() : undefined,
        clock_out: editClockOut ? new Date(editClockOut).toISOString() : null
      };

      const res = await fetch(`${API_BASE}/clock-records/${editingClock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al editar fichaje');
      }

      setActionSuccess('Fichaje modificado y evento registrado en la auditoría inmutable.');
      setEditingClock(null);
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Export Clocks CSV
  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API_BASE}/clock-records/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al descargar el informe legal.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fichajes_legales_empresa_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Action: Resolve Request
  const handleResolveRequest = async (requestId, statusValue) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`${API_BASE}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusValue })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al actualizar solicitud');
      }

      setActionSuccess(`Solicitud marcada como ${statusValue === 'APPROVED' ? 'APROBADA' : 'RECHAZADA'} y registrada.`);
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Helper formats
  const formatDateTime = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  };

  const getStatusBadgeClass = (statusStr) => {
    switch (statusStr) {
      case 'APPROVED': return 'badge-success';
      case 'REJECTED': return 'badge-danger';
      default: return 'badge-warning';
    }
  };

  // Render Inspector view if inspectToken is present
  if (inspectToken) {
    return (
      <InspectorPortal
        token={inspectToken}
        onExit={() => {
          window.location.hash = '';
          setInspectToken('');
        }}
      />
    );
  }

  // Render Login / Register view if no token
  if (!token) {
    if (showLanding) {
      return (
        <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingBottom: '80px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
          <div className="bg-ambient-glow"></div>
          <div className="bg-ambient-glow-secondary"></div>
          
          <div className="landing-container">
            {/* Top Navigation */}
            <header className="landing-nav animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                  <Smartphone size={22} color="white" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', color: '#fff', margin: 0 }}>
                  WhatsAppEmpresarial
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => { setShowLanding(false); setIsRegistering(false); }} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
                  Iniciar Sesión
                </button>
                <button onClick={() => { setShowLanding(false); setIsRegistering(true); }} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
                  Comenzar Gratis
                </button>
              </div>
            </header>

            {/* Hero Section */}
            <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center', marginTop: '40px', marginBottom: '80px' }} className="animate-fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <span className="badge badge-primary" style={{ width: 'fit-content' }}>Gestión Móvil Integral con Inteligencia WhatsApp 📲</span>
                <h1 style={{ fontSize: '2.8rem', lineHeight: '1.2', color: '#fff', fontFamily: 'var(--font-title)', margin: 0 }}>
                  Fichajes, Gestión de Trabajos y<br />
                  <span style={{ background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Optimizaciones vía WhatsApp.</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.7', margin: 0 }}>
                  Unifica el control de jornada obligatorio, la gestión de partes de trabajo y la optimización inteligente de rutas de tus empleados con movilidad. Todo a través de un canal familiar, directo y sin necesidad de instalar pesadas aplicaciones móviles.
                </p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button onClick={() => { setShowLanding(false); setIsRegistering(true); }} className="btn-primary" style={{ padding: '14px 28px' }}>
                    Comenzar Ahora (Gratis)
                  </button>
                  <a href="#simulador" className="btn-secondary" style={{ padding: '14px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    Probar Simulador
                  </a>
                </div>
              </div>

              {/* Mock Chat View in Hero */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="phone-mockup">
                  <div className="phone-header">
                    <div className="phone-avatar">WF</div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Asistente WhatsAppFichajes</div>
                      <div style={{ fontSize: '0.75rem', color: '#00a884' }}>En línea</div>
                    </div>
                  </div>
                  <div className="phone-body">
                    <div className="chat-bubble chat-bubble-bot">
                      🤖 ¡Hola! Envía <b>ENTRADA</b> para iniciar tu jornada laboral.
                      <div className="chat-time">09:00</div>
                    </div>
                    <div className="chat-bubble chat-bubble-user" style={{ animationDelay: '0.8s' }}>
                      ENTRADA
                      <div className="chat-time">09:01</div>
                    </div>
                    <div className="chat-bubble chat-bubble-bot" style={{ animationDelay: '1.6s' }}>
                      ✅ Fichaje de <b>ENTRADA</b> registrado a las 09:01:05. ¡Que tengas un buen día de trabajo!
                      <div className="chat-time">09:01</div>
                    </div>
                    <div className="chat-bubble chat-bubble-user" style={{ animationDelay: '2.4s' }}>
                      📍 <i>Compartió su ubicación voluntaria</i>
                      <div className="chat-time">09:05</div>
                    </div>
                    <div className="chat-bubble chat-bubble-bot" style={{ animationDelay: '3.2s' }}>
                      📍 Ubicación voluntaria registrada correctamente. Coordenadas: 38.384, -0.514.
                      <div className="chat-time">09:05</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section style={{ marginBottom: '80px' }} className="animate-fade-in">
              <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h2 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '15px' }}>Nuestros Tres Pilares Operativos</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>Potencia la productividad de tus operarios, instaladores y repartidores de calle integrando todo en WhatsApp.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px' }}>
                <div className="landing-card">
                  <div className="landing-card-icon">
                    <Clock size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>1. Fichaje y Control Horario</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                    Cumple estrictamente con el registro de jornada. Tus trabajadores reportan entradas, salidas y descansos cómodamente con mensajes simples de chat.
                  </p>
                </div>

                <div className="landing-card">
                  <div className="landing-card-icon" style={{ color: 'var(--success)', borderColor: 'rgba(6,214,160,0.25)', background: 'rgba(6,214,160,0.12)' }}>
                    <FileText size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>2. Gestión de Trabajos y Tareas</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                    Asigna partes de trabajo al instante. Los operarios reciben direcciones y datos del cliente por chat, pudiendo cambiar estados de órdenes (como TAREA FIN).
                  </p>
                </div>

                <div className="landing-card">
                  <div className="landing-card-icon" style={{ color: 'var(--secondary)', borderColor: 'rgba(78,168,222,0.25)', background: 'rgba(78,168,222,0.12)' }}>
                    <MapPin size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>3. Optimizaciones basadas en WhatsApp</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                    Seguimiento en mapa del último punto voluntario enviado en jornada, reduciendo tiempos de traslado y optimizando rutas automáticamente para el equipo técnico.
                  </p>
                </div>
              </div>
            </section>

            {/* Interactive Chat Simulator Section */}
            <section id="simulador" style={{ marginBottom: '80px' }} className="animate-fade-in">
              <div className="glass-panel" style={{ padding: '50px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '50px', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-success" style={{ marginBottom: '15px' }}>Simulador Interactivo</span>
                  <h2 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '20px', margin: 0 }}>Pruébalo en vivo</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.7', margin: 0 }}>
                    Pulsa las acciones rápidas para interactuar con nuestro bot y simular lo que un empleado de calle haría directamente desde su WhatsApp:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                      onClick={() => {
                        addSimulatorMessage('user', 'ENTRADA');
                        setTimeout(() => {
                          addSimulatorMessage('bot', '✅ Fichaje de ENTRADA registrado a las ' + new Date().toLocaleTimeString() + '. ¡Feliz jornada laboral!');
                        }, 500);
                      }} 
                      className="simulator-btn"
                    >
                      <Clock size={18} color="var(--primary)" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Enviar: ENTRADA</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simula fichar el inicio del turno.</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        addSimulatorMessage('user', '📍 Compartir Ubicación GPS');
                        setTimeout(() => {
                          addSimulatorMessage('bot', '📍 Ubicación voluntaria guardada (38.3845, -0.5142). Se mostrará en el visor de mapas del panel.');
                        }, 500);
                      }} 
                      className="simulator-btn"
                    >
                      <MapPin size={18} color="var(--secondary)" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Enviar Ubicación GPS</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simula el envío de coordenadas voluntarias.</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        addSimulatorMessage('user', 'TAREA FIN 104');
                        setTimeout(() => {
                          addSimulatorMessage('bot', '💼 Orden de trabajo #104 completada. Estado actualizado a "FINALIZADO" en la central.');
                        }, 500);
                      }} 
                      className="simulator-btn"
                    >
                      <FileText size={18} color="var(--success)" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Enviar: TAREA FIN 104</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simula finalizar una orden de instalación/reparación.</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        addSimulatorMessage('user', 'SALIDA');
                        setTimeout(() => {
                          addSimulatorMessage('bot', '🏁 Fichaje de SALIDA registrado. ¡Buen descanso!');
                        }, 500);
                      }} 
                      className="simulator-btn"
                    >
                      <Clock size={18} color="var(--danger)" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Enviar: SALIDA</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simula terminar la jornada de trabajo.</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Mock Live Phone in Simulator */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="phone-mockup" style={{ height: '450px' }}>
                    <div className="phone-header">
                      <div className="phone-avatar">WF</div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Asistente WhatsAppFichajes</div>
                        <div style={{ fontSize: '0.75rem', color: '#00a884' }}>En línea</div>
                      </div>
                    </div>
                    <div className="phone-body" id="simulator-phone-body">
                      {simulatorMessages.map((msg, index) => (
                        <div key={index} className={`chat-bubble chat-bubble-${msg.sender}`}>
                          {msg.text}
                          <div className="chat-time">{msg.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Banner */}
            <section className="glass-panel animate-fade-in" style={{ padding: '60px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.15) 0%, rgba(78, 168, 222, 0.1) 100%)', border: '1px solid rgba(157, 78, 221, 0.25)' }}>
              <h2 style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '20px', fontFamily: 'var(--font-title)', margin: 0 }}>
                Simplifica la gestión de tus empleados móviles hoy
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto 35px auto', lineHeight: '1.7' }}>
                Crea tu cuenta de empresa en menos de un minuto y empieza a organizar horarios, rutas y tareas desde WhatsApp.
              </p>
              <button onClick={() => { setShowLanding(false); setIsRegistering(true); }} className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
                Registrar Empresa Ahora (Gratis)
              </button>
            </section>
          </div>
        </div>
      );
    }

    return (
      <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
        <div className="bg-ambient-glow"></div>
        <div className="bg-ambient-glow-secondary"></div>
        
        {/* Back to landing button */}
        <button 
          onClick={() => { setShowLanding(true); setAuthError(''); }}
          style={{ 
            position: 'absolute', 
            top: '30px', 
            left: '30px', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: '500'
          }}
        >
          ← Volver al Inicio
        </button>

        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '40px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'inline-flex', padding: '15px', borderRadius: '50%', background: 'rgba(157, 78, 221, 0.15)', border: '1px solid rgba(157, 78, 221, 0.3)', marginBottom: '15px' }}>
              <Building size={36} color="#9d4edd" />
            </div>
            <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '8px' }}>WhatsAppFichajes</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {isRegistering ? 'Alta de nueva empresa y administrador' : 'Gestión de horarios, turnos y fichajes'}
            </p>
          </div>

          {authError && (
            <div style={{ background: 'rgba(239, 71, 111, 0.15)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '12px', color: '#ff6b8b', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              <span>{authError}</span>
            </div>
          )}

          {actionSuccess && (
            <div style={{ background: 'rgba(6, 214, 160, 0.15)', border: '1px solid var(--success)', borderRadius: '8px', padding: '12px', color: '#6be3c6', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={18} />
              <span>{actionSuccess}</span>
            </div>
          )}

          {!isRegistering ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Corporativo</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '40px' }}
                    placeholder="admin@empresa.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                  <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '40px' }}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <Key size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '10px' }}>
                Entrar al Panel
              </button>

              <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                ¿Tu empresa no está registrada?{' '}
                <button type="button" onClick={() => { setIsRegistering(true); setAuthError(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                  Crear Cuenta
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos de la Empresa</h3>
                
                <div className="form-group">
                  <label className="form-label">Nombre de Empresa</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Fichajes S.L."
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CIF de Empresa</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="B12345678"
                    value={regCompanyCif}
                    onChange={(e) => setRegCompanyCif(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código Cuenta Cotización (CCC)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="11122233344 (11 dígitos)"
                    value={regCompanyCcc}
                    onChange={(e) => setRegCompanyCcc(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del Administrador</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Javier"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellidos</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Fernandez"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp (Móvil con prefijo internacional)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="+34600000000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="admin@miempresa.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '15px' }}>
                Registrar Empresa & Admin
              </button>

              <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                ¿Ya tienes una cuenta?{' '}
                <button type="button" onClick={() => { setIsRegistering(false); setAuthError(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                  Iniciar Sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render Dashboard Layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <div className="bg-ambient-glow"></div>
      <div className="bg-ambient-glow-secondary"></div>

      {/* Sidebar Navigation */}
      <aside className="glass-panel" style={{ width: '280px', borderRadius: '0', borderLeft: 'none', borderTop: 'none', borderBottom: 'none', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '40px', zIndex: '10' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <Smartphone size={22} color="white" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', background: 'linear-gradient(90deg, #fff 0%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WhatsAppFichajes
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }}></span>
            Licencia Activa (España)
          </p>
        </div>

        {/* Navigation list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: '1' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <Clock size={18} />
            <span>Resumen General</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`sidebar-nav-btn ${activeTab === 'employees' ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Empleados (GDPR)</span>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`sidebar-nav-btn ${activeTab === 'shifts' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Calendarios y Turnos</span>
          </button>

          <button
            onClick={() => setActiveTab('clocks')}
            className={`sidebar-nav-btn ${activeTab === 'clocks' ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Registro y Exportación</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`sidebar-nav-btn ${activeTab === 'requests' ? 'active' : ''}`}
          >
            <MessageSquare size={18} />
            <span>Solicitudes</span>
            {requests.filter(r => r.status === 'PENDING').length > 0 && (
              <span className="nav-badge">{requests.filter(r => r.status === 'PENDING').length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`sidebar-nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
          >
            <Shield size={18} />
            <span>Auditoría & WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('work-orders')}
            className={`sidebar-nav-btn ${activeTab === 'work-orders' ? 'active' : ''}`}
          >
            <MapPin size={18} />
            <span>Servicios y Rutas</span>
          </button>
        </nav>

        {/* User profile card & Logout */}
        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userName}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{userRole}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.85rem' }}>
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flexGrow: '1', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto', maxHeight: '100vh' }}>
        
        {/* Header alert / feedback info */}
        {(actionError || actionSuccess) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {actionError && (
              <div className="glass-panel animate-fade-in" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 71, 111, 0.1)', padding: '15px', color: '#ffa4b8', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                <AlertTriangle size={20} />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="glass-panel animate-fade-in" style={{ borderColor: 'var(--success)', background: 'rgba(6, 214, 160, 0.1)', padding: '15px', color: '#88f3da', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                <Check size={20} />
                <span>{actionSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-title)', color: '#fff' }}>Panel de Control Horario</h1>
              <p style={{ color: 'var(--text-muted)' }}>Visualización en tiempo real de turnos y cumplimiento de jornada.</p>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="glass-panel glass-panel-interactive" style={{ padding: '25px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '20px' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Total Empleados</p>
                  <h3 style={{ fontSize: '2rem', color: '#fff' }}>{employees.length}</h3>
                </div>
                <div style={{ background: 'rgba(78, 168, 222, 0.15)', padding: '12px', borderRadius: '12px', marginLeft: 'auto' }}>
                  <Users size={28} color="var(--secondary)" />
                </div>
              </div>

              <div className="glass-panel glass-panel-interactive" style={{ padding: '25px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '20px' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Turnos Planificados</p>
                  <h3 style={{ fontSize: '2rem', color: '#fff' }}>{shifts.length}</h3>
                </div>
                <div style={{ background: 'rgba(157, 78, 221, 0.15)', padding: '12px', borderRadius: '12px', marginLeft: 'auto' }}>
                  <Calendar size={28} color="var(--primary)" />
                </div>
              </div>

              <div className="glass-panel glass-panel-interactive" style={{ padding: '25px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '20px' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Fichajes Activos</p>
                  <h3 style={{ fontSize: '2rem', color: 'var(--success)' }}>
                    {clockRecords.filter(c => c.clock_out === null).length}
                  </h3>
                </div>
                <div style={{ background: 'rgba(6, 214, 160, 0.15)', padding: '12px', borderRadius: '12px', marginLeft: 'auto' }}>
                  <Clock size={28} color="var(--success)" />
                </div>
              </div>

              <div className="glass-panel glass-panel-interactive" style={{ padding: '25px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '20px' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Solicitudes Pendientes</p>
                  <h3 style={{ fontSize: '2rem', color: requests.filter(r => r.status === 'PENDING').length > 0 ? 'var(--warning)' : '#fff' }}>
                    {requests.filter(r => r.status === 'PENDING').length}
                  </h3>
                </div>
                <div style={{ background: 'rgba(255, 209, 102, 0.15)', padding: '12px', borderRadius: '12px', marginLeft: 'auto' }}>
                  <MessageSquare size={28} color="var(--warning)" />
                </div>
              </div>
            </div>

            {/* Quick Actions and Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
              
              {/* Currently Clocked In */}
              <div className="glass-panel" style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} color="var(--success)" />
                  <span>Jornada Activa Ahora Mismo</span>
                </h3>
                
                {clockRecords.filter(c => c.clock_out === null).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No hay ningún empleado trabajando en este momento.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Empleado</th>
                          <th>Entrada</th>
                          <th>Canal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clockRecords.filter(c => c.clock_out === null).map((c) => {
                          const emp = employees.find(e => e.id === c.employee_id);
                          return (
                            <tr key={c.id}>
                              <td style={{ fontWeight: '500' }}>
                                {emp ? `${emp.first_name} ${emp.last_name}` : 'Empleado Anonimizado'}
                              </td>
                              <td>{formatDateTime(c.clock_in)}</td>
                              <td>
                                <span className={`badge ${c.clock_in_method === 'WHATSAPP' ? 'badge-primary' : 'badge-secondary'}`}>
                                  {c.clock_in_method}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Legislation card info */}
              <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(157, 78, 221, 0.05)', borderColor: 'rgba(157, 78, 221, 0.2)' }}>
                <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                  <Shield size={20} />
                  <span>Marco Legal (España)</span>
                </h3>
                <p style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                  De conformidad con el <strong>Real Decreto-ley 8/2019</strong>, es obligatorio registrar la jornada de cada trabajador.
                </p>
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Check size={16} color="var(--success)" style={{ flexShrink: '0', marginTop: '2px' }} />
                    <span><strong>Inmutabilidad:</strong> Los fichajes modificados retienen el log de auditoría.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Check size={16} color="var(--success)" style={{ flexShrink: '0', marginTop: '2px' }} />
                    <span><strong>Conservación:</strong> Conservar registros 4 años en base de datos.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Check size={16} color="var(--success)" style={{ flexShrink: '0', marginTop: '2px' }} />
                    <span><strong>RGPD:</strong> Anonimización total disponible para cumplir el derecho al olvido.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: EMPLOYEES */}
        {activeTab === 'employees' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-title)', color: '#fff' }}>Gestión de la Plantilla</h1>
                <p style={{ color: 'var(--text-muted)' }}>Añade, edita, audita y aplica el borrado seguro RGPD.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
              {/* Employees List */}
              <div className="glass-panel" style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Lista de Empleados</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>DNI/NIE</th>
                        <th>NSS</th>
                        <th>RGPD</th>
                        <th>WhatsApp</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => (
                        <tr key={emp.id}>
                          <td style={{ fontWeight: '500' }}>{emp.first_name} {emp.last_name}</td>
                          <td>{emp.nif_nie || '-'}</td>
                          <td>{emp.nss || '-'}</td>
                          <td>
                            {emp.rgpd_accepted ? (
                              <span className="badge badge-success" title={`Aceptado el ${emp.rgpd_accepted_at ? new Date(emp.rgpd_accepted_at).toLocaleString() : ''}`}>
                                Aceptado
                              </span>
                            ) : (
                              <span className="badge badge-warning">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Smartphone size={14} color="var(--text-muted)" />
                              {emp.phone_number}
                            </span>
                          </td>
                          <td>{emp.email}</td>
                          <td>
                            <span className={`badge ${emp.role === 'admin' ? 'badge-primary' : emp.role === 'manager' ? 'badge-secondary' : ''}`} style={{ textTransform: 'capitalize' }}>
                              {emp.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-danger'}`}>
                              {emp.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {emp.is_active && (
                                <button
                                  onClick={() => startEditEmployee(emp)}
                                  className="btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
                                  title="Editar datos del empleado"
                                >
                                  <Edit2 size={13} />
                                  <span>Editar</span>
                                </button>
                              )}
                              {emp.is_active ? (
                                <button
                                  onClick={() => handleAnonymizeEmployee(emp.id)}
                                  className="btn-danger"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                                  title="Anonimizar empleado según el RGPD"
                                >
                                  <Trash2 size={13} />
                                  <span>Anonimizar</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Anonimizado</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Employee Form */}
              <div className="glass-panel" style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="var(--primary)" />
                  <span>Nuevo Empleado</span>
                </h3>
                
                <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Juan"
                      value={newEmpFirst}
                      onChange={(e) => setNewEmpFirst(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Apellidos</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Gómez Pérez"
                      value={newEmpLast}
                      onChange={(e) => setNewEmpLast(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">WhatsApp (E.164: +34...)</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="+34600000000"
                      value={newEmpPhone}
                      onChange={(e) => setNewEmpPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="juan@empresa.com"
                      value={newEmpEmail}
                      onChange={(e) => setNewEmpEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">DNI / NIE</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="12345678A"
                      value={newEmpNifNie}
                      onChange={(e) => setNewEmpNifNie(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">NSS (Nº Seguridad Social)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="341234567890"
                      value={newEmpNss}
                      onChange={(e) => setNewEmpNss(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Contraseña</label>
                    <input
                      type="password"
                      required
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                      value={newEmpPass}
                      onChange={(e) => setNewEmpPass(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Rol del Sistema</label>
                    <select
                      className="form-input"
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value)}
                      style={{ background: '#000', border: '1px solid var(--border-color)', color: '#fff' }}
                    >
                      <option value="employee">Empleado estándar</option>
                      <option value="manager">Manager / Gestor</option>
                      <option value="admin">Administrador global</option>
                    </select>
                  </div>

                  {/* Horario por Defecto */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '15px', marginTop: '10px', background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '12px', fontWeight: '600' }}>
                      Horario Semanal por Defecto (Opcional)
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Se asignará este turno automáticamente a los días seleccionados si no se crea un turno específico en el calendario.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Hora Entrada</label>
                        <input
                          type="time"
                          className="form-input"
                          value={newEmpDefaultStart}
                          onChange={(e) => setNewEmpDefaultStart(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Hora Salida</label>
                        <input
                          type="time"
                          className="form-input"
                          value={newEmpDefaultEnd}
                          onChange={(e) => setNewEmpDefaultEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Días Laborables</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayName, idx) => (
                          <label key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: newEmpDefaultDays[idx] ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            background: newEmpDefaultDays[idx] ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent',
                            color: newEmpDefaultDays[idx] ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s ease',
                            userSelect: 'none'
                          }}>
                            <input
                              type="checkbox"
                              checked={newEmpDefaultDays[idx]}
                              onChange={(e) => {
                                const copy = [...newEmpDefaultDays];
                                copy[idx] = e.target.checked;
                                setNewEmpDefaultDays(copy);
                              }}
                              style={{ display: 'none' }}
                            />
                            {dayName}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                    <Plus size={18} />
                    <span>Crear Empleado</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SHIFTS */}
        {activeTab === 'shifts' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-title)', color: '#fff' }}>Planificación de Turnos</h1>
              <p style={{ color: 'var(--text-muted)' }}>Crea turnos y asígnalos al personal para las consultas vía WhatsApp.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
              {/* Shifts List */}
              <div className="glass-panel" style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Calendario de Asignaciones</h3>
                {shifts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No hay turnos planificados en el sistema.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Empleado</th>
                          <th>Fecha</th>
                          <th>Horario Entrada</th>
                          <th>Horario Salida</th>
                          <th>Creación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.map((shift) => {
                          const emp = employees.find(e => e.id === shift.employee_id);
                          return (
                            <tr key={shift.id}>
                              <td style={{ fontWeight: '500' }}>
                                {emp ? `${emp.first_name} ${emp.last_name}` : 'Empleado Anonimizado'}
                              </td>
                              <td>{shift.date}</td>
                              <td>{shift.start_time}</td>
                              <td>{shift.end_time}</td>
                              <td>{formatDateTime(shift.created_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Assign Shift Form */}
              <div className="glass-panel" style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarPlus size={20} color="var(--primary)" />
                  <span>Asignar Turno</span>
                </h3>

                <form onSubmit={handleCreateShift} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Empleado</label>
                    <select
                      required
                      className="form-input"
                      value={newShiftEmpId}
                      onChange={(e) => setNewShiftEmpId(e.target.value)}
                      style={{ background: '#000', border: '1px solid var(--border-color)', color: '#fff' }}
                    >
                      <option value="">Selecciona un empleado...</option>
                      {employees.filter(e => e.is_active).map(e => (
                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Ámbito de la Asignación</label>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input
                          type="radio"
                          name="shiftScope"
                          checked={newShiftIsForever}
                          onChange={() => setNewShiftIsForever(true)}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span>Para siempre (horario por defecto)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input
                          type="radio"
                          name="shiftScope"
                          checked={!newShiftIsForever}
                          onChange={() => setNewShiftIsForever(false)}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span>Solo un día (modificación puntual)</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0', opacity: newShiftIsForever ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <label className="form-label">Fecha del Turno</label>
                    <input
                      type="date"
                      required
                      disabled={newShiftIsForever}
                      className="form-input"
                      value={newShiftDate}
                      onChange={(e) => setNewShiftDate(e.target.value)}
                    />
                    {newShiftIsForever && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        (No requerida para el horario permanente)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label">Entrada</label>
                      <input
                        type="time"
                        required
                        className="form-input"
                        value={newShiftStart}
                        onChange={(e) => setNewShiftStart(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label">Salida</label>
                      <input
                        type="time"
                        required
                        className="form-input"
                        value={newShiftEnd}
                        onChange={(e) => setNewShiftEnd(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                    <CalendarPlus size={18} />
                    <span>Planificar Turno</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CLOCK RECORDS */}
        {activeTab === 'clocks' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-title)', color: '#fff' }}>Registro Horario e Informes</h1>
                <p style={{ color: 'var(--text-muted)' }}>Lista de fichajes y generación de documentos para inspecciones de trabajo.</p>
              </div>

              <button onClick={handleExportCSV} className="btn-primary" style={{ gap: '8px' }}>
                <Download size={18} />
                <span>Exportar CSV Legal</span>
              </button>
            </div>

            {/* Clock Records Table */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Fichajes Realizados</h3>
              
              {clockRecords.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No se han registrado fichajes aún en la base de datos.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Empleado</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Localización (GPS)</th>
                        <th>Vía Entrada</th>
                        <th>Vía Salida</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clockRecords.map((c) => {
                        const emp = employees.find(e => e.id === c.employee_id);
                        return (
                          <tr key={c.id}>
                            <td style={{ fontWeight: '500' }}>
                              {emp ? `${emp.first_name} ${emp.last_name}` : 'Empleado Anonimizado'}
                            </td>
                            <td>{formatDateTime(c.clock_in)}</td>
                            <td>{formatDateTime(c.clock_out)}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                                {c.latitude !== null && c.longitude !== null ? (
                                  <a 
                                    href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    📍 Entrada ({c.latitude.toFixed(4)}, {c.longitude.toFixed(4)})
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>- Sin Entrada GPS -</span>
                                )}
                                {c.latitude_out !== null && c.longitude_out !== null ? (
                                  <a 
                                    href={`https://maps.google.com/?q=${c.latitude_out},${c.longitude_out}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    📍 Salida ({c.latitude_out.toFixed(4)}, {c.longitude_out.toFixed(4)})
                                  </a>
                                ) : c.clock_out ? (
                                  <span style={{ color: 'var(--text-muted)' }}>- Sin Salida GPS -</span>
                                ) : null}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${c.clock_in_method === 'WHATSAPP' ? 'badge-primary' : 'badge-secondary'}`}>
                                {c.clock_in_method}
                              </span>
                            </td>
                            <td>
                              {c.clock_out ? (
                                <span className={`badge ${c.clock_out_method === 'WHATSAPP' ? 'badge-primary' : 'badge-secondary'}`}>
                                  {c.clock_out_method}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>Activo</span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => openEditClock(c)}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                              >
                                <span>Editar (Auditar)</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Edit Clock Record Modal */}
            {editingClock && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--primary)' }}>Corregir Fichaje (Obligatorio Auditoría)</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Toda corrección sobre la hora original generará un log de auditoría inmutable guardando el valor anterior y el nuevo, de conformidad con la ley española.
                  </p>

                  <form onSubmit={handleUpdateClock} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label">Entrada (Fecha y Hora)</label>
                      <input
                        type="datetime-local"
                        required
                        className="form-input"
                        value={editClockIn}
                        onChange={(e) => setEditClockIn(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label">Salida (Fecha y Hora - En blanco si sigue activo)</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={editClockOut}
                        onChange={(e) => setEditClockOut(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button type="submit" className="btn-primary" style={{ flexGrow: '1', justifyContent: 'center' }}>
                        <span>Guardar Cambios</span>
                      </button>
                      <button type="button" onClick={() => setEditingClock(null)} className="btn-secondary">
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Employee Modal */}
            {editingEmployee && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--primary)' }}>Editar Ficha de Empleado</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Modifica los datos del trabajador. Todos los cambios quedarán registrados en el historial de auditoría legal.
                  </p>

                  <form onSubmit={handleUpdateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">Nombre</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editEmpFirst}
                          onChange={(e) => setEditEmpFirst(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">Apellidos</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editEmpLast}
                          onChange={(e) => setEditEmpLast(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">WhatsApp (E.164)</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editEmpPhone}
                          onChange={(e) => setEditEmpPhone(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          required
                          className="form-input"
                          value={editEmpEmail}
                          onChange={(e) => setEditEmpEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">DNI / NIE</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editEmpNifNie}
                          onChange={(e) => setEditEmpNifNie(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">NSS (Seguridad Social)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editEmpNss}
                          onChange={(e) => setEditEmpNss(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">Rol del Sistema</label>
                        <select
                          className="form-input"
                          value={editEmpRole}
                          onChange={(e) => setEditEmpRole(e.target.value)}
                          style={{ background: '#000', border: '1px solid var(--border-color)', color: '#fff' }}
                        >
                          <option value="employee">Empleado estándar</option>
                          <option value="manager">Manager / Gestor</option>
                          <option value="admin">Administrador global</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">Estado de la Ficha</label>
                        <select
                          className="form-input"
                          value={editEmpIsActive ? 'true' : 'false'}
                          onChange={(e) => setEditEmpIsActive(e.target.value === 'true')}
                          style={{ background: '#000', border: '1px solid var(--border-color)', color: '#fff' }}
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo (Deshabilitado)</option>
                        </select>
                      </div>
                    </div>

                    {/* Horario por Defecto */}
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '15px', marginTop: '5px', background: 'rgba(255,255,255,0.02)' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '8px', fontWeight: '600' }}>
                        Horario Semanal por Defecto
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                        <div className="form-group" style={{ marginBottom: '0' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Hora Entrada</label>
                          <input
                            type="time"
                            className="form-input"
                            value={editEmpDefaultStart}
                            onChange={(e) => setEditEmpDefaultStart(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Hora Salida</label>
                          <input
                            type="time"
                            className="form-input"
                            value={editEmpDefaultEnd}
                            onChange={(e) => setEditEmpDefaultEnd(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Días Laborables</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayName, idx) => (
                            <label key={idx} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: editEmpDefaultDays[idx] ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                              background: editEmpDefaultDays[idx] ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent',
                              color: editEmpDefaultDays[idx] ? '#fff' : 'var(--text-muted)',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s ease',
                              userSelect: 'none'
                            }}>
                              <input
                                type="checkbox"
                                checked={editEmpDefaultDays[idx]}
                                onChange={(e) => {
                                  const copy = [...editEmpDefaultDays];
                                  copy[idx] = e.target.checked;
                                  setEditEmpDefaultDays(copy);
                                }}
                                style={{ display: 'none' }}
                              />
                              {dayName}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button type="submit" className="btn-primary" style={{ flexGrow: '1', justifyContent: 'center' }}>
                        <span>Guardar Cambios</span>
                      </button>
                      <button type="button" onClick={() => setEditingEmployee(null)} className="btn-secondary">
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: REQUESTS */}
        {activeTab === 'requests' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-title)', color: '#fff' }}>Solicitudes del Personal</h1>
              <p style={{ color: 'var(--text-muted)' }}>Gestiona y resuelve las peticiones de días de descanso, vacaciones o correcciones de jornada.</p>
            </div>

            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Listado de Peticiones</h3>
              
              {requests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No se han enviado solicitudes por el momento.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Empleado</th>
                        <th>Tipo</th>
                        <th>Detalles</th>
                        <th>Fecha de Solicitud</th>
                        <th>Estado</th>
                        <th>Acciones de Gestor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => {
                        return (
                          <tr key={req.id}>
                            <td style={{ fontWeight: '500' }}>
                              {req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : 'Empleado Anonimizado'}
                            </td>
                            <td>
                              <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                                {req.type}
                              </span>
                            </td>
                            <td>{req.details}</td>
                            <td>{formatDateTime(req.created_at)}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(req.status)}`}>
                                {req.status}
                              </span>
                            </td>
                            <td>
                              {req.status === 'PENDING' ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => handleResolveRequest(req.id, 'APPROVED')}
                                    className="btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--success)' }}
                                  >
                                    <Check size={14} />
                                    <span>Aprobar</span>
                                  </button>
                                  <button
                                    onClick={() => handleResolveRequest(req.id, 'REJECTED')}
                                    className="btn-danger"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  >
                                    <X size={14} />
                                    <span>Rechazar</span>
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Resuelta</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: AUDIT & WHATSAPP LOGS */}
        {activeTab === 'logs' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-title)', color: '#fff' }}>Logs de Auditoría Legal y WhatsApp</h1>
              <p style={{ color: 'var(--text-muted)' }}>Seguimiento inmutable de la actividad del sistema y de los mensajes de WhatsApp procesados.</p>
            </div>

            {/* INSPECTOR MODE MANAGER */}
            <div className="glass-panel" style={{ padding: '25px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                <div style={{ background: 'rgba(239, 71, 111, 0.15)', padding: '10px', borderRadius: '10px' }}>
                  <ShieldAlert size={24} color="var(--danger)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0 }}>Portal de Inspección de Trabajo (Inspector Mode)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Genere credenciales temporales de sólo lectura para inspectores de trabajo autorizados, con validez horaria limitada.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
                {/* Generation control */}
                <form onSubmit={handleCreateInspectionToken} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Duración del Enlace</label>
                    <select
                      className="form-input"
                      value={tokenDuration}
                      onChange={(e) => setTokenDuration(Number(e.target.value))}
                      style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)' }}
                    >
                      <option value="1">1 Hora</option>
                      <option value="4">4 Horas</option>
                      <option value="8">8 Horas</option>
                      <option value="12">12 Horas</option>
                      <option value="24">24 Horas (1 Día)</option>
                      <option value="48">48 Horas (2 Días)</option>
                      <option value="168">168 Horas (1 Semana)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ background: 'var(--danger)', color: '#fff', justifyContent: 'center' }}>
                    <Plus size={18} />
                    <span>Generar Enlace Seguro</span>
                  </button>
                </form>

                {/* Tokens List */}
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {inspectionTokens.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '30px' }}>
                      No hay tokens de inspección generados para esta empresa.
                    </p>
                  ) : (
                    <table className="table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Validez (Horas)</th>
                          <th>Expira (Local)</th>
                          <th>Estado</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectionTokens.map((t) => {
                          const isExpired = new Date(t.expires_at) < new Date() || t.is_revoked;
                          const durationHours = Math.round((new Date(t.expires_at) - new Date(t.created_at)) / 3600000) || 1;
                          return (
                            <tr key={t.id}>
                              <td>{durationHours}h</td>
                              <td>{new Date(t.expires_at).toLocaleString()}</td>
                              <td>
                                <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`}>
                                  {isExpired ? (t.is_revoked ? 'Revocado' : 'Expirado') : 'Activo'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                  {!isExpired && (
                                    <button
                                      onClick={() => handleCopyLink(t.token)}
                                      className="btn-primary"
                                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                    >
                                      Copiar Link
                                    </button>
                                  )}
                                  {!t.is_revoked && (
                                    <button
                                      onClick={() => handleRevokeInspectionToken(t.id)}
                                      className="btn-danger"
                                      style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--danger)' }}
                                    >
                                      Revocar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
              
              {/* Inmutable Audit Logs */}
              <div className="glass-panel" style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                  <Shield size={20} />
                  <span>Registro de Auditoría (L.O.P.D.)</span>
                </h3>
                
                {auditLogs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No hay eventos de auditoría registrados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '550px', overflowY: 'auto', paddingRight: '5px' }}>
                    {auditLogs.map((log) => (
                      <div key={log.id} className="glass-panel" style={{ padding: '15px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span className={`badge ${log.action === 'CREATE' ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 'bold' }}>
                            {log.action}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{formatDateTime(log.created_at)}</span>
                        </div>
                        <p style={{ marginBottom: '8px' }}>
                          Tabla: <strong>{log.table_name}</strong> | ID: <code style={{ color: 'var(--secondary)' }}>{log.record_id}</code>
                        </p>
                        
                        {log.old_values && (
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', marginBottom: '5px' }}>
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Anterior:</span>
                            <pre style={{ margin: '4px 0 0 0', overflowX: 'auto', fontSize: '0.78rem' }}>
                              {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.new_values && (
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px' }}>
                            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Nuevo:</span>
                            <pre style={{ margin: '4px 0 0 0', overflowX: 'auto', fontSize: '0.78rem' }}>
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WhatsApp logs */}
              <div className="glass-panel" style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
                  <MessageSquare size={20} />
                  <span>Mensajes de WhatsApp</span>
                </h3>

                {whatsappLogs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No se han recibido ni enviado mensajes por WhatsApp aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '550px', overflowY: 'auto', paddingRight: '5px' }}>
                    {whatsappLogs.map((log) => (
                      <div key={log.id} className="glass-panel" style={{ padding: '15px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span className={`badge ${log.direction === 'INBOUND' ? 'badge-primary' : 'badge-success'}`}>
                            {log.direction}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{formatDateTime(log.created_at)}</span>
                        </div>
                        <p style={{ marginBottom: '5px' }}>
                          Teléfono: <strong>{log.phone_number}</strong>
                        </p>
                        <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px', borderRadius: '6px', fontStyle: 'italic', color: '#fff' }}>
                          "{log.message_body}"
                        </div>
                        {log.twilio_message_sid && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Twilio Message SID: <code>{log.twilio_message_sid}</code>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: WORK ORDERS (Repartos y Servicios de Campo) */}
        {activeTab === 'work-orders' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-title)', color: '#fff' }}>Servicios de Campo, Repartos e Instalaciones</h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Asignación de órdenes de trabajo, secuenciación y optimización de rutas mediante algoritmo TSP, y verificación de llegada en tiempo real por GPS de WhatsApp.
              </p>
            </div>

            {/* Geolocalización Voluntaria de Trabajadores */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#06d6a0' }}>
                <MapPin size={20} />
                <span>Geolocalización en Tiempo Real de Trabajadores (GPS Voluntario)</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Última posición reportada de forma voluntaria por los empleados a través de WhatsApp durante su jornada laboral activa. Haz clic en un empleado con ubicación activa para ver su posición en el mapa.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'stretch' }}>
                {/* Lista de Empleados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '420px', overflowY: 'auto', paddingRight: '5px' }}>
                  {employees.map(emp => {
                    const isActiveNow = clockRecords.some(c => c.employee_id === emp.id && c.clock_out === null);
                    const hasLocation = emp.last_latitude !== null && emp.last_longitude !== null;
                    const isSelected = selectedMapEmployee?.id === emp.id;
                    
                    return (
                      <div 
                        key={emp.id} 
                        className="glass-panel" 
                        onClick={() => {
                          if (hasLocation) {
                            setSelectedMapEmployee(emp);
                          }
                        }}
                        style={{ 
                          padding: '15px', 
                          background: isSelected ? 'rgba(6, 214, 160, 0.08)' : 'rgba(255, 255, 255, 0.02)', 
                          borderColor: isSelected ? '#06d6a0' : (isActiveNow ? 'rgba(6, 214, 160, 0.2)' : 'rgba(255, 255, 255, 0.05)'),
                          borderLeft: isActiveNow ? '4px solid #06d6a0' : '4px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          cursor: hasLocation ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                          transform: isSelected ? 'scale(1.01)' : 'none',
                          boxShadow: isSelected ? '0 0 15px rgba(6, 214, 160, 0.15)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: '#fff', fontSize: '1.05rem' }}>
                            {emp.first_name} {emp.last_name}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className={`badge ${isActiveNow ? 'badge-success' : 'badge-secondary'}`}>
                              {isActiveNow ? 'En Jornada' : 'Fuera de Turno'}
                            </span>
                          </div>
                        </div>

                        {hasLocation ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                              <MapPin size={16} color="#06d6a0" />
                              <span style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>
                                {emp.last_latitude.toFixed(5)}, {emp.last_longitude.toFixed(5)}
                              </span>
                              {isSelected && <span style={{ fontSize: '0.75rem', color: '#06d6a0', fontWeight: 'bold' }}>(Mostrando)</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Actualizado: {formatDateTime(emp.last_location_updated_at)}
                            </div>
                          </>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <MapPin size={16} style={{ opacity: 0.5 }} />
                            <span>Sin coordenadas voluntarias compartidas</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Visualizador de Mapa Interactivo (OpenStreetMap Iframe) */}
                <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'center', minHeight: '380px' }}>
                  {selectedMapEmployee && selectedMapEmployee.last_latitude !== null ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ color: '#fff', margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={18} color="#06d6a0" />
                          <span>Mapa de {selectedMapEmployee.first_name} {selectedMapEmployee.last_name}</span>
                        </h4>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedMapEmployee.last_latitude},${selectedMapEmployee.last_longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                          Google Maps ↗
                        </a>
                      </div>
                      
                      <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <iframe 
                          title="OpenStreetMap"
                          width="100%" 
                          height="100%" 
                          style={{ border: 'none' }}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedMapEmployee.last_longitude - 0.005}%2C${selectedMapEmployee.last_latitude - 0.005}%2C${selectedMapEmployee.last_longitude + 0.005}%2C${selectedMapEmployee.last_latitude + 0.005}&layer=mapnik&marker=${selectedMapEmployee.last_latitude}%2C${selectedMapEmployee.last_longitude}`}
                        />
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Lat: {selectedMapEmployee.last_latitude.toFixed(5)}, Lon: {selectedMapEmployee.last_longitude.toFixed(5)}</span>
                        <span>Actualizado: {formatDateTime(selectedMapEmployee.last_location_updated_at)}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                      <MapPin size={48} style={{ opacity: 0.3, color: '#06d6a0' }} />
                      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {employees.some(e => e.last_latitude !== null && e.last_longitude !== null) 
                          ? "Selecciona un empleado de la lista (haz clic en su tarjeta) para visualizar su ubicación exacta en este mapa interactivo."
                          : "Ningún empleado ha reportado ubicaciones voluntarias en su jornada activa todavía."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
              {/* Form to Register Work Order */}
              <div className="glass-panel" style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                  <Plus size={20} />
                  <span>Crear Nueva Orden de Trabajo / Servicio</span>
                </h3>
                <form onSubmit={handleCreateWorkOrder} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Técnico / Repartidor Asignado</label>
                    <select
                      className="form-input"
                      value={newOrderEmployeeId}
                      onChange={(e) => setNewOrderEmployeeId(e.target.value)}
                      style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">-- Sin asignar / Libre --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.phone_number})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cliente o Empresa Destino</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. Clínica Dental Sol / Juan Pérez"
                      value={newOrderClient}
                      onChange={(e) => setNewOrderClient(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dirección Completa</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. Calle de Alcalá, 14, 28014 Madrid"
                      value={newOrderAddress}
                      onChange={(e) => setNewOrderAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">Latitud de Destino</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="form-input"
                        value={newOrderLat}
                        onChange={(e) => setNewOrderLat(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Longitud de Destino</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="form-input"
                        value={newOrderLon}
                        onChange={(e) => setNewOrderLon(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                    <span>Registrar Tarea / Orden</span>
                  </button>
                </form>
              </div>

              {/* Optimization TSP Card */}
              <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
                  <MapPin size={20} />
                  <span>Optimización de Ruta del Día (TSP)</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.4' }}>
                  Seleccione un trabajador y las coordenadas de partida (ej. base o almacén principal). El sistema ordenará automáticamente las paradas pendientes del operario reduciendo la distancia total recorrida.
                </p>

                <form onSubmit={handleOptimizeRoute} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div className="form-group">
                    <label className="form-label">Seleccionar Operario / Driver</label>
                    <select
                      className="form-input"
                      value={optimizingEmployeeId}
                      onChange={(e) => setOptimizingEmployeeId(e.target.value)}
                      style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)' }}
                      required
                    >
                      <option value="">-- Seleccionar trabajador --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">Latitud Origen (Base)</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="form-input"
                        value={originLat}
                        onChange={(e) => setOriginLat(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Longitud Origen (Base)</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="form-input"
                        value={originLon}
                        onChange={(e) => setOriginLon(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', color: 'white', fontWeight: 'bold' }}>
                    <span>Calcular y Ordenar Secuencia</span>
                  </button>
                </form>
              </div>
            </div>

            {/* List of Work Orders */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', fontWeight: '600' }}>Listado General de Órdenes y Estado de Ejecución</h3>
              {workOrders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No existen órdenes de trabajo creadas todavía.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Código ID</th>
                        <th>Cliente / Dirección</th>
                        <th>Trabajador Asignado</th>
                        <th>Estado de Tarea</th>
                        <th>Orden de Parada</th>
                        <th>Verificación GPS</th>
                        <th>Notas de Campo</th>
                        <th style={{ textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.map((o) => {
                        const assignedEmp = employees.find(e => e.id === o.employee_id);
                        const assignedName = assignedEmp ? `${assignedEmp.first_name} ${assignedEmp.last_name}` : "Sin asignar";
                        
                        let statusBadgeClass = "badge-warning";
                        let statusText = "⏱️ Pendiente";
                        if (o.status === "IN_TRANSIT") {
                          statusBadgeClass = "badge-primary";
                          statusText = "🚚 En camino / En ruta";
                        } else if (o.status === "COMPLETED") {
                          statusBadgeClass = "badge-success";
                          statusText = "✅ Completado";
                        } else if (o.status === "FAILED") {
                          statusBadgeClass = "badge-danger";
                          statusText = "❌ Incidencia / Fallido";
                        }

                        return (
                          <tr key={o.id}>
                            <td><code style={{ color: 'var(--secondary)' }}>{o.id.substring(0, 4)}</code></td>
                            <td>
                              <strong>{o.client_name}</strong>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.address}</div>
                            </td>
                            <td>{assignedName}</td>
                            <td>
                              <span className={`badge ${statusBadgeClass}`}>{statusText}</span>
                            </td>
                            <td>
                              {o.route_order ? (
                                <span className="badge badge-success" style={{ fontWeight: 'bold' }}>Parada #{o.route_order}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td>
                              {o.status === "COMPLETED" || o.status === "FAILED" ? (
                                o.gps_verified ? (
                                  <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>🟢 GPS Correcto</span>
                                ) : o.verified_latitude ? (
                                  <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>⚠️ GPS Desviado</span>
                                ) : (
                                  <span className="badge badge-danger" style={{ fontSize: '0.8rem' }}>🔴 Sin Ubicación</span>
                                )
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>A la espera</span>
                              )}
                            </td>
                            <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.delivery_notes || ''}>
                              {o.delivery_notes || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteWorkOrder(o.id)}
                                className="btn-danger"
                                style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'var(--danger)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InspectorPortal({ token, onExit }) {
  const [checking, setChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [records, setRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        setChecking(true);
        setError('');
        
        // 1. Verify token
        const verifyRes = await fetch(`${API_BASE}/inspection/verify?token=${token}`);
        if (!verifyRes.ok) {
          throw new Error('El token de inspección no es válido o ha expirado.');
        }
        const verifyData = await verifyRes.json();
        setIsValid(true);
        setCompany(verifyData.company);

        // 2. Fetch records
        const recRes = await fetch(`${API_BASE}/inspection/records?token=${token}`);
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecords(recData);
        }

        // 3. Fetch audit logs
        const auditRes = await fetch(`${API_BASE}/inspection/audit-logs?token=${token}`);
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditLogs(auditData);
        }
      } catch (err) {
        setError(err.message || 'Error al conectar con el servidor.');
        setIsValid(false);
      } finally {
        setChecking(false);
      }
    };

    verifyAndLoad();
  }, [token]);

  const handleExportPDF = () => {
    window.open(`${API_BASE}/inspection/export-pdf?token=${token}`);
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Empleado,NIF/NIE,NSS,Fecha Entrada,Fecha Salida,Metodo Entrada,Hash Registro\n";
    
    const formatLocal = (isoStr) => {
      if (!isoStr) return "";
      return new Date(isoStr).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
    };

    records.forEach(r => {
      const empName = r.employee_name || "Empleado Anonimizado";
      const nif = r.nif_nie || "-";
      const nss = r.nss || "-";
      const line = `"${empName}","${nif}","${nss}","${formatLocal(r.clock_in)}","${formatLocal(r.clock_out)}","${r.clock_in_method}","${r.record_hash || ''}"`;
      csvContent += line + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registro_fichajes_inspeccion_${company?.nif || 'inspeccion'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (checking) {
    return (
      <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
        <div className="bg-ambient-glow"></div>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', width: '50px', height: '50px', borderRadius: '50%', borderLeftColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
          <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px' }}>Verificando Portal</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Validando credenciales criptográficas de inspección temporal...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
        <div className="bg-ambient-glow-secondary"></div>
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '15px', borderRadius: '50%', background: 'rgba(239, 71, 111, 0.15)', border: '1px solid rgba(239, 71, 111, 0.3)', marginBottom: '20px' }}>
            <ShieldAlert size={36} color="var(--danger)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '10px' }}>Acceso Denegado</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '25px' }}>
            {error || 'El token de inspección temporal no es válido, ha sido revocado o ya ha expirado.'}
          </p>
          <button onClick={onExit} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            Volver a WhatsAppFichajes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: '#fff', padding: '40px 20px', position: 'relative', overflowX: 'hidden' }}>
      <div className="bg-ambient-glow" style={{ opacity: 0.15 }}></div>
      <div className="bg-ambient-glow-secondary" style={{ opacity: 0.1 }}></div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '35px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'rgba(6, 214, 160, 0.15)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(6, 214, 160, 0.3)' }}>
              <Shield size={32} color="var(--success)" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-title)', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                Portal de Inspección de Trabajo
                <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Seguro (Sólo Lectura)</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                Cumplimiento del Real Decreto-ley 8/2019 y Reglamento General de Protección de Datos (RGPD)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportPDF} className="btn-primary" style={{ background: 'var(--danger)', color: '#fff' }}>
              <Download size={18} />
              <span>Exportar PDF Legal</span>
            </button>
            <button onClick={handleExportCSV} className="btn-primary" style={{ background: 'var(--primary)', color: '#fff' }}>
              <Download size={18} />
              <span>Exportar CSV</span>
            </button>
            <button onClick={onExit} className="btn-secondary">
              <span>Salir del Portal</span>
            </button>
          </div>
        </div>

        {/* Company and Security Audit Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          {/* Company Details */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: 'var(--primary)', fontWeight: '600' }}>Identificación de la Empresa</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.95rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Razón Social</span>
                <strong>{company?.name || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>CIF / NIF</span>
                <strong>{company?.nif || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Email de Contacto</span>
                <span>{company?.email || '-'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Código Cuenta Cotización (CCC)</span>
                <strong>{company?.ccc || 'No configurado'}</strong>
              </div>
            </div>
          </div>

          {/* Cryptography validation explanation */}
          <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', justifyBetween: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={18} />
              <span>Garantía de Integridad</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
              Cada registro de jornada en este portal está firmado criptográficamente en el momento de su inserción con un algoritmo <strong>SHA-256</strong>.
              El portal recalcula y verifica la firma en tiempo real para certificar ante la Inspección de Trabajo que los fichajes no han sufrido modificaciones o manipulaciones silenciosas.
            </p>
          </div>
        </div>

        {/* Fichajes Inmutables */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: '600' }}>Registro Diario de Jornada</h3>
          {records.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No existen registros de jornada en los últimos 4 años para esta empresa.</p>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>DNI / NIE</th>
                    <th>NSS</th>
                    <th>Entrada (Local)</th>
                    <th>Salida (Local)</th>
                    <th>Localización (GPS)</th>
                    <th>Origen</th>
                    <th>Firma Digital (Integridad)</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const isVerified = r.signature_verified;
                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: '500' }}>{r.employee_name}</td>
                        <td>{r.nif_nie || '-'}</td>
                        <td>{r.nss || '-'}</td>
                        <td>{new Date(r.clock_in).toLocaleString('es-ES')}</td>
                        <td>{r.clock_out ? new Date(r.clock_out).toLocaleString('es-ES') : <span style={{ color: 'var(--success)', fontStyle: 'italic' }}>En Curso</span>}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                            {r.latitude !== null && r.longitude !== null ? (
                              <a 
                                href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                              >
                                📍 Entrada ({r.latitude.toFixed(4)}, {r.longitude.toFixed(4)})
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>- Sin Entrada GPS -</span>
                            )}
                            {r.latitude_out !== null && r.longitude_out !== null ? (
                              <a 
                                href={`https://maps.google.com/?q=${r.latitude_out},${r.longitude_out}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                              >
                                📍 Salida ({r.latitude_out.toFixed(4)}, {r.longitude_out.toFixed(4)})
                              </a>
                            ) : r.clock_out ? (
                              <span style={{ color: 'var(--text-muted)' }}>- Sin Salida GPS -</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${r.clock_in_method === 'WHATSAPP' ? 'badge-primary' : 'badge-secondary'}`}>
                            {r.clock_in_method}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.72rem', color: isVerified ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                              {isVerified ? '✓ Firma Verificada' : '✗ Error de Integridad'}
                            </span>
                            <code style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', display: 'block', whiteSpace: 'nowrap' }} title={r.record_hash}>
                              {r.record_hash}
                            </code>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auditoria Legal */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: '600' }}>Historial de Modificaciones y Correcciones (Auditoría Legal)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            De conformidad con la normativa española, cualquier alteración del registro original queda guardada registrando los valores antiguos, nuevos, el usuario autor y la fecha del cambio.
          </p>

          {auditLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No se han realizado correcciones sobre los registros originales.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              {auditLogs.map((log) => (
                <div key={log.id} className="glass-panel" style={{ padding: '15px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-warning" style={{ fontWeight: 'bold' }}>
                      {log.action}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString('es-ES')}</span>
                  </div>
                  <p style={{ marginBottom: '8px' }}>
                    Fichaje ID: <code style={{ color: 'var(--secondary)' }}>{log.record_id}</code> | Usuario Gestor: <strong>{log.operator_email || 'Sistema'}</strong>
                  </p>
                  
                  {log.old_values && (
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', marginBottom: '5px' }}>
                      <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Anterior:</span>
                      <pre style={{ margin: '4px 0 0 0', overflowX: 'auto', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(log.old_values, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.new_values && (
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Nuevo (Corregido):</span>
                      <pre style={{ margin: '4px 0 0 0', overflowX: 'auto', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(log.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
