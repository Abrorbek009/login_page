import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const emptyProductForm = { name: "", sku: "", price: "", stock: "" };
const emptyEmployeeForm = { fullName: "", position: "", salary: "", phone: "", status: "active" };
const emptyExpenseForm = { title: "", category: "", amount: "", note: "" };

const SECTIONS = [
  { id: "overview", label: "Umumiy" },
  { id: "products", label: "Mahsulotlar" },
  { id: "employees", label: "Ishchilar" },
  { id: "expenses", label: "Xarajatlar" },
  { id: "finance", label: "Hisobot" },
];

function buildLinePoints(values) {
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);
  const step = values.length > 1 ? 100 / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = Number((index * step).toFixed(2));
      const y = Number((50 - (value / max) * 35).toFixed(2));
      return `${x},${y}`;
    })
    .join(" ");
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

const SectionCard = ({ title, subtitle, children }) => (
  <section className="card section-card">
    <div className="panel-head">
      <div>
        <p className="eyebrow">Panel</p>
        <h2>{title}</h2>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

const TrendChart = ({ title, subtitle, series, metric }) => {
  const values = series.map((item) => Number(item[metric] || 0));
  const points = buildLinePoints(values);
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);

  return (
    <section className="card chart-card">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Report</p>
          <h2>{title}</h2>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
      </div>
      <div className="line-chart">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={title}>
          <polyline className="chart-grid-line" points="0,20 100,20" />
          <polyline className="chart-grid-line" points="0,50 100,50" />
          <polyline className="chart-grid-line" points="0,80 100,80" />
          <polyline className={`chart-line ${metric}`} points={points} />
        </svg>
      </div>
      <div className="chart-list">
        {series.map((item) => (
          <div className="chart-row" key={item.date}>
            <div className="chart-meta">
              <span>{item.label}</span>
              <strong>{Number(item[metric] || 0).toFixed(0)}</strong>
            </div>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span className={`legend-dot ${metric}`} />
        <span>{metric === "sales" ? "Sales" : "Profit"}</span>
        <span className="muted">Max: {max.toFixed(0)}</span>
      </div>
    </section>
  );
};

export default function App() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("0000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [reportTrend, setReportTrend] = useState({ daily: [], monthly: [] });

  const [editingProductId, setEditingProductId] = useState(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardMessage, setDashboardMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [clearingDemo, setClearingDemo] = useState(false);

  const loadDashboard = async () => {
    const [productData, employeeData, expenseData] = await Promise.all([
      fetchJson(`${API_BASE_URL}/api/products`),
      fetchJson(`${API_BASE_URL}/api/employees`),
      fetchJson(`${API_BASE_URL}/api/expenses`),
    ]);
    setProducts(productData);
    setEmployees(employeeData);
    setExpenses(expenseData);
    const trendData = await fetchJson(`${API_BASE_URL}/api/reports/trend`);
    setReportTrend(trendData);
  };

  useEffect(() => {
    if (user) loadDashboard().catch((err) => setDashboardError(err.message));
  }, [user]);

  const stats = useMemo(() => {
    const productCount = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const totalSold = products.reduce((sum, product) => sum + product.sold, 0);
    const inventoryValue = products.reduce(
      (sum, product) => sum + product.stock * Number(product.price || 0),
      0,
    );
    const revenue = products.reduce(
      (sum, product) => sum + product.sold * Number(product.price || 0),
      0,
    );
    const salaryFund = employees.reduce((sum, employee) => sum + Number(employee.salary || 0), 0);
    const salariesPaid = employees.reduce(
      (sum, employee) => sum + Number(employee.totalPaid || 0),
      0,
    );
    const expensesTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const profit = revenue - salariesPaid - expensesTotal;
    return { productCount, totalStock, totalSold, inventoryValue, revenue, salaryFund, salariesPaid, expensesTotal, profit };
  }, [products, employees, expenses]);

  const resetMessages = () => {
    setDashboardError("");
    setDashboardMessage("");
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setEditingEmployeeId(null);
    setEditingExpenseId(null);
    setProductForm(emptyProductForm);
    setEmployeeForm(emptyEmployeeForm);
    setExpenseForm(emptyExpenseForm);
  };

  const clearDemoData = async () => {
    setClearingDemo(true);
    resetMessages();
    try {
      await Promise.all([
        fetchJson(`${API_BASE_URL}/api/products/demo/all`, { method: "DELETE" }),
        fetchJson(`${API_BASE_URL}/api/employees/demo/all`, { method: "DELETE" }),
        fetchJson(`${API_BASE_URL}/api/expenses/demo/all`, { method: "DELETE" }),
      ]);
      cancelEdit();
      await loadDashboard();
      setDashboardMessage("Demo data tozalandi");
    } catch (err) {
      setDashboardError(err.message);
    } finally {
      setClearingDemo(false);
    }
  };

  const buildExportRows = () => {
    const lines = [
      ["period", "label", "sales", "profit"].join(","),
      ...reportTrend.daily.map(
        (item) =>
          `daily,${item.label},${Number(item.sales || 0).toFixed(2)},${Number(item.profit || 0).toFixed(2)}`,
      ),
      ...reportTrend.monthly.map(
        (item) =>
          `monthly,${item.label},${Number(item.sales || 0).toFixed(2)},${Number(item.profit || 0).toFixed(2)}`,
      ),
    ];

    return lines.join("\n");
  };

  const exportReport = () => {
    const blob = new Blob([buildExportRows()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const printDashboard = () => {
    const rowsHtml = (rows) =>
      rows
        .map(
          (row) => `
            <tr>
              <td>${row.label}</td>
              <td>${Number(row.sales || 0).toFixed(2)}</td>
              <td>${Number(row.profit || 0).toFixed(2)}</td>
            </tr>
          `,
        )
        .join("");

    const printable = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Finance Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 24px;
              color: #111827;
            }
            h1, h2, p { margin: 0 0 12px; }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin: 18px 0 24px;
            }
            .card {
              border: 1px solid #d1d5db;
              border-radius: 12px;
              padding: 14px;
              background: #f9fafb;
            }
            .card span {
              display: block;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 8px;
            }
            .card strong {
              font-size: 22px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              margin-bottom: 24px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px 10px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background: #f3f4f6;
            }
            .section {
              margin-bottom: 24px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Finance Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <div class="grid">
            <div class="card"><span>Umumiy tushum</span><strong>${stats.revenue.toFixed(2)}</strong></div>
            <div class="card"><span>Jami xarajatlar</span><strong>${stats.expensesTotal.toFixed(2)}</strong></div>
            <div class="card"><span>Net foyda</span><strong>${stats.profit.toFixed(2)}</strong></div>
          </div>

          <div class="section">
            <h2>Kunlik savdo</h2>
            <table>
              <thead>
                <tr><th>Kun</th><th>Sales</th><th>Profit</th></tr>
              </thead>
              <tbody>
                ${rowsHtml(reportTrend.daily)}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Oylik savdo</h2>
            <table>
              <thead>
                <tr><th>Oy</th><th>Sales</th><th>Profit</th></tr>
              </thead>
              <tbody>
                ${rowsHtml(reportTrend.monthly)}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.srcdoc = printable;

    const cleanup = () => {
      setTimeout(() => {
        iframe.remove();
      }, 500);
    };

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        cleanup();
        return;
      }

      frameWindow.focus();
      frameWindow.print();
      frameWindow.onafterprint = cleanup;
      setTimeout(cleanup, 3000);
    };

    document.body.appendChild(iframe);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    resetMessages();
    try {
      const isEditing = Boolean(editingProductId);
      const url = editingProductId ? `${API_BASE_URL}/api/products/${editingProductId}` : `${API_BASE_URL}/api/products`;
      const method = isEditing ? "PUT" : "POST";
      await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      cancelEdit();
      await loadDashboard();
      setDashboardMessage(isEditing ? "Mahsulot yangilandi" : "Mahsulot qo'shildi");
    } catch (err) {
      setDashboardError(err.message);
    }
  };

  const submitEmployee = async (event) => {
    event.preventDefault();
    resetMessages();
    try {
      const isEditing = Boolean(editingEmployeeId);
      const url = editingEmployeeId ? `${API_BASE_URL}/api/employees/${editingEmployeeId}` : `${API_BASE_URL}/api/employees`;
      const method = isEditing ? "PUT" : "POST";
      await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeForm),
      });
      cancelEdit();
      await loadDashboard();
      setDashboardMessage(isEditing ? "Ishchi yangilandi" : "Ishchi qo'shildi");
    } catch (err) {
      setDashboardError(err.message);
    }
  };

  const submitExpense = async (event) => {
    event.preventDefault();
    resetMessages();
    try {
      const isEditing = Boolean(editingExpenseId);
      const url = editingExpenseId ? `${API_BASE_URL}/api/expenses/${editingExpenseId}` : `${API_BASE_URL}/api/expenses`;
      const method = isEditing ? "PUT" : "POST";
      await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm),
      });
      cancelEdit();
      await loadDashboard();
      setDashboardMessage(isEditing ? "Xarajat yangilandi" : "Xarajat saqlandi");
    } catch (err) {
      setDashboardError(err.message);
    }
  };

  const updateProduct = async (id, action) => {
    resetMessages();
    setBusyId(id);
    try {
      await fetchJson(`${API_BASE_URL}/api/products/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1 }),
      });
      await loadDashboard();
      setDashboardMessage(action === "purchase" ? "Kirim qilindi" : "Sotuv yozildi");
    } catch (err) {
      setDashboardError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const paySalary = async (id) => {
    resetMessages();
    setBusyId(id);
    try {
      await fetchJson(`${API_BASE_URL}/api/employees/${id}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 0 }),
      });
      await loadDashboard();
      setDashboardMessage("Oylik to'landi");
    } catch (err) {
      setDashboardError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const deleteById = async (endpoint, id, successMessage) => {
    resetMessages();
    setBusyId(id);
    try {
      await fetchJson(`${API_BASE_URL}${endpoint}/${id}`, { method: "DELETE" });
      await loadDashboard();
      setDashboardMessage(successMessage);
    } catch (err) {
      setDashboardError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const editProduct = (product) => {
    setActiveSection("products");
    setEditingEmployeeId(null);
    setEditingExpenseId(null);
    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      stock: String(product.stock),
    });
  };

  const editEmployee = (employee) => {
    setActiveSection("employees");
    setEditingProductId(null);
    setEditingExpenseId(null);
    setEditingEmployeeId(employee._id);
    setEmployeeForm({
      fullName: employee.fullName,
      position: employee.position,
      salary: String(employee.salary),
      phone: employee.phone || "",
      status: employee.status || "active",
    });
  };

  const editExpense = (expense) => {
    setActiveSection("expenses");
    setEditingProductId(null);
    setEditingEmployeeId(null);
    setEditingExpenseId(expense._id);
    setExpenseForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      note: expense.note || "",
    });
  };

  if (!user) {
    return (
      <main className="shell">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Node.js + React</p>
            <h1>Admin login</h1>
            <p className="lead">
              Backend and frontend are connected. Use <strong>admin</strong> and{" "}
              <strong>0000</strong> to enter.
            </p>
          </div>
          <form className="card login-card" onSubmit={handleLogin}>
            <label>
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Checking..." : "Login"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const renderProducts = () => (
    <section className="section-layout">
      <SectionCard title={editingProductId ? "Mahsulotni tahrirlash" : "Mahsulot qo'shish"} subtitle="Omborga yangi mahsulot kiritish">
        <form className="panel-form" onSubmit={submitProduct}>
          <label>
            Nomi
            <input value={productForm.name} onChange={(e) => setProductForm((c) => ({ ...c, name: e.target.value }))} />
          </label>
          <label>
            SKU
            <input value={productForm.sku} onChange={(e) => setProductForm((c) => ({ ...c, sku: e.target.value }))} />
          </label>
          <div className="two-col">
            <label>
              Narx
              <input type="number" min="0" step="0.01" value={productForm.price} onChange={(e) => setProductForm((c) => ({ ...c, price: e.target.value }))} />
            </label>
            <label>
              Boshlang'ich son
              <input type="number" min="0" step="1" value={productForm.stock} onChange={(e) => setProductForm((c) => ({ ...c, stock: e.target.value }))} />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">{editingProductId ? "Update product" : "Save product"}</button>
            {editingProductId ? <button className="secondary-button" type="button" onClick={cancelEdit}>Cancel</button> : null}
          </div>
        </form>
      </SectionCard>
      <SectionCard title="Mahsulotlar ro'yxati" subtitle="Kirim, sotish, tahrirlash va o'chirish shu yerda">
        <div className="product-list">
          {products.length === 0 ? <div className="empty-state"><h3>Hali mahsulot yo'q</h3><p className="muted">Chapdagi forma orqali birinchi mahsulotni qo'shing.</p></div> : products.map((product) => (
            <article className="product-row" key={product._id}>
              <div className="product-main">
                <h3>{product.name}</h3>
                <p>SKU: {product.sku}</p>
                <p>Narx: ${Number(product.price).toFixed(2)} · Stock: {product.stock} · Sold: {product.sold}</p>
              </div>
              <div className="product-actions">
                <button className="ghost-button" type="button" onClick={() => editProduct(product)}>Edit</button>
                <button className="ghost-button" type="button" disabled={busyId === product._id} onClick={() => updateProduct(product._id, "purchase")}>Buy in</button>
                <button className="ghost-button" type="button" disabled={busyId === product._id} onClick={() => updateProduct(product._id, "sell")}>Sell</button>
                <button className="danger-button" type="button" disabled={busyId === product._id} onClick={() => deleteById("/api/products", product._id, "Mahsulot o'chirildi")}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </section>
  );

  const renderEmployees = () => (
    <section className="section-layout">
      <SectionCard title={editingEmployeeId ? "Ishchini tahrirlash" : "Ishchi qo'shish"} subtitle="Jamoa a'zolarini qo'shing">
        <form className="panel-form" onSubmit={submitEmployee}>
          <label>
            Ism familiya
            <input value={employeeForm.fullName} onChange={(e) => setEmployeeForm((c) => ({ ...c, fullName: e.target.value }))} />
          </label>
          <label>
            Lavozim
            <input value={employeeForm.position} onChange={(e) => setEmployeeForm((c) => ({ ...c, position: e.target.value }))} />
          </label>
          <div className="two-col">
            <label>
              Oylik
              <input type="number" min="0" step="1" value={employeeForm.salary} onChange={(e) => setEmployeeForm((c) => ({ ...c, salary: e.target.value }))} />
            </label>
            <label>
              Telefon
              <input value={employeeForm.phone} onChange={(e) => setEmployeeForm((c) => ({ ...c, phone: e.target.value }))} />
            </label>
          </div>
          <label>
            Status
            <select value={employeeForm.status} onChange={(e) => setEmployeeForm((c) => ({ ...c, status: e.target.value }))}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit">{editingEmployeeId ? "Update employee" : "Add employee"}</button>
            {editingEmployeeId ? <button className="secondary-button" type="button" onClick={cancelEdit}>Cancel</button> : null}
          </div>
        </form>
      </SectionCard>
      <SectionCard title="Ishchilar va oyliklar" subtitle="Har bir ishchi uchun oylik to'lash, tahrirlash va o'chirish">
        <div className="product-list">
          {employees.length === 0 ? <div className="empty-state"><h3>Hali ishchi yo'q</h3><p className="muted">Ishchi qo'shsangiz, shu yerda ko'rinadi.</p></div> : employees.map((employee) => (
            <article className="employee-row" key={employee._id}>
              <div className="product-main">
                <h3>{employee.fullName}</h3>
                <p>{employee.position} · Oylik: ${Number(employee.salary).toFixed(2)}</p>
                <p>Status: {employee.status} · To'langan: ${Number(employee.totalPaid || 0).toFixed(2)} · So'nggi to'lov: {employee.lastPaidAt ? new Date(employee.lastPaidAt).toLocaleDateString() : "yo'q"}</p>
              </div>
              <div className="product-actions">
                <button className="ghost-button" type="button" onClick={() => editEmployee(employee)}>Edit</button>
                <button className="ghost-button" type="button" disabled={busyId === employee._id} onClick={() => paySalary(employee._id)}>Pay salary</button>
                <button className="danger-button" type="button" disabled={busyId === employee._id} onClick={() => deleteById("/api/employees", employee._id, "Ishchi o'chirildi")}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </section>
  );

  const renderExpenses = () => (
    <section className="section-layout">
      <SectionCard title={editingExpenseId ? "Xarajatni tahrirlash" : "Xarajat kiritish"} subtitle="Kunlik va doimiy xarajatlar">
        <form className="panel-form" onSubmit={submitExpense}>
          <label>
            Nomi
            <input value={expenseForm.title} onChange={(e) => setExpenseForm((c) => ({ ...c, title: e.target.value }))} />
          </label>
          <label>
            Kategoriya
            <input value={expenseForm.category} onChange={(e) => setExpenseForm((c) => ({ ...c, category: e.target.value }))} />
          </label>
          <label>
            Summa
            <input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm((c) => ({ ...c, amount: e.target.value }))} />
          </label>
          <label>
            Izoh
            <input value={expenseForm.note} onChange={(e) => setExpenseForm((c) => ({ ...c, note: e.target.value }))} />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit">{editingExpenseId ? "Update expense" : "Save expense"}</button>
            {editingExpenseId ? <button className="secondary-button" type="button" onClick={cancelEdit}>Cancel</button> : null}
          </div>
        </form>
      </SectionCard>
      <SectionCard title="So'nggi xarajatlar" subtitle="Barcha xarajatlar ro'yxati">
        <div className="product-list">
          {expenses.length === 0 ? <div className="empty-state"><h3>Hali xarajat yo'q</h3><p className="muted">Kiritilgan xarajatlar shu yerda saqlanadi.</p></div> : expenses.map((expense) => (
            <article className="expense-row" key={expense._id}>
              <div className="product-main">
                <h3>{expense.title}</h3>
                <p>{expense.category} · ${Number(expense.amount).toFixed(2)}</p>
                <p>{expense.note || "Izoh yo'q"}</p>
              </div>
              <div className="product-actions">
                <button className="ghost-button" type="button" onClick={() => editExpense(expense)}>Edit</button>
                <button className="danger-button" type="button" disabled={busyId === expense._id} onClick={() => deleteById("/api/expenses", expense._id, "Xarajat o'chirildi")}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </section>
  );

  return (
    <main className="app-shell">
      <aside className="sidebar card">
        <div>
          <p className="eyebrow">Business dashboard</p>
          <h2>Bo'limlar</h2>
        </div>
        <nav className="sidebar-nav">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`sidebar-link ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="secondary-button full-width" type="button" onClick={() => loadDashboard().catch((err) => setDashboardError(err.message))}>Refresh all</button>
          <button className="secondary-button full-width" type="button" onClick={clearDemoData} disabled={clearingDemo}>{clearingDemo ? "Clearing..." : "Clear demo data"}</button>
          <button className="secondary-button full-width" type="button" onClick={() => setUser(null)}>Log out</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-top card">
          <div>
            <p className="eyebrow">Active section</p>
            <h1>{SECTIONS.find((item) => item.id === activeSection)?.label}</h1>
            <p className="lead">Chapdagi menyudan bo'lim tanlang. O'ng tomonda faqat o'sha bo'lim chiqadi.</p>
          </div>
          <div className="header-actions">
            <button className="secondary-button" type="button" onClick={exportReport}>
              Export CSV
            </button>
            <button className="secondary-button" type="button" onClick={printDashboard}>
              Print
            </button>
          </div>
        </header>
        {(dashboardError || dashboardMessage) && (
          <section className="notice-row">
            {dashboardError ? <p className="error">{dashboardError}</p> : null}
            {dashboardMessage ? <p className="success">{dashboardMessage}</p> : null}
          </section>
        )}
        {activeSection === "overview" && (
          <section className="overview-grid">
            <article className="stat-card"><span>Mahsulotlar</span><strong>{stats.productCount}</strong></article>
            <article className="stat-card"><span>Ombordagi son</span><strong>{stats.totalStock}</strong></article>
            <article className="stat-card"><span>Sotilgan</span><strong>{stats.totalSold}</strong></article>
            <article className="stat-card"><span>Oylik jamg'arma</span><strong>${stats.salaryFund.toFixed(2)}</strong></article>
            <article className="stat-card"><span>Xarajatlar</span><strong>${stats.expensesTotal.toFixed(2)}</strong></article>
            <article className="stat-card"><span>Foyda</span><strong className={stats.profit >= 0 ? "positive" : "negative"}>${stats.profit.toFixed(2)}</strong></article>
          </section>
        )}
        {activeSection === "products" ? renderProducts() : null}
        {activeSection === "employees" ? renderEmployees() : null}
        {activeSection === "expenses" ? renderExpenses() : null}
        {activeSection === "finance" && (
          <section className="finance-stack">
            <section className="overview-grid finance-grid">
              <article className="stat-card"><span>Umumiy tushum</span><strong>${stats.revenue.toFixed(2)}</strong></article>
              <article className="stat-card"><span>Reja oylik fondi</span><strong>${stats.salaryFund.toFixed(2)}</strong></article>
              <article className="stat-card"><span>To'langan oyliklar</span><strong>${stats.salariesPaid.toFixed(2)}</strong></article>
              <article className="stat-card"><span>Jami xarajatlar</span><strong>${stats.expensesTotal.toFixed(2)}</strong></article>
              <article className="stat-card"><span>Net foyda</span><strong className={stats.profit >= 0 ? "positive" : "negative"}>${stats.profit.toFixed(2)}</strong></article>
            </section>
            <section className="chart-grid">
              <TrendChart
                title="Kunlik savdo"
                subtitle="Oxirgi 7 kun"
                series={reportTrend.daily}
                metric="sales"
              />
              <TrendChart
                title="Kunlik foyda"
                subtitle="Oxirgi 7 kun"
                series={reportTrend.daily}
                metric="profit"
              />
              <TrendChart
                title="Oylik savdo"
                subtitle="Oxirgi 6 oy"
                series={reportTrend.monthly}
                metric="sales"
              />
              <TrendChart
                title="Oylik foyda"
                subtitle="Oxirgi 6 oy"
                series={reportTrend.monthly}
                metric="profit"
              />
            </section>
          </section>
        )}
      </main>
    </main>
  );
}
