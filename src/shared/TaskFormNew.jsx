/**
 * TaskFormNew — crear / editar tarea (Mi Agenda y Pizarrones).
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useKeyboardOffset } from '../pwa/useKeyboardOffset'
import { useTasks } from '../core/hooks/useTasks'
import { useCoreState } from '../core/hooks/useCoreData'
import { RepeatDayPicker } from './RepeatDayPicker'
import { ReminderPanel } from '../modules/agenda/components/ReminderPanel'
import { localEndOfDay, buildReminderSchedule } from '../core/calendar/localDate'
import { taskHasReminder } from '../core/tasks/taskReminder'
import { L } from './agendaEditorial'
import { SyngMark } from './SyngLogo'
import { useShellChrome } from './ShellChromeContext'
import { showToast } from './Toast'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const REMINDER_EDIT_MSG = 'Para cambiar fecha o aviso, elimina esta tarea y créala de nuevo con el recordatorio que necesitas.'

function pad2(n) { return String(n).padStart(2, '0') }

function labelFechaLarga(ds) {
  if (!ds) return 'Elegir fecha'
  const [y, m, d] = ds.split('-').map(Number)
  return `${d} de ${MESES[m - 1]} de ${y}`
}

function from24h(h24) {
  return { h12: h24 % 12 || 12, ampm: h24 >= 12 ? 'PM' : 'AM' }
}

function to24h(h12, ampm) {
  let h = h12 % 12
  if (ampm === 'PM') h += 12
  return h
}

function parseOffsetMin(total) {
  const d = Math.floor(total / 1440)
  const rem = total % 1440
  return { d, h: Math.floor(rem / 60), m: rem % 60 }
}

function buildOffsetLabel(d, h, m) {
  if (d === 0 && h === 0 && m === 0) return 'Cuando toque'
  const parts = []
  if (d > 0) parts.push(`${d} día${d !== 1 ? 's' : ''}`)
  if (h > 0) parts.push(`${h} hora${h !== 1 ? 's' : ''}`)
  if (m > 0) parts.push(`${m} minuto${m !== 1 ? 's' : ''}`)
  return parts.join(' y ') + ' antes'
}

function buildDueAndReminder(dayKey, reminderOn, actH24, actM, totalOffsetMin, offsetSummary) {
  if (!reminderOn) {
    return {
      dueDate: dayKey ? Timestamp.fromDate(localEndOfDay(dayKey)) : null,
      reminder: null,
      reminderTime: null,
    }
  }
  const { activityDate, scheduled } = buildReminderSchedule(dayKey, actH24, actM, totalOffsetMin)
  const reminderTime = Timestamp.fromDate(scheduled)
  return {
    dueDate: Timestamp.fromDate(activityDate),
    reminderTime,
    reminder: {
      scheduledAt: reminderTime,
      offsetMin: totalOffsetMin,
      dueTime: `${pad2(actH24)}:${pad2(actM)}`,
      label: offsetSummary,
    },
  }
}

/** Al editar sin recordatorio, no enviar reminder:null si nunca lo tuvo (evita deleteField y sync colgado). */
function buildTaskSaveFields(dateStr, reminderOn, actH24, actM, totalOffsetMin, offsetSummary, existingTask = null) {
  if (reminderOn) {
    return buildDueAndReminder(dateStr, true, actH24, actM, totalOffsetMin, offsetSummary)
  }
  const dueDate = dateStr ? Timestamp.fromDate(localEndOfDay(dateStr)) : null
  if (existingTask && taskHasReminder(existingTask)) {
    return { dueDate, reminder: null, reminderTime: null }
  }
  return { dueDate }
}

function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={L.ivoryFaint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function initReminderFields(task, today, initTime) {
  if (!taskHasReminder(task)) {
    return {
      reminderOn: false,
      actH12: initTime.h12,
      actAmpm: initTime.ampm,
      actM: today.getMinutes(),
      offD: 0,
      offH: 0,
      offM: 10,
    }
  }

  const offsetMin = task.reminder?.offsetMin ?? 10
  let actH24 = today.getHours()
  let actM = today.getMinutes()

  if (task.reminder?.dueTime && typeof task.reminder.dueTime === 'string') {
    ;[actH24, actM] = task.reminder.dueTime.split(':').map(Number)
  } else if (task.dueDate) {
    const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
    actH24 = d.getHours()
    actM = d.getMinutes()
  } else if (task.reminder?.scheduledAt) {
    const sched = task.reminder.scheduledAt.toDate
      ? task.reminder.scheduledAt.toDate()
      : new Date(task.reminder.scheduledAt)
    const activity = new Date(sched.getTime() + offsetMin * 60_000)
    actH24 = activity.getHours()
    actM = activity.getMinutes()
  }

  const t = from24h(actH24)
  const o = parseOffsetMin(offsetMin)
  return {
    reminderOn: true,
    actH12: t.h12,
    actAmpm: t.ampm,
    actM,
    offD: o.d,
    offH: o.h,
    offM: o.m,
  }
}

export function TaskFormNew({ task, defaultDate, onClose }) {
  const { createTask, updateTask } = useTasks()
  const state = useCoreState()
  const { setHideBottomNav } = useShellChrome()
  const isEdit = !!task
  const reminderLocked = isEdit && taskHasReminder(task)
  const inputRef = useRef(null)
  const keyboardOffset = useKeyboardOffset()
  const [saving, setSaving] = useState(false)

  const groups = useMemo(
    () => Array.from(state.groups.list.values()),
    [state.groups.list],
  )

  const today = useMemo(() => new Date(), [])
  const initTime = useMemo(() => from24h(today.getHours()), [today])
  const initReminder = useMemo(
    () => initReminderFields(task, today, initTime),
    [task, today, initTime],
  )

  const [panel, setPanel] = useState('main')
  const [title, setTitle] = useState(task?.title ?? '')
  const [groupId, setGroupId] = useState(task?.groupId ?? '')
  const [dateStr, setDateStr] = useState(() => {
    if (task?.dueDate) {
      const d = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
    }
    return defaultDate ?? ''
  })
  const [repeatDays, setRepeatDays] = useState(new Set())
  const [showGroup, setShowGroup] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [reminderOn, setReminderOn] = useState(initReminder.reminderOn)
  const [actH12, setActH12] = useState(initReminder.actH12)
  const [actAmpm, setActAmpm] = useState(initReminder.actAmpm)
  const [actM, setActM] = useState(initReminder.actM)
  const [offD, setOffD] = useState(initReminder.offD)
  const [offH, setOffH] = useState(initReminder.offH)
  const [offM, setOffM] = useState(initReminder.offM)

  const actH24 = useMemo(() => to24h(actH12, actAmpm), [actH12, actAmpm])
  const totalOffsetMin = offD * 1440 + offH * 60 + offM
  const offsetSummary = buildOffsetLabel(offD, offH, offM)
  const taskTimeStr = `${actH12}:${pad2(actM)} ${actAmpm}`
  const reminderSummary = reminderOn ? `${taskTimeStr} · ${offsetSummary}` : 'Sin recordatorio'

  const grupoSeleccionado = groups.find(g => g.id === groupId)
  const grupoLabel = grupoSeleccionado ? grupoSeleccionado.name : 'Personal'

  const repeatSummary = repeatDays.size === 0
    ? 'No repetir'
    : `${repeatDays.size} día${repeatDays.size !== 1 ? 's' : ''}`

  const puedeGuardar = !!title.trim() && !saving

  useEffect(() => {
    setHideBottomNav(true)
    return () => setHideBottomNav(false)
  }, [setHideBottomNav])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [])

  function notifyReminderLocked() {
    showToast(REMINDER_EDIT_MSG, 'ℹ️')
  }

  function applyReminderResult({ h24, min, offsetMin }) {
    if (reminderLocked) {
      notifyReminderLocked()
      setPanel('main')
      return
    }
    const t = from24h(h24)
    setActH12(t.h12)
    setActAmpm(t.ampm)
    setActM(min)
    const o = parseOffsetMin(offsetMin)
    setOffD(o.d)
    setOffH(o.h)
    setOffM(o.m)
    setReminderOn(true)
    setPanel('main')
  }

  async function handleSave() {
    if (!title.trim() || saving) return
    if (!dateStr && !isEdit) {
      showToast('Elige una fecha', '⚠️')
      setPanel('date')
      return
    }
    const type = groupId ? 'group' : 'personal'
    const gId = groupId || null
    const trimmed = title.trim()
    setSaving(true)
    try {
      if (isEdit) {
        if (reminderLocked) {
          await updateTask(task, { title: trimmed, groupId: gId, type })
        } else {
          const extra = buildTaskSaveFields(
            dateStr, reminderOn, actH24, actM, totalOffsetMin, offsetSummary, task,
          )
          await updateTask(task, { title: trimmed, groupId: gId, type, ...extra })
          if (repeatDays.size > 0) {
            await Promise.all(
              Array.from(repeatDays).sort().filter(d => d !== dateStr).map(day => {
                const dayExtra = buildTaskSaveFields(
                  day, reminderOn, actH24, actM, totalOffsetMin, offsetSummary,
                )
                return createTask({ title: trimmed, type, groupId: gId, ...dayExtra })
              }),
            )
          }
        }
        showToast('Cambios guardados', '✓')
      } else if (repeatDays.size > 0) {
        await Promise.all(
          Array.from(repeatDays).sort().map(day => {
            const extra = buildTaskSaveFields(day, reminderOn, actH24, actM, totalOffsetMin, offsetSummary)
            return createTask({ title: trimmed, type, groupId: gId, ...extra })
          }),
        )
        showToast('Tareas creadas', '✓')
      } else {
        const extra = buildTaskSaveFields(dateStr, reminderOn, actH24, actM, totalOffsetMin, offsetSummary)
        await createTask({ title: trimmed, type, groupId: gId, ...extra })
        showToast('Tarea creada', '✓')
      }
      onClose()
    } catch (err) {
      console.error('[TaskFormNew] save error:', err)
      showToast('No se pudo guardar', '⚠️')
    } finally {
      setSaving(false)
    }
  }

  function goBack() {
    if (panel === 'main') onClose()
    else setPanel('main')
  }

  return (
    <>
      <div style={s.overlay}>
        <div style={s.screen}>
          {panel !== 'reminder' && (
            <>
              <div style={s.header}>
                <button type="button" onClick={goBack} style={s.btnCancel}>
                  {panel === 'main' ? 'Cancelar' : '‹ Atrás'}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <SyngMark size={24} bordered={false} />
                  <p style={s.headerTitle}>{isEdit ? 'Editar tarea' : 'Nueva tarea'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!puedeGuardar}
                  style={s.btnHeaderSave(puedeGuardar)}
                >
                  {saving ? '…' : isEdit ? 'Guardar' : 'Crear'}
                </button>
              </div>

              <div style={{
                ...s.content,
                paddingBottom: `calc(12px + ${keyboardOffset}px + env(safe-area-inset-bottom))`,
              }}>
                {panel === 'main' && (
                  <>
                    <div style={s.titleCard}>
                      <textarea
                        ref={inputRef}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="¿Qué quieres hacer?"
                        rows={2}
                        style={s.titleInput}
                      />
                    </div>

                    {reminderLocked && (
                      <div style={s.lockBanner}>
                        <p style={s.lockTitle}>Recordatorio activo</p>
                        <p style={s.lockText}>{REMINDER_EDIT_MSG}</p>
                        <p style={s.lockHint}>Puedes editar el título y el grupo.</p>
                      </div>
                    )}

                    <div style={s.optionsCard}>
                      <button type="button" onClick={() => setShowGroup(v => !v)} style={s.optionRow}>
                        <span style={s.optionIcon}>👥</span>
                        <span style={s.optionLabel}>Grupo</span>
                        <span style={{ ...s.optionValue, color: L.ivoryMuted }}>{grupoLabel}</span>
                        <IconChevron />
                      </button>
                      {showGroup && (
                        <div style={s.inlinePicker}>
                          <button type="button" onClick={() => { setGroupId(''); setShowGroup(false) }} style={s.pickerOpt(groupId === '')}>Personal</button>
                          {groups.map(g => (
                            <button key={g.id} type="button" onClick={() => { setGroupId(g.id); setShowGroup(false) }} style={s.pickerOpt(groupId === g.id)}>
                              {g.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <div style={s.divider} />

                      {repeatDays.size === 0 && (
                        <>
                          <OptionRow
                            icon="📅"
                            label="Fecha"
                            value={labelFechaLarga(dateStr)}
                            onClick={() => {
                              if (reminderLocked) { notifyReminderLocked(); return }
                              setPanel('date')
                            }}
                            locked={reminderLocked}
                          />
                          <div style={s.divider} />
                        </>
                      )}

                      <OptionRow
                        icon="🔔"
                        label="Recordatorio"
                        value={reminderSummary}
                        onClick={() => {
                          if (reminderLocked) { notifyReminderLocked(); return }
                          setPanel('reminder')
                        }}
                        accent={reminderOn}
                        locked={reminderLocked}
                      />
                      <div style={s.divider} />
                      <OptionRow
                        icon="🔁"
                        label="Repetir"
                        value={repeatSummary}
                        onClick={() => {
                          if (reminderLocked) { notifyReminderLocked(); return }
                          setShowRepeat(true)
                        }}
                        accent={repeatDays.size > 0}
                        locked={reminderLocked}
                      />
                    </div>

                    {repeatDays.size > 0 && !reminderLocked && (
                      <p style={s.repeatHint}>
                        {isEdit
                          ? `Se crearán ${repeatDays.size} tarea${repeatDays.size !== 1 ? 's' : ''} adicionales.`
                          : `Se crearán ${repeatDays.size} tarea${repeatDays.size !== 1 ? 's' : ''}.`}
                        {' '}
                        <button type="button" onClick={() => setRepeatDays(new Set())} style={s.linkBtn}>Limpiar</button>
                      </p>
                    )}
                  </>
                )}

                {panel === 'date' && !reminderLocked && (
                  <div style={s.subPanel}>
                    <div style={s.card}>
                      <p style={s.cardLabel}>Elegir fecha</p>
                      <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} style={s.dateInput} />
                      <button type="button" style={s.btnPrimary} onClick={() => setPanel('main')}>Listo</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {panel === 'reminder' && !reminderLocked && (
            <ReminderPanel
              dateStr={dateStr || defaultDate || `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`}
              initialH24={actH24}
              initialMin={actM}
              offD={offD}
              offH={offH}
              offM={offM}
              onChangeOffset={(d, h, m) => { setOffD(d); setOffH(h); setOffM(m) }}
              onConfirm={applyReminderResult}
              onSkip={() => { setReminderOn(false); setPanel('main') }}
              onBack={() => setPanel('main')}
            />
          )}
        </div>
      </div>

      {showRepeat && !reminderLocked && (
        <RepeatDayPicker
          selectedDays={repeatDays}
          onChange={days => setRepeatDays(days)}
          onClose={() => setShowRepeat(false)}
          zIndex={5100}
        />
      )}
    </>
  )
}

function OptionRow({ icon, label, value, onClick, accent, locked = false }) {
  return (
    <button type="button" onClick={onClick} style={{ ...s.optionRow, opacity: locked ? 0.55 : 1 }}>
      <span style={s.optionIcon}>{icon}</span>
      <span style={s.optionLabel}>{label}</span>
      <span style={{ ...s.optionValue, color: accent ? L.champagne : L.ivoryMuted }}>{value}</span>
      {!locked && <IconChevron />}
      {locked && <span style={s.lockTag}>Fijo</span>}
    </button>
  )
}

const s = {
  screen: {
    display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
    width: '100%', height: '100%',
    overflow: 'hidden', background: L.ink, color: L.ivory, position: 'relative',
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 5000,
    display: 'flex', flexDirection: 'column',
    background: L.ink,
    overflow: 'hidden',
    WebkitOverflowScrolling: 'touch',
  },
  header: {
    flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center', padding: '12px 16px',
    paddingTop: 'max(12px, env(safe-area-inset-top))',
    borderBottom: `1px solid rgba(196,169,98,0.2)`,
  },
  btnCancel: { background: 'none', border: 'none', fontSize: 15, color: L.ivoryMuted, cursor: 'pointer', textAlign: 'left' },
  headerTitle: { margin: 0, fontSize: 15, fontWeight: 500, color: L.ivory, textAlign: 'center', fontFamily: L.serif },
  content: {
    flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    padding: '12px 16px',
  },
  lockBanner: {
    marginBottom: 12,
    padding: '14px 16px',
    borderRadius: 2,
    border: `1px solid ${L.champagneBorder}`,
    background: L.champagneLight,
  },
  lockTitle: {
    margin: '0 0 6px',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: L.champagne,
  },
  lockText: {
    margin: '0 0 8px',
    fontSize: 13,
    lineHeight: 1.55,
    color: L.ivory,
  },
  lockHint: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.45,
    color: L.ivoryMuted,
  },
  lockTag: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: L.ivoryFaint,
  },
  titleCard: {
    background: L.champagneLight, borderRadius: 2, marginBottom: 12,
    border: `1px solid ${L.champagneBorder}`,
  },
  titleInput: {
    width: '100%', boxSizing: 'border-box', padding: '18px 20px', border: 'none', outline: 'none',
    resize: 'none', background: 'transparent', fontSize: 17, fontWeight: 400,
    color: L.ivory, lineHeight: 1.4, fontFamily: L.serif,
  },
  optionsCard: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 2,
    border: `1px solid ${L.champagneBorder}`, overflow: 'hidden',
  },
  optionRow: {
    display: 'grid', gridTemplateColumns: '28px 1fr auto 20px', alignItems: 'center', gap: 10,
    width: '100%', padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
  },
  optionIcon: { fontSize: 17 },
  optionLabel: { fontSize: 15, fontWeight: 500, color: L.ivory },
  optionValue: { fontSize: 13, fontWeight: 400, textAlign: 'right', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  divider: { height: 1, background: 'rgba(196,169,98,0.12)', marginLeft: 54 },
  inlinePicker: { borderTop: `1px solid rgba(196,169,98,0.12)` },
  pickerOpt: sel => ({
    display: 'block', width: '100%', padding: '12px 16px 12px 54px', border: 'none', textAlign: 'left',
    fontSize: 14, cursor: 'pointer',
    color: sel ? L.champagne : L.ivory,
    fontWeight: sel ? 600 : 400,
    background: sel ? L.champagneLight : 'transparent',
  }),
  subPanel: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
  card: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 2,
    border: `1px solid ${L.champagneBorder}`, padding: '12px 14px 14px',
  },
  cardLabel: {
    margin: '0 0 12px', fontSize: 9, fontWeight: 500, letterSpacing: '0.2em',
    textTransform: 'uppercase', color: L.champagne, textAlign: 'center',
  },
  dateInput: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    WebkitMinLogicalWidth: '100%',
    boxSizing: 'border-box',
    display: 'block',
    padding: 14,
    borderRadius: 2,
    border: `1px solid ${L.champagneBorder}`,
    fontSize: 15,
    marginBottom: 12,
    color: L.ivory,
    background: L.champagneLight,
    fontFamily: 'inherit',
    WebkitAppearance: 'none',
    appearance: 'none',
  },
  btnPrimary: {
    width: '100%', padding: 14, borderRadius: 2, border: `1px solid ${L.ivory}`, cursor: 'pointer',
    background: L.ivory, color: L.ink, fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
  },
  btnHeaderSave: active => ({
    justifySelf: 'end',
    padding: '8px 14px',
    minHeight: 36,
    borderRadius: 2,
    border: `1px solid ${active ? L.ivory : 'rgba(196,169,98,0.2)'}`,
    background: active ? L.ivory : 'rgba(255,255,255,0.06)',
    color: active ? L.ink : L.ivoryFaint,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: active ? 'pointer' : 'default',
  }),
  repeatHint: { margin: '12px 0 0', fontSize: 12, color: L.ivoryMuted, lineHeight: 1.5 },
  linkBtn: {
    background: 'none', border: 'none', color: L.champagne, fontSize: 12,
    cursor: 'pointer', padding: 0, textDecoration: 'underline',
  },
}
