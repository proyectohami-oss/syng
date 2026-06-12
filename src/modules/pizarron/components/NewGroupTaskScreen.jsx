import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { useTasks } from '../../../core/hooks/useTasks'
import { usePizarronView } from '../hooks/usePizarronView'
import { useCoreState } from '../../../core/hooks/useCoreData'
import { generateTaskId } from '../../../core/services/tasks.service'
import { RepeatDayPicker } from '../../../shared/RepeatDayPicker'
import { ReminderPanel } from '../../agenda/components/ReminderPanel'
import { SyngAvisoSheet } from '../../../shared/SyngAvisoSheet'
import { SyngAvisoIosHelp } from '../../../shared/SyngAvisoIosHelp'
import { showToast } from '../../../shared/Toast'
import { calendarIcsUrl } from '../../../core/calendar/icsToken'
import { openIosCalendarIcs } from '../../../core/calendar/calendar.service'
import { useShellChrome } from '../../../shared/ShellChromeContext'
import { L } from '../../../shared/agendaEditorial'
import { SyngMark } from '../../../shared/SyngLogo'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function pad2(n) { return String(n).padStart(2, '0') }

function labelFechaLarga(ds) {
  if (!ds) return 'Elegir fecha'
  const [y, m, d] = ds.split('-').map(Number)
  return `${d} de ${MESES[m - 1]} de ${y}`
}

function toDateStr(dueDate) {
  if (!dueDate) return ''
  const d = dueDate.toDate ? dueDate.toDate() : new Date(dueDate)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
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

function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={L.ivoryFaint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function buildDueAndReminder(dayKey, reminderOn, actH24, actM, totalOffsetMin, offsetSummary) {
  if (!reminderOn) {
    return {
      dueDate: Timestamp.fromDate(new Date(`${dayKey}T23:59:59`)),
      reminder: null,
      reminderTime: null,
    }
  }
  const [y, mo, d] = dayKey.split('-').map(Number)
  const activityDate = new Date(y, mo - 1, d, actH24, actM, 0, 0)
  const scheduled = new Date(activityDate.getTime() - totalOffsetMin * 60_000)
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

export function NewGroupTaskScreen() {
  const { id: groupId, date, taskId } = useParams()
  const navigate = useNavigate()
  const { createTask, updateTask } = useTasks()
  const { group, tasks } = usePizarronView(groupId)
  const state = useCoreState()
  const groups = Array.from(state.groups.list.values())
  const { setHideBottomNav } = useShellChrome()
  const inputRef = useRef(null)

  const isEdit = !!taskId
  const task = isEdit ? tasks.find(t => t.id === taskId) : null

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`
  const initTime = useMemo(() => from24h(today.getHours()), [])

  const [panel, setPanel] = useState('main')
  const [title, setTitle] = useState('')
  const [dateStr, setDateStr] = useState(date ?? todayStr)
  const [repeatDays, setRepeatDays] = useState(new Set())
  const [ready, setReady] = useState(!isEdit)
  const [reminderOn, setReminderOn] = useState(false)
  const [actH12, setActH12] = useState(initTime.h12)
  const [actAmpm, setActAmpm] = useState(initTime.ampm)
  const [actM, setActM] = useState(today.getMinutes())
  const [offD, setOffD] = useState(0)
  const [offH, setOffH] = useState(0)
  const [offM, setOffM] = useState(10)
  const [targetGroupId, setTargetGroupId] = useState(groupId)
  const [showGroup, setShowGroup] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAviso, setShowAviso] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [iosCalPayload, setIosCalPayload] = useState(null)
  const [afterSavePath, setAfterSavePath] = useState(null)

  const actH24 = useMemo(() => to24h(actH12, actAmpm), [actH12, actAmpm])
  const totalOffsetMin = offD * 1440 + offH * 60 + offM
  const offsetSummary = buildOffsetLabel(offD, offH, offM)
  const taskTimeStr = `${actH12}:${pad2(actM)} ${actAmpm}`
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
    if (isEdit && task) {
      setTitle(task.title ?? '')
      setDateStr(toDateStr(task.dueDate) || todayStr)
      setTargetGroupId(task.groupId || groupId)
      if (task.reminder?.dueTime) {
        setReminderOn(true)
        const [hh, mm] = task.reminder.dueTime.split(':').map(Number)
        const t = from24h(hh)
        setActH12(t.h12)
        setActAmpm(t.ampm)
        setActM(mm)
        const o = parseOffsetMin(task.reminder.offsetMin ?? 0)
        setOffD(o.d)
        setOffH(o.h)
        setOffM(o.m)
      }
      setReady(true)
    }
  }, [task?.id])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [ready])

  useEffect(() => {
    setHideBottomNav(panel === 'reminder' || showRepeat || showAviso || showIosHelp)
    return () => setHideBottomNav(false)
  }, [panel, showRepeat, showAviso, showIosHelp, setHideBottomNav])

  const puedeGuardar = !!title.trim() && !saving

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
    const finalGroupId = isEdit ? targetGroupId : groupId
    const dest = `/pizarron/${finalGroupId || groupId}`
    setSaving(true)
    try {
      const { activateSyngAviso, isIOS } = await import('../../../core/calendar/calendar.service')
      let pendingCal = null
      let firstAviso = withSyngAviso

      async function saveDay(dayKey, existingTaskId) {
        const taskId = existingTaskId || generateTaskId()
        const { dueDate, reminder, reminderTime } = buildDueAndReminder(
          dayKey, reminderOn, actH24, actM, totalOffsetMin, offsetSummary,
        )

        if (reminderOn) {
          const [y, mo, d] = dayKey.split('-').map(Number)
          const activityDate = new Date(y, mo - 1, d, actH24, actM, 0, 0)
          const scheduled = new Date(activityDate.getTime() - totalOffsetMin * 60_000)
          if (firstAviso) {
            if (isIOS()) {
              pendingCal = { taskId, title: trimmed, alarmAt: scheduled, taskTime: activityDate }
            } else {
              const cal = await activateSyngAviso({
                taskId, title: trimmed, alarmAt: scheduled, taskTime: activityDate,
              })
              if (!cal?.ok && cal?.reason === 'too_soon') {
                setSaving(false)
                setShowAviso(false)
                return false
              }
            }
            firstAviso = false
          }
        }

        if (existingTaskId && isEdit && task) {
          await updateTask(task, {
            title: trimmed, dueDate, reminder, reminderTime,
            groupId: finalGroupId, type: finalGroupId ? 'group' : 'personal',
          })
        } else {
          await createTask({
            id: taskId, title: trimmed, type: 'group', groupId: finalGroupId,
            dueDate, reminder, reminderTime,
          })
        }
        return true
      }

      if (isEdit && task) {
        const ok = await saveDay(dateStr, task.id)
        if (ok === false) return
        for (const day of Array.from(repeatDays).sort()) {
          const extraOk = await saveDay(day, null)
          if (extraOk === false) return
        }
      } else if (repeatDays.size > 0) {
        for (const day of Array.from(repeatDays).sort()) {
          const ok = await saveDay(day, null)
          if (ok === false) return
        }
      } else {
        const ok = await saveDay(dateStr, null)
        if (ok === false) return
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
      console.error('[NewGroupTaskScreen] save error:', err)
    } finally {
      setSaving(false)
      setShowAviso(false)
    }
  }

  function continueIosCalendar() {
    if (!iosCalPayload) return
    const { taskId, title: tTitle, alarmAt, taskTime } = iosCalPayload
    const finalGroupId = isEdit ? targetGroupId : groupId
    const dest = afterSavePath || `/pizarron/${finalGroupId || groupId}`

    setShowIosHelp(false)
    setIosCalPayload(null)
    setAfterSavePath(null)
    showToast('Tarea guardada · confirma en Calendario', '✓')

    const icsUrl = calendarIcsUrl({ taskId, title: tTitle, alarmAt, taskTime })

    try {
      sessionStorage.setItem('syng_ios_cal_return', '1')
      sessionStorage.setItem('syng_ios_cal_dest', dest)
    } catch { /* ignore */ }

    openIosCalendarIcs(icsUrl)
  }

  async function handleSave() {
    if (!title.trim()) return
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

  if (isEdit && !ready) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: L.ink }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: `3px solid ${L.champagneBorder}`, borderTopColor: L.champagne,
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    )
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
              <SyngMark size={24} bordered={false} />
              <p style={s.headerTitle}>{isEdit ? 'Editar tarea' : 'Nueva tarea'}</p>
              {group && <span style={s.groupName}>{group.name}</span>}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!puedeGuardar}
              style={s.btnCreate(puedeGuardar)}
            >
              {isEdit ? 'Guardar' : repeatDays.size > 0 ? `Crear ${repeatDays.size}` : 'Crear'}
            </button>
          </div>

          <div style={s.content}>
            {panel === 'main' && (
              <>
                <div style={s.titleCard}>
                  <textarea
                    ref={inputRef}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="¿Qué quieren hacer?"
                    rows={2}
                    style={s.titleInput}
                  />
                </div>

                <div style={s.optionsCard}>
                  {isEdit && (
                    <>
                      <button type="button" onClick={() => setShowGroup(v => !v)} style={s.optionRow}>
                        <span style={s.optionIcon}>👥</span>
                        <span style={s.optionLabel}>Grupo</span>
                        <span style={{ ...s.optionValue, color: L.ivoryMuted }}>
                          {groups.find(g => g.id === targetGroupId)?.name || 'Personal'}
                        </span>
                        <IconChevron />
                      </button>
                      {showGroup && (
                        <div style={s.inlinePicker}>
                          {groups.map(g => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => { setTargetGroupId(g.id); setShowGroup(false) }}
                              style={s.pickerOpt(targetGroupId === g.id)}
                            >
                              {g.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <div style={s.divider} />
                    </>
                  )}
                  <OptionRow icon="📅" label="Fecha" value={labelFechaLarga(dateStr)} onClick={() => setPanel('date')} />
                  <div style={s.divider} />
                  <OptionRow icon="🔔" label="Recordatorio" value={reminderSummary} onClick={() => setPanel('reminder')} accent={reminderOn} />
                  <div style={s.divider} />
                  <OptionRow
                    icon="🔁"
                    label="Repetir"
                    value={repeatDays.size === 0 ? 'No repetir' : `${repeatDays.size} día${repeatDays.size !== 1 ? 's' : ''}`}
                    onClick={() => setShowRepeat(true)}
                    accent={repeatDays.size > 0}
                  />
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

      {showRepeat && (
        <RepeatDayPicker
          selectedDays={repeatDays}
          onChange={days => setRepeatDays(days)}
          onClose={() => setShowRepeat(false)}
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
  },
  header: {
    flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center', padding: '12px 16px',
    borderBottom: `1px solid rgba(196,169,98,0.2)`,
  },
  btnCancel: { background: 'none', border: 'none', fontSize: 15, color: L.ivoryMuted, cursor: 'pointer', textAlign: 'left' },
  headerTitle: { margin: 0, fontSize: 15, fontWeight: 500, color: L.ivory, textAlign: 'center', fontFamily: L.serif },
  groupName: { fontSize: 11, color: L.ivoryFaint, marginTop: 1 },
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
  content: { flex: 1, minHeight: 0, overflow: 'auto', padding: '12px 16px', WebkitOverflowScrolling: 'touch' },
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
  inlinePicker: { borderTop: `1px solid rgba(196,169,98,0.12)` },
  pickerOpt: sel => ({
    display: 'block', width: '100%', padding: '12px 16px 12px 54px', border: 'none', textAlign: 'left',
    fontSize: 14, cursor: 'pointer',
    color: sel ? L.champagne : L.ivory,
    fontWeight: sel ? 600 : 400,
    background: sel ? L.champagneLight : 'transparent',
  }),
  card: {
    flex: 1, display: 'flex', flexDirection: 'column',
    background: 'rgba(255,255,255,0.04)', borderRadius: 2,
    border: `1px solid ${L.champagneBorder}`, padding: '12px 14px 14px',
  },
  cardLabel: {
    margin: '0 0 12px', fontSize: 9, fontWeight: 500, letterSpacing: '0.2em',
    textTransform: 'uppercase', color: L.champagne, textAlign: 'center',
  },
  btnPrimary: {
    width: '100%', padding: 14, borderRadius: 2, border: `1px solid ${L.ivory}`, cursor: 'pointer',
    background: L.ivory, color: L.ink, fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
  },
  dateInput: {
    width: '100%', boxSizing: 'border-box', padding: 14, borderRadius: 2,
    border: `1px solid ${L.champagneBorder}`, fontSize: 15, marginBottom: 12,
    color: L.ivory, background: L.champagneLight, fontFamily: 'inherit',
  },
}
