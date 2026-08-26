/* Void invoiced school pool-hire statements while preserving the audit trail. */
(function () {
  const allowedRoles = new Set(['owner_admin', 'finance']);

  function canVoidInvoices() {
    try { return allowedRoles.has(String(P?.role || '')); } catch (_) { return false; }
  }

  function monthValue() {
    const input = document.querySelector('#monthlyBilling input[type="month"]');
    return input?.value || '';
  }

  async function enhanceVoidActions() {
    const root = document.getElementById('monthlyBilling');
    if (!root || !canVoidInvoices()) return;

    const month = monthValue();
    if (!month) return;

    const { data, error } = await sb.from('school_invoice_batches')
      .select('id,hirer_id,site_id,usage_month,status,paid_at,net_amount,total_amount')
      .eq('usage_month', month + '-01')
      .in('status', ['invoiced', 'voided']);
    if (error) {
      console.warn('Could not load invoice void actions', error);
      return;
    }

    const rows = [...root.querySelectorAll('.bill-row')];
    rows.forEach(row => {
      if (row.dataset.voidEnhanced === '1') return;
      const text = row.textContent || '';
      const hirer = (H || []).find(h => text.includes(h.name));
      if (!hirer) return;
      const batch = (data || []).find(b => b.hirer_id === hirer.id);
      if (!batch) return;

      const statusEl = row.querySelector('.bill-status');
      const actions = row.querySelector('.bill-actions') || row.lastElementChild;
      if (!actions) return;

      if (batch.status === 'voided') {
        if (statusEl) {
          statusEl.textContent = 'Voided';
          statusEl.classList.add('voided');
        }
        const note = document.createElement('div');
        note.className = 'bill-void-note';
        note.textContent = 'Excluded from live Finance totals; audit history retained.';
        statusEl?.parentElement?.appendChild(note);
      } else if (batch.status === 'invoiced' && !batch.paid_at) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 's bill-void-button';
        button.textContent = 'Void invoice';
        button.onclick = () => window.voidSchoolInvoiceBatch(batch.id, hirer.name, batch.total_amount);
        actions.appendChild(button);
      }
      row.dataset.voidEnhanced = '1';
    });
  }

  window.voidSchoolInvoiceBatch = async function (id, hirerName, totalAmount) {
    if (!canVoidInvoices()) return alert('Only an owner administrator or Finance user can void an invoice.');
    const reason = prompt(`Reason for voiding the ${hirerName || ''} invoice?\n\nThe audit history and original amount will be retained.`);
    if (reason === null) return;
    if (!reason.trim()) return alert('Please enter a reason.');
    const amount = Number(totalAmount || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
    if (!confirm(`Void this invoice for ${hirerName || 'this customer'} (${amount})?\n\nIt will be excluded from live Finance totals but remain in the audit history.`)) return;

    const { error } = await sb.rpc('void_school_invoice_batch', { p_batch_id: id, p_reason: reason.trim() });
    if (error) return alert(error.message || String(error));

    alert('Invoice voided. The original statement and audit history have been retained.');
    try {
      if (typeof renderMonthlyBilling === 'function') await renderMonthlyBilling();
      if (typeof renderDashboardReporting === 'function') await renderDashboardReporting();
    } catch (_) {}
    setTimeout(enhanceVoidActions, 100);
  };

  if (window.OpsLifecycle?.use) {
    OpsLifecycle.use('renderMonthlyBilling', function (next, ...args) {
      const out = next(...args);
      Promise.resolve(out).finally(() => setTimeout(enhanceVoidActions, 50));
      return out;
    });
  }

  document.addEventListener('click', event => {
    if (event.target?.id === 'refresh' || event.target?.closest?.('[data-btab="income"]')) {
      setTimeout(enhanceVoidActions, 250);
    }
  }, true);
  window.addEventListener('load', () => setTimeout(enhanceVoidActions, 400));

  const style = document.createElement('style');
  style.textContent = `.bill-status.voided{background:#eef2f7;color:#475569}.bill-void-note{margin-top:6px;font-size:12px;color:#64748b;max-width:260px}.bill-void-button{margin-left:6px}`;
  document.head.appendChild(style);
})();
