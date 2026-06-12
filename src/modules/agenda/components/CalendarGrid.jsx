import { A, L } from '../../../shared/agendaEditorial'

const DAYS_HDR  = ['L','M','M','J','V','S','D']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function CalendarGrid({ viewMonth, selectedDate, daysWithActivity, onSelectDate, onPrevMonth, onNextMonth }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const year  = viewMonth.getFullYear()
  const month = viewMonth.getMonth()

  const firstDay    = new Date(year, month, 1)
  let startOffset   = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const daysInMonth = new Date(year, month+1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function dateKey(d) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }
  function isToday(d) {
    const dt = new Date(year, month, d); dt.setHours(0,0,0,0)
    return dt.getTime() === today.getTime()
  }
  function isSelected(d) {
    return selectedDate.getFullYear()===year &&
           selectedDate.getMonth()===month &&
           selectedDate.getDate()===d
  }

  return (
    <div style={{ padding:'0 16px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <button type="button" onClick={onPrevMonth} style={A.navBtn}>‹</button>
        <span style={{ fontFamily:L.serif, fontSize:18, fontWeight:400, color:L.ivory }}>
          {MONTHS_ES[month]} {year}
        </span>
        <button type="button" onClick={onNextMonth} style={A.navBtn}>›</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
        {DAYS_HDR.map((d,i) => (
          <span key={i} style={{
            fontSize: 11, color: L.ivoryFaint,
            textAlign: 'center', fontWeight: 500,
            letterSpacing: '0.08em',
          }}>{d}</span>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} style={{ height:48 }} />

          const key    = dateKey(day)
          const hasDot = !!daysWithActivity[key]
          const todayD = isToday(day)
          const selD   = isSelected(day)

          return (
            <div
              key={i}
              onClick={() => onSelectDate(new Date(year, month, day))}
              style={{
                height: 48,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                gap: 2,
              }}
            >
              <div style={{
                width: 30, height: 30,
                borderRadius: 2,
                background: selD ? L.champagne : 'transparent',
                border: (!selD && todayD)
                  ? `1px solid ${L.champagne}`
                  : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}>
                <span style={{
                  fontSize: 13, lineHeight: 1,
                  fontWeight: (selD || todayD) ? 600 : 400,
                  color: selD ? L.ink : todayD ? L.champagne : L.ivory,
                }}>
                  {day}
                </span>
              </div>

              <div style={{ height:5, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {hasDot ? (
                  <div style={{ width: 4, height: 4, borderRadius: 1, background: L.champagne }} />
                ) : (
                  <div style={{ width:4, height:4 }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
