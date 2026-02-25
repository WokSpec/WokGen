'use client';

import { useState, useCallback } from 'react';

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

let nextId = 1;

function genInvoiceNumber() {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}
function dueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

export default function InvoiceGeneratorTool() {
  const [company, setCompany] = useState('');
  const [client, setClient] = useState('');
  const [invoiceNum, setInvoiceNum] = useState(genInvoiceNumber);
  const [date, setDate] = useState(today);
  const [due, setDue] = useState(dueDate);
  const [items, setItems] = useState<LineItem[]>([{ id: nextId++, description: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0);

  const updateItem = (id: number, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const addItem = () => setItems(prev => [...prev, { id: nextId++, description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * taxRate / 100;
  const total = subtotal + tax;

  const fmt = (n: number) => n.toFixed(2);

  const handlePrint = useCallback(() => { window.print(); }, []);

  return (
    <div className="inv-tool">
      {/* ── Form (hidden on print) ── */}
      <div className="inv-tool__form no-print">
        <div className="inv-tool__row">
          <label className="inv-tool__field">
            <span>Company Name</span>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" />
          </label>
          <label className="inv-tool__field">
            <span>Client Name</span>
            <input value={client} onChange={e => setClient(e.target.value)} placeholder="John Doe" />
          </label>
        </div>
        <div className="inv-tool__row">
          <label className="inv-tool__field">
            <span>Invoice Number</span>
            <input value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} />
          </label>
          <label className="inv-tool__field">
            <span>Date</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          <label className="inv-tool__field">
            <span>Due Date</span>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} />
          </label>
        </div>
      </div>

      {/* ── Printable Invoice ── */}
      <div className="inv-preview" id="inv-preview">
        <div className="inv-preview__header">
          <div>
            <div className="inv-preview__company">{company || 'Your Company'}</div>
            <div className="inv-preview__bill-to">Bill To: <strong>{client || 'Client Name'}</strong></div>
          </div>
          <div className="inv-preview__meta">
            <div><span>Invoice #:</span> <strong>{invoiceNum}</strong></div>
            <div><span>Date:</span> {date}</div>
            <div><span>Due:</span> {due}</div>
          </div>
        </div>

        {/* Line items */}
        <table className="inv-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
              <th className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <input
                    className="inv-table__input"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </td>
                <td>
                  <input
                    className="inv-table__input inv-table__input--num"
                    type="number" min={0} step={1}
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    className="inv-table__input inv-table__input--num"
                    type="number" min={0} step={0.01}
                    value={item.unitPrice}
                    onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                  />
                </td>
                <td className="inv-table__subtotal">${fmt(item.quantity * item.unitPrice)}</td>
                <td className="no-print">
                  {items.length > 1 && (
                    <button className="inv-table__del" onClick={() => removeItem(item.id)} title="Remove">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="no-print inv-tool__add-row">
          <button className="btn btn-sm" onClick={addItem}>+ Add Line Item</button>
        </div>

        {/* Totals */}
        <div className="inv-totals">
          <div className="inv-totals__row">
            <span>Subtotal</span>
            <span>${fmt(subtotal)}</span>
          </div>
          <div className="inv-totals__row no-print">
            <span>
              Tax Rate&nbsp;
              <select value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="inv-tax-sel">
                {[0,5,8,10,13,15,20,21,25].map(r => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
            </span>
            <span>${fmt(tax)}</span>
          </div>
          <div className="inv-totals__row print-only">
            <span>Tax ({taxRate}%)</span>
            <span>${fmt(tax)}</span>
          </div>
          <div className="inv-totals__row inv-totals__total">
            <span>Total</span>
            <span>${fmt(total)}</span>
          </div>
        </div>
      </div>

      <div className="no-print inv-tool__actions">
        <button className="btn btn-primary" onClick={handlePrint}>Generate PDF / Print</button>
      </div>

      <style>{`
        .inv-tool { display: flex; flex-direction: column; gap: 20px; }
        .inv-tool__form {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;
        }
        .inv-tool__row { display: flex; gap: 12px; flex-wrap: wrap; }
        .inv-tool__field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px; font-size: 12px; color: var(--text-secondary); }
        .inv-tool__field input {
          background: var(--bg); border: 1px solid var(--surface-border); border-radius: 4px;
          color: var(--text); padding: 6px 8px; font-size: 13px;
        }
        .inv-preview {
          background: #fff; color: #111; border: 1px solid #ddd;
          border-radius: 8px; padding: 32px; font-size: 13px;
        }
        .inv-preview__header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .inv-preview__company { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .inv-preview__bill-to { font-size: 13px; color: #555; }
        .inv-preview__meta { text-align: right; display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #444; }
        .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .inv-table th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 12px; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
        .inv-table td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
        .inv-table__input { border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 6px; font-size: 13px; width: 100%; color: #111; background: #fff; }
        .inv-table__input--num { max-width: 80px; }
        .inv-table__subtotal { font-weight: 500; white-space: nowrap; }
        .inv-table__del { background: none; border: none; color: #f87171; cursor: pointer; font-size: 14px; padding: 2px 6px; }
        .inv-tool__add-row { margin: 4px 0; }
        .btn.btn-sm { padding: 5px 12px; font-size: 12px; cursor: pointer; background: rgba(255,255,255,0.06); border: 1px solid var(--surface-border); color: var(--text); border-radius: 4px; }
        .inv-totals { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
        .inv-totals__row { display: flex; gap: 24px; justify-content: flex-end; min-width: 280px; font-size: 13px; }
        .inv-totals__row span:first-child { color: #555; flex: 1; }
        .inv-totals__total { font-size: 16px; font-weight: 700; border-top: 2px solid #111; padding-top: 6px; }
        .inv-tax-sel { margin-left: 6px; font-size: 12px; border-radius: 3px; border: 1px solid #ccc; }
        .inv-tool__actions { display: flex; justify-content: flex-end; }
        @media print {
          .no-print { display: none !important; }
          .inv-preview { border: none; padding: 16px; border-radius: 0; }
          .inv-table__input { border: none; padding: 0; background: transparent; }
        }
        .print-only { display: none; }
        @media print { .print-only { display: flex !important; } }
      `}</style>
    </div>
  );
}
