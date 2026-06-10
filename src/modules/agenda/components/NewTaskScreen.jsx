import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { T } from '../../../theme'
import { useTasks } from '../../../core/hooks/useTasks'
import { useCoreAuth } from '../../../core/hooks/useCoreData'
import { generateTaskId } from '../../../core/services/tasks.service'
import { scheduleReminder } from '../../../core/services/reminders.service'
import { RepeatCinemaPicker } from './RepeatCinemaPicker'

/* ── Wheel data ── */
const ITEM_H = 28
const ITEM_H_LG = 36
const REPEAT = 20
const WHEEL_H12  = Array.from({ length: 12 }, (_, i) => i + 1)
const WHEEL_AMPM = ['AM', 'PM']
const WHEEL_MINS = Array.from({ length: 60 }, (_, i) => i)
const WHEEL_DAYS = Array.from({ length: 31 }, (_, i) => i)
const WHEEL_OFF_H = Array.from({ length: 24 }, (_, i) => i)

const OFFSET_CHIPS = [
  { label: '10 min', d: 0, h: 0, m: 10 },
  { label: '30 min', d: 0, h: 0, m: 30 },
  { label: '1 hora', d: 0, h: 1, m: 0 },
  { label: 'Exacto', d: 0, h: 0, m: 0 },
]

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

function format12h(h24, min) {
  const { h12, ampm } = from24h(h24)
  return `${h12}:${pad2(min)} ${ampm}`
}

function offsetMatches(d, h, m, chip) {
  return d === chip.d && h === chip.h && m === chip.m
}

function formatFromMin(totalMin) {
  const norm = ((totalMin % 1440) + 1440) % 1440
  const h = Math.floor(norm / 60)
  const m = norm % 60
  return format12h(h, m)
}

function buildOffsetLabel(d, h, m) {
  if (d === 0 && h === 0 && m === 0) return 'A la hora exacta'
  const parts = []
  if (d > 0) parts.push(`${d} día${d !== 1 ? 's' : ''}`)
  if (h > 0) parts.push(`${h} h`)
  if (m > 0) parts.push(`${m} min`)
  return parts.join(' · ') + ' antes'
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

/* ── Scroll wheel column ── */
function WheelCol({ items, value, onChange, label, format, infinite = true, itemHeight = ITEM_H, large = false }) {
  const ref = useRef(null)
  const n = items.length
  const repeated = infinite ? Array.from({ length: REPEAT * n }, (_, i) => items[i % n]) : items
  const midBlock = Math.floor(REPEAT / 2)
  const h = itemHeight

  useEffect(() => {
    const idx = items.indexOf(value)
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = infinite ? (midBlock * n + idx) * h : idx * h
    }
  }, [])

  function handleScroll() {
    if (!ref.current) return
    const newIdx = Math.round(ref.current.scrollTop / h)
    if (infinite) {
      const item = items[((newIdx % n) + n) % n]
      if (newIdx < n || newIdx > repeated.length - n - 1) {
        ref.current.scrollTop = (midBlock * n + ((newIdx % n) + n) % n) * h
      }
      if (item !== value) onChange(item)
    } else {
      const clamped = Math.max(0, Math.min(n - 1, newIdx))
      if (items[clamped] !== value) onChange(items[clamped])
    }
  }

  const hl = { ...wheel.highlight, top: h, height: h, borderRadius: large ? 12 : 8 }
  const fadeTop = { ...wheel.fadeTop, height: h }
  const fadeBot = { ...wheel.fadeBot, height: h }
  const scroller = { ...wheel.scroller, paddingTop: h, paddingBottom: h }
  const itemBase = { ...wheel.item, height: h }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {label && <p style={wheel.label}>{label}</p>}
      <div style={{ position: 'relative', height: h * 3, width: '100%' }}>
        <div style={hl} />
        <div style={fadeTop} />
        <div style={fadeBot} />
        <div ref={ref} className="syng-wheel" onScroll={handleScroll} style={scroller}>
          {repeated.map((item, i) => (
            <div
              key={i}
              onClick={() => {
                onChange(item)
                if (ref.current) ref.current.scrollTop = (midBlock * n + items.indexOf(item)) * h
              }}
              style={{
                ...itemBase,
                fontSize: item === value ? (large ? 22 : 17) : (large ? 15 : 13),
                fontWeight: item === value ? 700 : 400,
                color: item === value ? T.textPrimary : T.textDisabled,
              }}
            >
              {format ? format(item) : item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const wheel = {
  label: { margin: 0, fontSize: 9, fontWeight: 700, color: T.textTertiary, letterSpacing: '0.1em' },
  highlight: {
    position: 'absolute', left: 2, right: 2, top: ITEM_H, height: ITEM_H,
    background: T.primaryLight, borderRadius: 8, pointerEvents: 'none', zIndex: 1,
    boxShadow: 'inset 0 0 0 1px rgba(45,58,140,0.12)',
  },
  fadeTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H,
    background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), transparent)',
    pointerEvents: 'none', zIndex: 2,
  },
  fadeBot: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H,
    background: 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)',
    pointerEvents: 'none', zIndex: 2,
  },
  scroller: {
    height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory',
    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none',
    paddingTop: ITEM_H, paddingBottom: ITEM_H, boxSizing: 'border-box',
  },
  item: {
    height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
    scrollSnapAlign: 'center', cursor: 'pointer', userSelect: 'none',
  },
}

/* ── Icons ── */
function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textDisabled} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function NewTaskScreen() {
  const { date: dateParam } = useParams()
  const navigate = useNavigate()
  const auth = useCoreAuth()
  const { createTask } = useTasks()
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
  const [offM, setOffM] = useState(0)

  const [repeatDays, setRepeatDays] = useState(new Set())
  const [repeatMode, setRepeatMode] = useState('none')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  const actH24 = useMemo(() => to24h(actH12, actAmpm), [actH12, actAmpm])
  const taskTimeStr = `${actH12}:${pad2(actM)} ${actAmpm}`

  const totalOffsetMin = offD * 1440 + offH * 60 + offM
  const notifyTime = useMemo(() => {
    const taskMin = actH24 * 60 + actM
    return formatFromMin(taskMin - totalOffsetMin)
  }, [actH24, actM, totalOffsetMin])

  const offsetSummary = buildOffsetLabel(offD, offH, offM)

  const reminderSummary = reminderOn
    ? `${taskTimeStr} · ${offsetSummary}`
    : 'Sin recordatorio'

  function applyOffsetChip(chip) {
    setOffD(chip.d)
    setOffH(chip.h)
    setOffM(chip.m)
  }

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

  async function handleSave() {
    if (!title.trim()) {
      setTitleError(true)
      setPanel('main')
      titleRef.current?.focus()
      return
    }
    if (!auth?.user?.uid) return

    setSaving(true)
    const trimmed = title.trim()
    const days = repeatDays.size > 0 ? Array.from(repeatDays).sort() : [dateStr]

    try {
      for (const day of days) {
        const taskId = generateTaskId()
        const activityDate = new Date(`${day}T00:00:00`)
        activityDate.setHours(actH24, actM, 0, 0)

        if (reminderOn) {
          const scheduled = new Date(activityDate.getTime() - totalOffsetMin * 60_000)
          const reminderTime = Timestamp.fromDate(scheduled)
          await createTask({
            id: taskId, title: trimmed, type: 'personal', groupId: null,
            dueDate: Timestamp.fromDate(activityDate), reminderTime,
            reminder: {
              scheduledAt: reminderTime, offsetMin: totalOffsetMin,
              dueTime: `${pad2(actH24)}:${pad2(actM)}`,
              label: offsetSummary,
            },
          })
          await scheduleReminder({
            taskId, userId: auth.user.uid, title: trimmed,
            taskTime: activityDate, scheduledAt: scheduled, offsetMinutes: totalOffsetMin,
          })
        } else {
          await createTask({
            id: taskId, title: trimmed, type: 'personal', groupId: null,
            dueDate: Timestamp.fromDate(new Date(`${day}T23:59:59`)), reminder: null,
          })
        }
      }
      navigate(dateParam ? `/agenda/${dateParam}` : '/agenda')
    } catch (err) {
      console.error('[NewTaskScreen] save error:', err)
    } finally {
      setSaving(false)
    }
  }

  function goBack() {
    if (panel === 'main') navigate(-1)
    else setPanel('main')
  }

  return (
    <div style={s.screen}>
      <style>{`.syng-wheel::-webkit-scrollbar{display:none}`}</style>

      {/* Header */}
      <div style={s.header}>
        <button type="button" onClick={goBack} style={s.btnCancel}>
          {panel === 'main' ? 'Cancelar' : '‹ Atrás'}
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={s.headerTitle}>
            {panel === 'main' ? 'Nueva tarea' : panel === 'reminder' ? 'Recordatorio' : panel === 'repeat' ? 'Repetir' : 'Fecha'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!puedeGuardar}
          style={{ ...s.btnCreate, color: puedeGuardar ? T.primary : T.textDisabled }}
        >
          {saving ? '…' : 'Crear'}
        </button>
      </div>

      <div style={s.content}>

        {/* ── MAIN ── */}
        {panel === 'main' && (
          <>
            <div style={{
              ...s.titleCard,
              borderColor: titleError ? T.danger : 'transparent',
              boxShadow: titleError ? `0 0 0 2px ${T.dangerLight}` : T.shadowCard,
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

        {/* ── FECHA ── */}
        {panel === 'date' && (
          <div style={s.subPanel}>
            <div style={s.card}>
              <p style={s.cardLabel}>Elegir fecha</p>
              <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} style={s.dateInput} />
              <button type="button" style={s.btnPrimary} onClick={() => setPanel('main')}>Listo</button>
            </div>
          </div>
        )}

        {/* ── RECORDATORIO — 12 h + AM/PM, sin ambigüedad ── */}
        {panel === 'reminder' && (
          <div style={s.subPanel}>
            <div style={s.card}>
              <p style={s.sectionTitle}>Hora de la actividad</p>
              <p style={s.sectionHint}>Elige hora, minutos y si es AM o PM</p>

              <div style={s.wheelRow}>
                <WheelCol items={WHEEL_H12} value={actH12} onChange={setActH12} label="HORA" large itemHeight={ITEM_H_LG} />
                <span style={{ ...s.colon, paddingBottom: 18, fontSize: 24 }}>:</span>
                <WheelCol items={WHEEL_MINS} value={actM} onChange={setActM} label="MIN" format={v => pad2(v)} large itemHeight={ITEM_H_LG} />
                <WheelCol items={WHEEL_AMPM} value={actAmpm} onChange={setActAmpm} label="PERIODO" infinite={false} large itemHeight={ITEM_H_LG} />
              </div>

              <div style={s.timeHero}>
                <p style={s.timeHeroValue}>{taskTimeStr}</p>
                <p style={s.timeHeroSub}>Hora de tu actividad</p>
              </div>

              <div style={s.sectionDivider} />

              <p style={s.sectionTitle}>¿Cuánto antes quieres el aviso?</p>
              <div style={s.offsetChipRow}>
                {OFFSET_CHIPS.map(chip => {
                  const on = offsetMatches(offD, offH, offM, chip)
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => applyOffsetChip(chip)}
                      style={{ ...s.offsetChip, ...(on ? s.offsetChipOn : {}) }}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>

              <p style={s.sectionHint}>O ajusta con precisión</p>
              <div style={s.wheelRow}>
                <WheelCol items={WHEEL_DAYS} value={offD} onChange={setOffD} label="DÍAS ANTES" />
                <WheelCol items={WHEEL_OFF_H} value={offH} onChange={setOffH} label="HORAS ANTES" format={v => pad2(v)} />
                <WheelCol items={WHEEL_MINS} value={offM} onChange={setOffM} label="MIN ANTES" format={v => pad2(v)} />
              </div>
              <p style={s.offsetSummary}>{offsetSummary}</p>

              <div style={s.previewBox}>
                <p style={s.previewLabel}>Tu aviso llegará a las</p>
                <p style={s.previewTime}>{notifyTime}</p>
                <p style={s.previewSub}>
                  Actividad a las {taskTimeStr} · {offsetSummary.toLowerCase()}
                </p>
              </div>

              <div style={s.actions}>
                <button type="button" style={s.btnPrimary} onClick={() => { setReminderOn(true); setPanel('main') }}>
                  Confirmar recordatorio
                </button>
                <button type="button" style={s.btnGhost} onClick={() => { setReminderOn(false); setPanel('main') }}>
                  Sin recordatorio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── REPETIR ── */}
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
                <button type="button" style={{ ...s.chip, color: T.danger }} onClick={() => applyRepeatPreset('none')}>
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
    </div>
  )
}

function OptionRow({ icon, label, value, onClick, accent }) {
  return (
    <button type="button" onClick={onClick} style={s.optionRow}>
      <span style={s.optionIcon}>{icon}</span>
      <span style={s.optionLabel}>{label}</span>
      <span style={{ ...s.optionValue, color: accent ? T.primary : T.textTertiary }}>{value}</span>
      <IconChevron />
    </button>
  )
}

const s = {
  screen: {
    display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
    overflow: 'hidden', background: 'transparent',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif',
  },
  header: {
    flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center', padding: '12px 16px',
    borderBottom: '1px solid rgba(13,18,64,0.07)',
  },
  btnCancel: { background: 'none', border: 'none', fontSize: T.fontMD, color: T.textSecondary, cursor: 'pointer', textAlign: 'left' },
  headerTitle: { margin: 0, fontSize: T.fontMD, fontWeight: 600, color: T.textPrimary },
  btnCreate: { background: 'none', border: 'none', fontSize: T.fontMD, fontWeight: 600, cursor: 'pointer', textAlign: 'right' },
  content: { flex: 1, minHeight: 0, overflow: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column' },
  subPanel: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
  titleCard: {
    background: T.surface, borderRadius: T.radius2XL, marginBottom: 12,
    boxShadow: T.shadowCard, border: '1px solid transparent',
  },
  titleInput: {
    width: '100%', boxSizing: 'border-box', padding: '18px 20px', border: 'none', outline: 'none',
    resize: 'none', background: 'transparent', fontSize: T.fontLG, fontWeight: 500,
    color: T.textPrimary, lineHeight: 1.4, fontFamily: 'inherit',
  },
  errorMsg: { margin: '0 0 8px', fontSize: T.fontSM, color: T.danger },
  optionsCard: {
    background: T.surface, borderRadius: T.radius2XL, boxShadow: T.shadowCard, overflow: 'hidden',
  },
  optionRow: {
    display: 'grid', gridTemplateColumns: '28px 1fr auto 20px', alignItems: 'center', gap: 10,
    width: '100%', padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
  },
  optionIcon: { fontSize: 17 },
  optionLabel: { fontSize: T.fontMD, fontWeight: 500, color: T.textPrimary },
  optionValue: { fontSize: T.fontSM, fontWeight: 400, textAlign: 'right', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  divider: { height: 1, background: 'rgba(13,18,64,0.06)', marginLeft: 54 },
  card: {
    flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
    background: T.surface, borderRadius: T.radius2XL, boxShadow: T.shadowCard,
    padding: '12px 14px 14px', overflow: 'hidden',
  },
  cardLabel: {
    margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: T.textTertiary, textAlign: 'center',
  },
  sectionTitle: {
    margin: '0 0 2px', fontSize: T.fontSM, fontWeight: 700, color: T.textPrimary, textAlign: 'center',
  },
  sectionHint: {
    margin: '0 0 6px', fontSize: 11, color: T.textTertiary, textAlign: 'center', lineHeight: 1.35,
  },
  sectionDivider: {
    height: 1, background: 'rgba(13,18,64,0.07)', margin: '8px 0 10px', flexShrink: 0,
  },
  wheelRow: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 },
  colon: { fontSize: 20, fontWeight: 300, color: T.textDisabled, paddingBottom: 14 },
  timeHero: {
    textAlign: 'center', padding: '6px 0 2px', flexShrink: 0,
  },
  timeHeroValue: {
    margin: 0, fontSize: 34, fontWeight: 800, color: T.textPrimary,
    letterSpacing: '-0.03em', lineHeight: 1.1,
  },
  timeHeroSub: {
    margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: T.primary,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  offsetChipRow: {
    display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
    marginBottom: 6, flexShrink: 0,
  },
  offsetChip: {
    padding: '8px 14px', borderRadius: T.radiusFull,
    border: `1.5px solid rgba(13,18,64,0.10)`,
    background: T.bgSecondary, color: T.textSecondary,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  offsetChipOn: {
    background: 'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color: '#fff',
    border: 'none', boxShadow: T.shadowPrimary,
  },
  offsetSummary: {
    margin: '2px 0 8px', fontSize: 12, fontWeight: 600, color: T.primary, textAlign: 'center',
  },
  previewBox: {
    textAlign: 'center', padding: '12px 14px', flexShrink: 0,
    background: T.primaryLight, borderRadius: T.radiusLG,
    border: '1px solid rgba(45,58,140,0.12)',
  },
  previewLabel: { margin: 0, fontSize: T.fontSM, color: T.textSecondary, fontWeight: 500 },
  previewTime: { margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: T.primary, letterSpacing: '-0.03em' },
  previewSub: { margin: '6px 0 0', fontSize: 11, color: T.textTertiary, lineHeight: 1.4 },
  actions: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 },
  btnPrimary: {
    width: '100%', padding: 13, borderRadius: T.radiusLG, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color: '#fff',
    fontSize: T.fontMD, fontWeight: 600, boxShadow: T.shadowPrimary,
  },
  btnGhost: {
    width: '100%', padding: 10, border: 'none', background: 'transparent',
    color: T.textTertiary, fontSize: T.fontSM, cursor: 'pointer',
  },
  dateInput: {
    width: '100%', boxSizing: 'border-box', padding: 14, borderRadius: T.radiusMD,
    border: `1.5px solid rgba(13,18,64,0.10)`, fontSize: T.fontMD, marginBottom: 12,
    color: T.textPrimary, background: '#FAFBFE', fontFamily: 'inherit',
  },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 8, flexShrink: 0 },
  chip: {
    padding: '7px 11px', borderRadius: T.radiusFull, border: `1px solid rgba(13,18,64,0.10)`,
    background: T.bgSecondary, color: T.textSecondary, fontSize: 11, fontWeight: 600, cursor: 'pointer',
  },
  chipOn: {
    background: 'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color: '#fff', border: 'none', boxShadow: T.shadowPrimary,
  },
}
