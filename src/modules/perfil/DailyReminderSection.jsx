import { useMemo, useState, useCallback } from 'react'
import { useCoreAuth, useCoreTasks } from '../../core/hooks/useCoreData'
import { updateDailyReminderPrefs, markDailyCalendarSynced } from '../../core/services/users.service'
import {
  collectDaysWithPendingTasks,
  parseDailyReminder,
  formatDayLabel,
  timeToInput,
  parseTimeInput,
} from '../../core/services/dailyReminder.service'
import { syncDailyReminderToCalendar, isIOS } from '../../core/calendar/calendar.service'
import { SyngAvisoIosHelp } from '../../shared/SyngAvisoIosHelp'
import { showToast } from '../../shared/Toast'
import { A, L } from '../../shared/agendaEditorial'

function formatNotifyTime(hour, minute) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export function DailyReminderSection() {
  const auth  = useCoreAuth()
  const tasks = useCoreTasks()
  const uid   = auth.user?.uid

  const prefs = parseDailyReminder(auth.userData)
  const [enabled, setEnabled] = useState(prefs.enabled)
  const [time, setTime]       = useState(timeToInput(prefs.hour, prefs.minute))
  const [saving, setSaving]   = useState(false)
  const [iosHelp, setIosHelp] = useState(null)

  const allTasks = useMemo(() => {
    const personal = Array.from(tasks.personal.values())
    const grouped  = Array.from(tasks.byGroup.values()).flatMap(m => Array.from(m.values()))
    return [...personal, ...grouped].filter(t => !t.isDeleted)
  }, [tasks.personal, tasks.byGroup])

  const upcomingDays = useMemo(
    () => collectDaysWithPendingTasks(allTasks, { daysAhead: 14 }),
    [allTasks],
  )

  const synced = prefs.calendarSynced || {}

  const savePrefs = useCallback(async (next) => {
    if (!uid) return
    setSaving(true)
    try {
      await updateDailyReminderPrefs(uid, next)
    } finally {
      setSaving(false)
    }
  }, [uid])

  async function handleToggle() {
    const next = !enabled
    setEnabled(next)
    const { hour, minute } = parseTimeInput(time)
    await savePrefs({ enabled: next, hour, minute })
  }

  async function handleTimeChange(value) {
    setTime(value)
    const { hour, minute } = parseTimeInput(value)
    await savePrefs({ enabled, hour, minute })
  }

  async function activateDay(day) {
    if (!uid || !enabled) return
    const { hour, minute } = parseTimeInput(time)
    const notifyLabel = formatNotifyTime(hour, minute)
    const title = day.count === 1 ? 'Tu día — 1 tarea' : `Tu día — ${day.count} tareas`

    if (isIOS()) {
      setIosHelp({ day, title, notifyLabel, hour, minute })
      return
    }

    const result = await syncDailyReminderToCalendar({
      uid, dateKey: day.dateKey, taskCount: day.count, hour, minute,
    })
    if (result.ok) {
      await markDailyCalendarSynced(uid, day.dateKey)
      showToast(`Aviso del día agregado — ${formatDayLabel(day.dateKey)}`, '✓')
    }
  }

  async function continueIosCalendar() {
    if (!iosHelp || !uid) return
    const { day, hour, minute } = iosHelp
    setIosHelp(null)
    const result = await syncDailyReminderToCalendar({
      uid, dateKey: day.dateKey, taskCount: day.count, hour, minute,
    })
    if (result.ok) {
      await markDailyCalendarSynced(uid, day.dateKey)
    }
  }

  return (
    <>
      <div style={A.section}>
        <p style={A.sectionLabel}>Recordatorio del día</p>
        <div style={{ padding: '12px 16px 14px' }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: L.ivoryMuted, lineHeight: 1.55 }}>
            Cuando tengas tareas programadas, Syng te avisa por <strong style={{ color: L.ivory }}>Calendario</strong> a la hora que elijas.
          </p>

          <label style={toggleRow}>
            <span style={{ fontSize: 15, color: L.ivory }}>Activar aviso del día</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={handleToggle}
              disabled={saving}
              style={{
                ...toggleBtn,
                background: enabled ? L.champagne : 'rgba(255,255,255,0.08)',
                border: `1px solid ${enabled ? L.champagne : L.champagneBorder}`,
              }}
            >
              <span style={{
                ...toggleKnob,
                transform: enabled ? 'translateX(18px)' : 'translateX(2px)',
                background: enabled ? L.ink : L.ivoryMuted,
              }} />
            </button>
          </label>

          {enabled && (
            <>
              <div style={{ marginTop: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: L.champagne }}>
                  Hora del aviso
                </p>
                <input
                  type="time"
                  value={time}
                  onChange={e => handleTimeChange(e.target.value)}
                  style={timeInput}
                />
                <p style={{ margin: '8px 0 0', fontSize: 12, color: L.ivoryFaint, lineHeight: 1.45 }}>
                  Cada día con tareas pendientes puedes agregar un evento en Calendario a esta hora.
                </p>
              </div>

              {upcomingDays.length === 0 ? (
                <p style={{ margin: '16px 0 0', fontSize: 13, color: L.ivoryFaint, lineHeight: 1.5 }}>
                  No hay días con tareas próximas. Cuando programes algo, aparecerá aquí.
                </p>
              ) : (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: L.champagne }}>
                    Días con tareas ({upcomingDays.length})
                  </p>
                  {upcomingDays.map(day => {
                    const isSynced = !!synced[day.dateKey]
                    return (
                      <div key={day.dateKey} style={dayRow}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, color: L.ivory }}>
                            {formatDayLabel(day.dateKey)}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: L.ivoryMuted }}>
                            {day.count} pendiente{day.count !== 1 ? 's' : ''} · {formatNotifyTime(parseTimeInput(time).hour, parseTimeInput(time).minute)}
                          </p>
                        </div>
                        {isSynced ? (
                          <span style={syncedBadge}>En Calendario</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => activateDay(day)}
                            style={dayBtn}
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {iosHelp && (
        <SyngAvisoIosHelp
          title={iosHelp.title}
          notifyLabel={iosHelp.notifyLabel}
          onContinue={continueIosCalendar}
        />
      )}
    </>
  )
}

const toggleRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const toggleBtn = {
  width: 44,
  height: 26,
  borderRadius: 2,
  padding: 0,
  cursor: 'pointer',
  position: 'relative',
  flexShrink: 0,
  WebkitTapHighlightColor: 'transparent',
}

const toggleKnob = {
  position: 'absolute',
  top: 3,
  width: 18,
  height: 18,
  borderRadius: 2,
  transition: 'transform 0.15s',
}

const timeInput = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  borderRadius: 2,
  border: `1px solid ${L.champagneBorder}`,
  fontSize: 16,
  color: L.ivory,
  fontFamily: 'inherit',
  background: 'rgba(255,255,255,0.04)',
  colorScheme: 'dark',
}

const dayRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${L.champagneBorder}`,
  borderRadius: 2,
}

const dayBtn = {
  padding: '8px 12px',
  borderRadius: 2,
  border: `1px solid ${L.ivory}`,
  background: L.ivory,
  color: L.ink,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  flexShrink: 0,
  WebkitTapHighlightColor: 'transparent',
}

const syncedBadge = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6ee7a0',
  border: '1px solid rgba(52,199,89,0.35)',
  padding: '6px 10px',
  borderRadius: 2,
  flexShrink: 0,
}
