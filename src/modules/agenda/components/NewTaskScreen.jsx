import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { useTasks } from '../../../core/hooks/useTasks'
import { useCoreAuth } from '../../../core/hooks/useCoreData'
import { generateTaskId } from '../../../core/services/tasks.service'
import { useShellChrome } from '../../../shared/ShellChromeContext'
import { RepeatCinemaPicker } from './RepeatCinemaPicker'
import { ReminderPanel } from './ReminderPanel'
import { SyngAvisoSheet } from '../../../shared/SyngAvisoSheet'
import { SyngAvisoIosHelp } from '../../../shared/SyngAvisoIosHelp'
import { showToast } from '../../../shared/Toast'
import { calendarIcsUrl } from '../../../core/calendar/icsToken'
import { openIosCalendarIcs } from '../../../core/calendar/calendar.service'
import { L } from '../../../shared/agendaEditorial'
import { SyngMark } from '../../../shared/SyngLogo'

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre']

function pad2(n) { return String(n).padStart(2, '0') }

function todayKey() {
  const t = new Date()
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`
}

function labelFechaLarga(ds) {
  if (!ds) return 'Hoy'
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

function buildPat(baseDate, dowList, weeks = 4) {
  const set = new Set()
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    if (dowList.includes((d.getDay() + 6) % 7)) {
      set.add(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`)
    }
  }
  return set
}

function dKey(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}` }

function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={L.ivoryFaint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function NewTaskScreen() {
  const { date: dateParam } = useParams()
  const navigate = useNavigate()
  const auth = useCoreAuth()
  const { createTask } = useTasks()
  const { setHideBottomNav } = useShellChrome()
  const titleRef = useRef(null)
  const now = useMemo(() => new Date(), [])

  const [panel, setPanel] = useState('main')
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [dateStr, setDateStr] = useState(dateParam || todayKey())

  const initTime = useMemo(() => from24h(now.getHours()), [now])
  const [reminderOn, setReminderOn] = useState(false)
  const [actH12, setActH12] = useState(initTime.h12)
  const [actAmpm, setActAmpm] = useState(initTime.ampm)
  const [actM, setActM] = useState(now.getMinutes())
  const [offD, setOffD] = useState(0)
  const [offH, setOffH] = useState(0)
  const [offM, setOffM] = useState(10)

  const [repeatDays, setRepeatDays] = useState(new Set())
  const [repeatMode, setRepeatMode] = useState('none')
  const [saving, setSaving] = useState(false)
  const [showAviso, setShowAviso] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [iosCalPayload, setIosCalPayload] = useState(null)
  const [afterSavePath, setAfterSavePath] = useState(null)

  const actH24 = useMemo(() => to24h(actH12, actAmpm), [actH12, actAmpm])
  const taskTimeStr = `${actH12}:${pad2(actM)} ${actAmpm}`
  const totalOffsetMin = offD * 1440 + offH * 60 + offM
  const offsetSummary = buildOffsetLabel(offD, offH, offM)
  const reminderSummary = reminderOn ? `${taskTimeStr} · ${offsetSummary}` : 'Sin recordatorio'

  const avisoNotifyLabel = useMemo(() => {
    const activityDate = new Date(`${dateStr}T00:00:00`)
    activityDate.setHours(actH24, actM, 0, 0)
    const scheduled = new Date(activityDate.getTime() - totalOffsetMin * 60_000)
    return scheduled.toLocaleString('es-MX', {
      weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
    })
  }, [dateStr, actH24, actM, totalOffsetMin])

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setHideBottomNav(panel === 'reminder' || showAviso || showIosHelp)
    return () => setHideBottomNav(false)
  }, [panel, showAviso, showIosHelp, setHideBottomNav])

  const repeatSummary = useMemo(() => {
    if (repeatMode === 'daily') return 'Diario'
    if (repeatMode === 'weekday') return 'Entre semana'
    if (repeatMode === 'weekend') return 'Fines de semana'
    if (repeatDays.size > 0) return `${repeatDays.size} día${repeatDays.size !== 1 ? 's' : ''}`
    return 'No repetir'
  }, [repeatMode, repeatDays])

  const daysInMonth = useMemo(() => {
    const [y, mo] = dateStr.split('-').map(Number)
    return new Date(y, mo, 0).getDate()
  }, [dateStr])

  const cinemaSelectedDays = useMemo(() => {
    const [y, mo] = dateStr.split('-').map(Number)
    const prefix = `${y}-${pad2(mo)}-`
    return Array.from(repeatDays).filter(k => k.startsWith(prefix)).map(k => Number(k.split('-')[2]))
  }, [repeatDays, dateStr])

  const puedeGuardar = title.trim().length > 0 && !saving

  function applyRepeatPreset(mode) {
    const base = new Date(dateStr + 'T12:00:00')
    setRepeatMode(mode)
    if (mode === 'none') { setRepeatDays(new Set()); return }
    if (mode === 'daily') setRepeatDays(buildPat(base, [0, 1, 2, 3, 4, 5, 6]))
    if (mode === 'weekday') setRepeatDays(buildPat(base, [0, 1, 2, 3, 4]))
    if (mode === 'weekend') setRepeatDays(buildPat(base, [5, 6]))
  }

  function toggleCinemaDay(dayNum) {
    const [y, mo] = dateStr.split('-').map(Number)
    if (dayNum > daysInMonth) return
    const key = dKey(y, mo - 1, dayNum)
    setRepeatMode('custom')
    setRepeatDays(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function applyReminderResult({ h24, min, offsetMin }) {
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

  async function commitSave(withSyngAviso) {
    const trimmed = title.trim()
    const days = repeatDays.size > 0 ? Array.from(repeatDays).sort() : [dateStr]
    const dest = dateParam ? `/agenda/${dateParam}` : '/agenda'
    setSaving(true)
    try {
      const { activateSyngAviso, isIOS } = await import('../../../core/calendar/calendar.service')
      let pendingCal = null
      let firstAviso = withSyngAviso

      for (const day of days) {
        const taskId = generateTaskId()
        const activityDate = new Date(`${day}T00:00:00`)
        activityDate.setHours(actH24, actM, 0, 0)

        if (reminderOn) {
          const scheduled = new Date(activityDate.getTime() - totalOffsetMin * 60_000)
          const reminderTime = Timestamp.fromDate(scheduled)
          if (firstAviso) {
            if (isIOS()) {
              pendingCal = {
                taskId, title: trimmed, alarmAt: scheduled, taskTime: activityDate,
              }
            } else {
              const cal = await activateSyngAviso({
                taskId, title: trimmed, alarmAt: scheduled, taskTime: activityDate,
              })
              if (!cal?.ok && cal?.reason === 'too_soon') {
                setSaving(false)
                setShowAviso(false)
                return
              }
            }
            firstAviso = false
          }
          await createTask({
            id: taskId, title: trimmed, type: 'personal', groupId: null,
            dueDate: Timestamp.fromDate(activityDate), reminderTime,
            reminder: {
              scheduledAt: reminderTime, offsetMin: totalOffsetMin,
              dueTime: `${pad2(actH24)}:${pad2(actM)}`,
              label: offsetSummary,
            },
          })
        } else {
          await createTask({
            id: taskId, title: trimmed, type: 'personal', groupId: null,
            dueDate: Timestamp.fromDate(new Date(`${day}T23:59:59`)), reminder: null,
          })
        }
      }

      if (pendingCal) {
        setIosCalPayload(pendingCal)
        setAfterSavePath(dest)
        setShowIosHelp(true)
        setShowAviso(false)
        return
      }

      navigate(dest)
    } catch (err) {
      console.error('[NewTaskScreen] save error:', err)
    } finally {
      setSaving(false)
      setShowAviso(false)
    }
  }

  function continueIosCalendar() {
    if (!iosCalPayload) return
    const { taskId, title, alarmAt, taskTime } = iosCalPayload
    const dest = afterSavePath || (dateParam ? `/agenda/${dateParam}` : '/agenda')

    setShowIosHelp(false)
    setIosCalPayload(null)
    setAfterSavePath(null)
    showToast('Tarea guardada · confirma en Calendario', '✓')

    const icsUrl = calendarIcsUrl({ taskId, title, alarmAt, taskTime })

    try {
      sessionStorage.setItem('syng_ios_cal_return', '1')
      sessionStorage.setItem('syng_ios_cal_dest', dest)
    } catch { /* ignore */ }

    openIosCalendarIcs(icsUrl)
  }

  async function handleSave() {
    if (!title.trim()) {
      setTitleError(true)
      setPanel('main')
      titleRef.current?.focus()
      return
    }
    if (!auth?.user?.uid) return

    if (reminderOn) {
      setShowAviso(true)
      return
    }
    await commitSave(false)
  }

  function goBack() {
    if (panel === 'main') navigate(-1)
    else setPanel('main')
  }

  return (
    <div style={s.screen}>
      {panel !== 'reminder' && (
        <>
          <div style={s.header}>
            <button type="button" onClick={goBack} style={s.btnCancel}>
              {panel === 'main' ? 'Cancelar' : '‹ Atrás'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <SyngMark size={24} />
              <p style={s.headerTitle}>
                {panel === 'main' ? 'Nueva tarea' : panel === 'repeat' ? 'Repetir' : 'Fecha'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!puedeGuardar}
              style={s.btnCreate(puedeGuardar)}
            >
              {saving ? '…' : 'Crear'}
            </button>
          </div>

          <div style={s.content}>
            {panel === 'main' && (
              <>
                <div style={{
                  ...s.titleCard,
                  borderColor: titleError ? '#fca5a5' : L.champagneBorder,
                }}>
                  <textarea
                    ref={titleRef}
                    value={title}
                    onChange={e => { setTitle(e.target.value); if (titleError) setTitleError(false) }}
                    placeholder="¿Qué quieres hacer?"
                    rows={2}
                    style={s.titleInput}
                  />
                </div>
                {titleError && <p style={s.errorMsg}>Escribe un título para la tarea</p>}

                <div style={s.optionsCard}>
                  <OptionRow icon="📅" label="Fecha" value={labelFechaLarga(dateStr)} onClick={() => setPanel('date')} />
                  <div style={s.divider} />
                  <OptionRow icon="🔔" label="Recordatorio" value={reminderSummary} onClick={() => setPanel('reminder')} accent={reminderOn} />
                  <div style={s.divider} />
                  <OptionRow icon="🔁" label="Repetir" value={repeatSummary} onClick={() => setPanel('repeat')} accent={repeatDays.size > 0} />
                </div>
              </>
            )}

            {panel === 'date' && (
              <div style={s.subPanel}>
                <div style={s.card}>
                  <p style={s.cardLabel}>Elegir fecha</p>
                  <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} style={s.dateInput} />
                  <button type="button" style={s.btnPrimary} onClick={() => setPanel('main')}>Listo</button>
                </div>
              </div>
            )}

            {panel === 'repeat' && (
              <div style={s.subPanel}>
                <div style={s.card}>
                  <div style={s.chipRow}>
                    {[
                      { id: 'daily', label: 'Diario' },
                      { id: 'weekday', label: 'Entre semana' },
                      { id: 'weekend', label: 'Fines de semana' },
                    ].map(c => (
                      <button key={c.id} type="button" style={{ ...s.chip, ...(repeatMode === c.id ? s.chipOn : {}) }}
                        onClick={() => applyRepeatPreset(c.id)}>{c.label}</button>
                    ))}
                    <button type="button" style={{ ...s.chip, color: '#fca5a5' }} onClick={() => applyRepeatPreset('none')}>
                      Limpiar
                    </button>
                  </div>
                  <p style={s.cardLabel}>Personalizado — elige tus días</p>
                  <RepeatCinemaPicker
                    selectedDays={cinemaSelectedDays}
                    onToggle={toggleCinemaDay}
                    daysInMonth={daysInMonth}
                    compact
                  />
                  <button type="button" style={{ ...s.btnPrimary, marginTop: 8 }} onClick={() => setPanel('main')}>
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {panel === 'reminder' && (
        <ReminderPanel
          dateStr={dateStr}
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

      {showAviso && (
        <SyngAvisoSheet
          title={title.trim()}
          notifyLabel={avisoNotifyLabel}
          taskTimeLabel={taskTimeStr}
          onActivate={() => commitSave(true)}
          onSkip={() => commitSave(false)}
          onClose={() => setShowAviso(false)}
        />
      )}

      {showIosHelp && (
        <SyngAvisoIosHelp
          title={title.trim()}
          notifyLabel={avisoNotifyLabel}
          taskTimeLabel={taskTimeStr}
          onContinue={continueIosCalendar}
        />
      )}
    </div>
  )
}

function OptionRow({ icon, label, value, onClick, accent }) {
  return (
    <button type="button" onClick={onClick} style={s.optionRow}>
      <span style={s.optionIcon}>{icon}</span>
      <span style={s.optionLabel}>{label}</span>
      <span style={{ ...s.optionValue, color: accent ? L.champagne : L.ivoryMuted }}>{value}</span>
      <IconChevron />
    </button>
  )
}

const s = {
  screen: {
    display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
    overflow: 'hidden', background: L.ink, color: L.ivory, position: 'relative',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif',
  },
  header: {
    flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center', padding: '12px 16px',
    borderBottom: `1px solid rgba(196,169,98,0.2)`,
  },
  btnCancel: { background: 'none', border: 'none', fontSize: 15, color: L.ivoryMuted, cursor: 'pointer', textAlign: 'left' },
  headerTitle: { margin: 0, fontSize: 15, fontWeight: 500, color: L.ivory, textAlign: 'center', fontFamily: L.serif },
  btnCreate: active => ({
    justifySelf: 'end',
    padding: '8px 14px',
    minHeight: 36,
    borderRadius: 2,
    border: `1px solid ${active ? L.ivory : 'rgba(196,169,98,0.2)'}`,
    background: active ? L.ivory : 'rgba(255,255,255,0.06)',
    color: active ? L.ink : L.ivoryFaint,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: active ? 'pointer' : 'default',
  }),
  content: { flex: 1, minHeight: 0, overflow: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column' },
  subPanel: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
  titleCard: {
    background: L.champagneLight, borderRadius: 2, marginBottom: 12,
    border: `1px solid ${L.champagneBorder}`,
  },
  titleInput: {
    width: '100%', boxSizing: 'border-box', padding: '18px 20px', border: 'none', outline: 'none',
    resize: 'none', background: 'transparent', fontSize: 17, fontWeight: 400,
    color: L.ivory, lineHeight: 1.4, fontFamily: L.serif,
  },
  errorMsg: { margin: '0 0 8px', fontSize: 13, color: '#fca5a5' },
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
  optionValue: { fontSize: 13, fontWeight: 400, textAlign: 'right', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  divider: { height: 1, background: 'rgba(196,169,98,0.12)', marginLeft: 54 },
  card: {
    flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
    background: 'rgba(255,255,255,0.04)', borderRadius: 2,
    border: `1px solid ${L.champagneBorder}`,
    padding: '12px 14px 14px', overflow: 'hidden',
  },
  cardLabel: {
    margin: '0 0 4px', fontSize: 9, fontWeight: 500, letterSpacing: '0.2em',
    textTransform: 'uppercase', color: L.champagne, textAlign: 'center',
  },
  btnPrimary: {
    width: '100%', padding: 14, borderRadius: 2, border: `1px solid ${L.ivory}`, cursor: 'pointer',
    background: L.ivory, color: L.ink,
    fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
  },
  dateInput: {
    width: '100%', boxSizing: 'border-box', padding: 14, borderRadius: 2,
    border: `1px solid ${L.champagneBorder}`, fontSize: 15, marginBottom: 12,
    color: L.ivory, background: L.champagneLight, fontFamily: 'inherit',
  },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 8, flexShrink: 0 },
  chip: {
    padding: '7px 11px', borderRadius: 2, border: `1px solid ${L.champagneBorder}`,
    background: 'transparent', color: L.ivoryMuted, fontSize: 11, fontWeight: 500, cursor: 'pointer',
  },
  chipOn: {
    background: L.champagne, color: L.ink, border: `1px solid ${L.champagne}`,
  },
}
