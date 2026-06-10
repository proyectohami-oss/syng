import { useState, useMemo, useRef, useEffect } from 'react'
import { T } from '../../../theme'

const IOS_ROW = 44
const REPEAT = 20
const WHEEL_H12 = Array.from({ length: 12 }, (_, i) => i + 1)
const WHEEL_MINS = Array.from({ length: 60 }, (_, i) => i)
const WHEEL_DAYS = Array.from({ length: 31 }, (_, i) => i)
const WHEEL_OFF_H = Array.from({ length: 24 }, (_, i) => i)

const AVISO_OPCIONES = [
  { id: 'exact', label: 'Cuando toque', sub: 'El aviso suena a la hora de tu tarea', d: 0, h: 0, m: 0 },
  { id: '10m',   label: '10 minutos antes', sub: 'Un recordatorio rápido', d: 0, h: 0, m: 10 },
  { id: '30m',   label: '30 minutos antes', sub: 'Tiempo para prepararte', d: 0, h: 0, m: 30 },
  { id: '1h',    label: '1 hora antes', sub: 'Con buena anticipación', d: 0, h: 1, m: 0 },
]

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre']

function pad2(n) { return String(n).padStart(2, '0') }

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

function todayKey() {
  const t = new Date()
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`
}

function labelFechaLarga(ds) {
  if (!ds) return 'Hoy'
  const [y, m, d] = ds.split('-').map(Number)
  return `${d} de ${MESES[m - 1]} de ${y}`
}

function dayLabelRelative(dayKey) {
  const today = todayKey()
  if (dayKey === today) return 'hoy'
  const [ty, tm, td] = today.split('-').map(Number)
  const tomorrow = new Date(ty, tm - 1, td + 1)
  const tomorrowKey = `${tomorrow.getFullYear()}-${pad2(tomorrow.getMonth() + 1)}-${pad2(tomorrow.getDate())}`
  if (dayKey === tomorrowKey) return 'mañana'
  return labelFechaLarga(dayKey)
}

function buildOffsetLabel(d, h, m) {
  if (d === 0 && h === 0 && m === 0) return 'Cuando toque'
  const parts = []
  if (d > 0) parts.push(`${d} día${d !== 1 ? 's' : ''}`)
  if (h > 0) parts.push(`${h} hora${h !== 1 ? 's' : ''}`)
  if (m > 0) parts.push(`${m} minuto${m !== 1 ? 's' : ''}`)
  return parts.join(' y ') + ' antes'
}

function buildNotifySummary(dateStr, actH24, actM, totalOffsetMin) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const taskAt = new Date(y, mo - 1, d, actH24, actM, 0, 0)
  const notifyAt = new Date(taskAt.getTime() - totalOffsetMin * 60_000)
  const notifyDayKey = `${notifyAt.getFullYear()}-${pad2(notifyAt.getMonth() + 1)}-${pad2(notifyAt.getDate())}`
  return {
    timeStr: format12h(notifyAt.getHours(), notifyAt.getMinutes()),
    dayLabel: dayLabelRelative(notifyDayKey),
    taskDayLabel: dayLabelRelative(dateStr),
    taskTimeStr: format12h(actH24, actM),
  }
}

function offsetMatches(d, h, m, opt) {
  return d === opt.d && h === opt.h && m === opt.m
}

/* ── iOS wheel column ── */
function IOSWheel({ items, value, onChange, format, infinite = true }) {
  const ref = useRef(null)
  const n = items.length
  const repeated = infinite ? Array.from({ length: REPEAT * n }, (_, i) => items[i % n]) : items
  const mid = Math.floor(REPEAT / 2)

  useEffect(() => {
    const idx = items.indexOf(value)
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = infinite ? (mid * n + idx) * IOS_ROW : idx * IOS_ROW
    }
  }, [])

  function onScroll() {
    if (!ref.current) return
    const idx = Math.round(ref.current.scrollTop / IOS_ROW)
    if (infinite) {
      const item = items[((idx % n) + n) % n]
      if (idx < n || idx > repeated.length - n - 1) {
        ref.current.scrollTop = (mid * n + ((idx % n) + n) % n) * IOS_ROW
      }
      if (item !== value) onChange(item)
    } else {
      const c = Math.max(0, Math.min(n - 1, idx))
      if (items[c] !== value) onChange(items[c])
    }
  }

  return (
    <div style={ios.wheelWrap}>
      <div style={ios.wheelFadeTop} />
      <div style={ios.wheelFadeBot} />
      <div style={ios.wheelSelect} />
      <div ref={ref} className="syng-ios-wheel" onScroll={onScroll} style={ios.wheelScroll}>
        {repeated.map((item, i) => {
          const selected = item === value
          return (
            <div
              key={i}
              onClick={() => {
                onChange(item)
                if (ref.current) ref.current.scrollTop = (mid * n + items.indexOf(item)) * IOS_ROW
              }}
              style={{
                ...ios.wheelItem,
                fontSize: selected ? 23 : 20,
                fontWeight: selected ? 600 : 400,
                color: selected ? '#000' : 'rgba(60,60,67,0.36)',
              }}
            >
              {format ? format(item) : item}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SegmentedAmpm({ value, onChange }) {
  return (
    <div style={ios.segmented}>
      {['AM', 'PM'].map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          style={{
            ...ios.segment,
            ...(value === v ? ios.segmentOn : {}),
          }}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill={T.primary} />
      <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ReminderPanel({
  dateStr,
  initialH24,
  initialMin,
  offD, offH, offM,
  onChangeOffset,
  onConfirm,
  onSkip,
  onBack,
}) {
  const init = from24h(initialH24)
  const [step, setStep] = useState('hora')
  const [h12, setH12] = useState(init.h12)
  const [ampm, setAmpm] = useState(init.ampm)
  const [min, setMin] = useState(initialMin)
  const [advanced, setAdvanced] = useState(false)

  const h24 = useMemo(() => to24h(h12, ampm), [h12, ampm])
  const totalOffset = offD * 1440 + offH * 60 + offM
  const summary = useMemo(
    () => buildNotifySummary(dateStr, h24, min, totalOffset),
    [dateStr, h24, min, totalOffset],
  )
  const offsetLabel = buildOffsetLabel(offD, offH, offM)

  return (
    <div style={ios.root}>
      <style>{`
        .syng-ios-wheel::-webkit-scrollbar{display:none}
        @keyframes syngSlideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
        @keyframes syngFadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* iOS nav */}
      <div style={ios.nav}>
        <button type="button" onClick={step === 'aviso' ? () => setStep('hora') : onBack} style={ios.navBtn}>
          {step === 'aviso' ? 'Hora' : 'Cancelar'}
        </button>
        <div style={ios.navCenter}>
          <p style={ios.navTitle}>{step === 'hora' ? 'Hora de la tarea' : 'Aviso'}</p>
          <div style={ios.dots}>
            <span style={{ ...ios.dot, ...(step === 'hora' ? ios.dotOn : {}) }} />
            <span style={{ ...ios.dot, ...(step === 'aviso' ? ios.dotOn : {}) }} />
          </div>
        </div>
        <button
          type="button"
          onClick={step === 'hora' ? () => setStep('aviso') : () => onConfirm({ h24, min, offsetMin: totalOffset })}
          style={ios.navBtnPrimary}
        >
          {step === 'hora' ? 'Siguiente' : 'Listo'}
        </button>
      </div>

      {step === 'hora' && (
        <div style={{ ...ios.body, animation: 'syngSlideIn 0.28s ease' }}>
          <div style={ios.clockHero}>
            <span style={ios.clockDigits}>{pad2(h12)}</span>
            <span style={ios.clockColon}>:</span>
            <span style={ios.clockDigits}>{pad2(min)}</span>
            <span style={ios.clockAmpm}>{ampm}</span>
          </div>
          <p style={ios.clockCaption}>{summary.taskDayLabel} · tu tarea</p>

          <SegmentedAmpm value={ampm} onChange={setAmpm} />

          <div style={ios.wheelRow}>
            <IOSWheel items={WHEEL_H12} value={h12} onChange={setH12} />
            <IOSWheel items={WHEEL_MINS} value={min} onChange={setMin} format={v => pad2(v)} />
          </div>

          <div style={ios.footer}>
            <button type="button" style={ios.btnFilled} onClick={() => setStep('aviso')}>
              Siguiente
            </button>
            <button type="button" style={ios.btnText} onClick={onSkip}>
              Sin aviso
            </button>
          </div>
        </div>
      )}

      {step === 'aviso' && (
        <div style={{ ...ios.body, animation: 'syngSlideIn 0.28s ease' }}>
          <p style={ios.lead}>Te avisaremos {summary.dayLabel} a las</p>
          <p style={ios.notifyHero}>{summary.timeStr}</p>
          <p style={ios.leadSub}>
            Tu tarea es {summary.taskDayLabel} a las {summary.taskTimeStr}
          </p>

          <div style={ios.grouped}>
            {AVISO_OPCIONES.map((opt, i) => {
              const on = offsetMatches(offD, offH, offM, opt)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeOffset(opt.d, opt.h, opt.m)}
                  style={{
                    ...ios.groupRow,
                    borderBottom: i < AVISO_OPCIONES.length - 1 ? '0.5px solid rgba(60,60,67,0.12)' : 'none',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ ...ios.groupTitle, color: on ? T.primary : '#000' }}>{opt.label}</p>
                    <p style={ios.groupSub}>{opt.sub}</p>
                  </div>
                  {on && <CheckIcon />}
                </button>
              )
            })}
          </div>

          <button type="button" style={ios.advancedBtn} onClick={() => setAdvanced(v => !v)}>
            {advanced ? 'Ocultar ajuste manual' : 'Ajuste manual'}
          </button>

          {advanced && (
            <div style={{ ...ios.grouped, marginTop: 8, animation: 'syngFadeIn 0.2s ease' }}>
              <div style={{ padding: '8px 0' }}>
                <div style={ios.wheelRow}>
                  <IOSWheel items={WHEEL_DAYS} value={offD} onChange={v => onChangeOffset(v, offH, offM)} />
                  <IOSWheel items={WHEEL_OFF_H} value={offH} onChange={v => onChangeOffset(offD, v, offM)} format={v => pad2(v)} />
                  <IOSWheel items={WHEEL_MINS} value={offM} onChange={v => onChangeOffset(offD, offH, v)} format={v => pad2(v)} />
                </div>
                <p style={ios.manualLabel}>Días · Horas · Minutos antes</p>
              </div>
            </div>
          )}

          <div style={ios.footer}>
            <button
              type="button"
              style={ios.btnFilled}
              onClick={() => onConfirm({ h24, min, offsetMin: totalOffset })}
            >
              Listo, avísame
            </button>
            <p style={ios.footerHint}>{offsetLabel}</p>
            <button type="button" style={ios.btnText} onClick={onSkip}>
              Sin aviso
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const ios = {
  root: {
    position: 'absolute', inset: 0, zIndex: 50,
    display: 'flex', flexDirection: 'column',
    background: '#F2F2F7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
    WebkitFontSmoothing: 'antialiased',
  },
  nav: {
    flexShrink: 0, display: 'grid', gridTemplateColumns: '88px 1fr 88px',
    alignItems: 'center', padding: '8px 12px',
    paddingTop: 'max(8px, env(safe-area-inset-top))',
    background: 'rgba(242,242,247,0.92)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '0.5px solid rgba(60,60,67,0.18)',
  },
  navBtn: {
    background: 'none', border: 'none', fontSize: 17, color: T.primary,
    cursor: 'pointer', textAlign: 'left', padding: '6px 4px',
  },
  navBtnPrimary: {
    background: 'none', border: 'none', fontSize: 17, fontWeight: 600,
    color: T.primary, cursor: 'pointer', textAlign: 'right', padding: '6px 4px',
  },
  navCenter: { textAlign: 'center' },
  navTitle: { margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(60,60,67,0.6)' },
  dots: { display: 'flex', gap: 5, justifyContent: 'center', marginTop: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, background: 'rgba(60,60,67,0.22)' },
  dotOn: { background: T.primary, width: 18 },
  body: {
    flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
    padding: '0 20px', overflow: 'hidden',
  },
  clockHero: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'center',
    gap: 2, paddingTop: 20, flexShrink: 0,
  },
  clockDigits: {
    fontSize: 56, fontWeight: 200, color: '#000',
    fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1,
  },
  clockColon: {
    fontSize: 56, fontWeight: 200, color: '#000', padding: '0 2px',
    fontVariantNumeric: 'tabular-nums',
  },
  clockAmpm: {
    fontSize: 20, fontWeight: 600, color: T.primary,
    marginLeft: 8, alignSelf: 'flex-end', paddingBottom: 8,
  },
  clockCaption: {
    margin: '8px 0 16px', textAlign: 'center', fontSize: 15,
    color: 'rgba(60,60,67,0.6)', flexShrink: 0,
  },
  segmented: {
    display: 'flex', margin: '0 auto 12px', padding: 3,
    background: 'rgba(118,118,128,0.12)', borderRadius: 9,
    width: '100%', maxWidth: 280, flexShrink: 0,
  },
  segment: {
    flex: 1, padding: '7px 0', border: 'none', borderRadius: 7,
    background: 'transparent', fontSize: 15, fontWeight: 600,
    color: 'rgba(60,60,67,0.6)', cursor: 'pointer',
  },
  segmentOn: {
    background: '#fff', color: '#000',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },
  wheelRow: {
    display: 'flex', gap: 0, flex: 1, minHeight: 0, maxHeight: 220,
    marginBottom: 8, flexShrink: 1,
  },
  wheelWrap: {
    flex: 1, position: 'relative', height: '100%', minHeight: IOS_ROW * 5, overflow: 'hidden',
  },
  wheelSelect: {
    position: 'absolute', left: 8, right: 8, top: '50%',
    transform: 'translateY(-50%)', height: IOS_ROW,
    background: 'rgba(118,118,128,0.12)', borderRadius: 8,
    pointerEvents: 'none', zIndex: 1,
  },
  wheelFadeTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: IOS_ROW * 2,
    background: 'linear-gradient(to bottom, #F2F2F7 40%, rgba(242,242,247,0))',
    pointerEvents: 'none', zIndex: 2,
  },
  wheelFadeBot: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: IOS_ROW * 2,
    background: 'linear-gradient(to top, #F2F2F7 40%, rgba(242,242,247,0))',
    pointerEvents: 'none', zIndex: 2,
  },
  wheelScroll: {
    height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory',
    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
    paddingTop: IOS_ROW * 2, paddingBottom: IOS_ROW * 2, boxSizing: 'border-box',
  },
  wheelItem: {
    height: IOS_ROW, display: 'flex', alignItems: 'center', justifyContent: 'center',
    scrollSnapAlign: 'center', cursor: 'pointer', userSelect: 'none',
    fontVariantNumeric: 'tabular-nums',
  },
  lead: {
    margin: '20px 0 0', textAlign: 'center', fontSize: 17,
    color: 'rgba(60,60,67,0.6)', flexShrink: 0,
  },
  notifyHero: {
    margin: '4px 0 0', textAlign: 'center', fontSize: 48, fontWeight: 600,
    color: T.primary, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
  leadSub: {
    margin: '6px 0 20px', textAlign: 'center', fontSize: 15,
    color: 'rgba(60,60,67,0.6)', flexShrink: 0, lineHeight: 1.4,
  },
  grouped: {
    background: '#fff', borderRadius: 12, overflow: 'hidden', flexShrink: 0,
  },
  groupRow: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', border: 'none', background: '#fff', cursor: 'pointer',
    gap: 12,
  },
  groupTitle: { margin: 0, fontSize: 17, fontWeight: 400 },
  groupSub: { margin: '2px 0 0', fontSize: 13, color: 'rgba(60,60,67,0.6)' },
  advancedBtn: {
    background: 'none', border: 'none', marginTop: 12, width: '100%',
    fontSize: 15, fontWeight: 500, color: T.primary, cursor: 'pointer',
    padding: '8px 0', flexShrink: 0,
  },
  manualLabel: {
    margin: '4px 0 0', textAlign: 'center', fontSize: 12,
    color: 'rgba(60,60,67,0.45)', letterSpacing: '0.04em',
  },
  footer: {
    marginTop: 'auto', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    flexShrink: 0,
  },
  btnFilled: {
    width: '100%', padding: 16, borderRadius: 14, border: 'none',
    background: T.primary, color: '#fff', fontSize: 17, fontWeight: 600,
    cursor: 'pointer', boxShadow: '0 4px 16px rgba(45,58,140,0.28)',
  },
  btnText: {
    width: '100%', padding: 12, border: 'none', background: 'transparent',
    color: T.primary, fontSize: 17, cursor: 'pointer', marginTop: 4,
  },
  footerHint: {
    margin: '6px 0 0', textAlign: 'center', fontSize: 13,
    color: 'rgba(60,60,67,0.45)',
  },
}
