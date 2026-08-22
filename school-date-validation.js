/* Key School Dates validation and safer term naming. */
(function () {
  const termKinds = ['Autumn', 'Spring', 'Summer'];
  const termName = (kind, startsOn) => `${kind} Term ${String(startsOn || '').slice(0, 4)}`.trim();
  const inRange = (value, from, to) => !!value && (!from || value >= from) && (!to || value <= to);

  function yearFor(id) { return Y.find(y => y.id === id); }
  function periodsFor(yearId, excludeId) {
    return D.filter(d => d.academic_year_id === yearId && d.id !== excludeId);
  }
  function termPeriods(yearId, excludeId) {
    return periodsFor(yearId, excludeId).filter(d => d.period_type === 'term');
  }
  function enclosingTerm(yearId, from, to) {
    return termPeriods(yearId).find(t => from >= t.starts_on && to <= t.ends_on);
  }
  function datesValid(from, to) {
    return !!from && !!to && to >= from;
  }

  function warningText(y) {
    const rows = D.filter(d => d.academic_year_id === y.id);
    const terms = rows.filter(d => d.period_type === 'term');
    const warnings = [];
    const present = new Set(terms.map(termKind));
    const missing = termKinds.filter(k => !present.has(k));
    if (missing.length) warnings.push(`Missing ${missing.join(', ')} term${missing.length === 1 ? '' : 's'}.`);
    const outside = rows.filter(d => d.starts_on < y.starts_on || d.ends_on > y.ends_on);
    if (outside.length) warnings.push(`${outside.length} date record${outside.length === 1 ? '' : 's'} fall outside the academic-year range.`);
    const halfTerms = rows.filter(d => d.period_type === 'half_term');
    const orphanHalfTerms = halfTerms.filter(h => !terms.some(t => h.starts_on >= t.starts_on && h.ends_on <= t.ends_on));
    if (orphanHalfTerms.length) warnings.push(`${orphanHalfTerms.length} half-term record${orphanHalfTerms.length === 1 ? '' : 's'} do not sit inside a term.`);
    const ordered = terms.slice().sort((a,b) => a.starts_on.localeCompare(b.starts_on));
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].starts_on <= ordered[i - 1].ends_on) {
        warnings.push('Two term periods overlap.');
        break;
      }
    }
    return warnings;
  }

  function injectValidationWarnings() {
    const host = document.getElementById('termDates');
    if (!host) return;
    [...host.querySelectorAll('.term-year')].forEach((panel, index) => {
      panel.querySelector('.school-date-warning')?.remove();
      const y = Y[index];
      if (!y) return;
      const warnings = warningText(y);
      if (!warnings.length) return;
      const note = document.createElement('div');
      note.className = 'school-date-warning';
      note.innerHTML = `<b>Check these dates:</b> ${warnings.map(e).join(' ')}`;
      panel.insertBefore(note, panel.firstChild.nextSibling);
    });
  }

  const originalRenderTermDates = window.renderTermDates;
  window.renderTermDates = function () {
    const out = originalRenderTermDates.apply(this, arguments);
    injectValidationWarnings();
    return out;
  };

  window.editYear = function (id) {
    const x = Y.find(z => z.id === id) || {};
    modal(id ? 'Edit academic year' : 'Add academic year', `<label>Site<select id=f1>${opts(S, x.site_id, z => z.name)}</select></label><label>Name<input id=f2 value="${e(x.name)}" placeholder="e.g. 2026-2027"></label><label>Start<input id=f3 type=date value="${x.starts_on || ''}"></label><label>End<input id=f4 type=date value="${x.ends_on || ''}"></label>`, async () => {
      if (!datesValid(f3.value, f4.value)) return alert('Enter a valid academic-year start and end date. The end date must not be before the start date.');
      const linked = id ? D.filter(d => d.academic_year_id === id) : [];
      const outside = linked.filter(d => d.starts_on < f3.value || d.ends_on > f4.value);
      if (outside.length) return alert(`This academic-year range would exclude ${outside.length} existing term/key-date record${outside.length === 1 ? '' : 's'}. Adjust the year dates or the linked records first.`);
      const generated = `${f3.value.slice(0,4)}-${f4.value.slice(0,4)}`;
      const p = { site_id:f1.value, name:f2.value.trim() || generated, starts_on:f3.value, ends_on:f4.value };
      const q = id ? sb.from('academic_years').update(p).eq('id', id) : sb.from('academic_years').insert(p);
      const {error} = await q;
      if (error) return alert(error.message);
      closeM();
      await load();
    });
  };

  window.editTerm = function (id, yearId, preset) {
    const x = D.find(z => z.id === id) || {};
    const inferred = preset || termKind(x) || 'Autumn';
    modal(id ? 'Edit term' : 'Add term', `<label>Academic year<select id=f1>${opts(Y, yearId || x.academic_year_id, z => sn(z.site_id) + ' — ' + z.name)}</select></label><label>Term<select id=f2>${termKinds.map(v => `<option value="${v}" ${inferred === v ? 'selected' : ''}>${v} Term</option>`).join('')}</select></label><label>Start<input id=f3 type=date value="${x.starts_on || ''}"></label><label>End<input id=f4 type=date value="${x.ends_on || ''}"></label><div class="school-date-help">The term year is generated automatically from the term start date.</div>`, async () => {
      if (!datesValid(f3.value, f4.value)) return alert('Enter a valid term start and end date. The end date must not be before the start date.');
      const yy = yearFor(f1.value);
      if (!yy) return alert('Choose an academic year.');
      if (!inRange(f3.value, yy.starts_on, yy.ends_on) || !inRange(f4.value, yy.starts_on, yy.ends_on)) return alert(`These term dates fall outside ${yy.name}. Update the academic-year range first if these dates are correct.`);
      const duplicate = termPeriods(f1.value, id).find(t => termKind(t) === f2.value);
      if (duplicate) return alert(`${f2.value} Term already exists for this academic year. Edit the existing term instead.`);
      const overlaps = termPeriods(f1.value, id).filter(t => f3.value <= t.ends_on && f4.value >= t.starts_on);
      if (overlaps.length) return alert(`These dates overlap ${overlaps.map(t => t.name || termKind(t) + ' Term').join(', ')}. Term periods must not overlap.`);
      const p = {
        academic_year_id:f1.value,
        period_type:'term',
        name:termName(f2.value, f3.value),
        starts_on:f3.value,
        ends_on:f4.value,
        blocks_internal_sessions:false,
        blocks_external_hire:false
      };
      const q = id ? sb.from('academic_calendar_periods').update(p).eq('id', id) : sb.from('academic_calendar_periods').insert(p);
      const {error} = await q;
      if (error) return alert(error.message);
      closeM();
      await load();
    });
  };

  window.editDate = function (id) {
    const x = D.find(z => z.id === id) || {};
    const types = ['half_term','exeat','christmas_holiday','easter_holiday','summer_holiday','inset_day','bank_holiday','other'];
    modal(id ? 'Edit key school date' : 'Add key school date', `<label>Academic year<select id=f1>${opts(Y, x.academic_year_id, z => sn(z.site_id) + ' — ' + z.name)}</select></label><label>Type<select id=f2>${types.map(v => `<option value=${v} ${x.period_type === v ? 'selected' : ''}>${v.replaceAll('_',' ')}</option>`).join('')}</select></label><label>Name<input id=f3 value="${e(x.name)}"></label><label>Start<input id=f4 type=date value="${x.starts_on || ''}"></label><label>End<input id=f5 type=date value="${x.ends_on || ''}"></label><label>Notes<textarea id=f6>${e(x.operational_notes)}</textarea></label>`, async () => {
      if (!datesValid(f4.value, f5.value)) return alert('Enter a valid start and end date. The end date must not be before the start date.');
      const yy = yearFor(f1.value);
      if (!yy) return alert('Choose an academic year.');
      if (!inRange(f4.value, yy.starts_on, yy.ends_on) || !inRange(f5.value, yy.starts_on, yy.ends_on)) return alert(`These dates fall outside ${yy.name}. Update the academic-year range first if these dates are correct.`);
      if (f2.value === 'half_term' && !enclosingTerm(f1.value, f4.value, f5.value)) return alert('Half term must sit completely inside one of this academic year’s Autumn, Spring or Summer terms.');
      const p = {
        academic_year_id:f1.value,
        period_type:f2.value,
        name:f3.value.trim(),
        starts_on:f4.value,
        ends_on:f5.value,
        blocks_internal_sessions:false,
        blocks_external_hire:false,
        operational_notes:f6.value || null
      };
      const q = id ? sb.from('academic_calendar_periods').update(p).eq('id', id) : sb.from('academic_calendar_periods').insert(p);
      const {error} = await q;
      if (error) return alert(error.message);
      closeM();
      await load();
    });
  };

  const style = document.createElement('style');
  style.textContent = `.school-date-warning{margin:0 0 12px;padding:10px 12px;border:1px solid #efc46b;background:#fff8e7;border-radius:8px;color:#704b00;line-height:1.4}.school-date-help{grid-column:1/-1;font-size:12px;color:#607180;margin-top:-3px}`;
  document.head.appendChild(style);
})();
