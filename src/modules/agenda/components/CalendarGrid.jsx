/**
 * CalendarGrid — monthly calendar with activity dots.
 * One dot per day with activity. Numbers stay aligned regardless.
 * Colors: #5B3DF6 (primary purple)
 */
const DAYS = ['L','M','M','J','V','S','D']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function CalendarGrid({ viewMonth, selectedDate, daysWithActivity, onSelectDate, onPrevMonth, onNextMonth }) {
  const today = new Date()
  today.setHours(0,0,0,0)

  // Build grid: get first day of month (Monday-based)
  const year  = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  // Monday=0 offset
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function dateKey(d) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }

  function isToday(d) {
    const dt = new Date(year, month, d)
    dt.setHours(0,0,0,0)
    return dt.getTime() === today.getTime()
  }

  function isSelected(d) {
    return selectedDate.getFullYear() === year &&
           selectedDate.getMonth()    === month &&
           selectedDate.getDate()     === d
  }

  return (
    <div style={{ padding: '0 16px 12px' }}>
      {/* Month header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
        <button onClick={onPrevMonth} style={navBtn}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 500, color: '#111' }}>
          {MONTHS_ES[month]} {year}
        </span>
        <button onClick={onNextMonth} style={navBtn}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom: 4 }}>
        {DAYS.map((d,i) => (
          <span key={i} style={{ fontSize:11, color:'#9ca3af', textAlign:'center', fontWeight:500 }}>{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', rowGap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} style={{ height: 44 }} />
          const key     = dateKey(day)
          const hasDot  = !!daysWithActivity[key]
          const todayDay   = isToday(day)
          const selectedDay = isSelected(day)
          return (
            <div
              key={i}
              onClick={() => onSelectDate(new Date(year, month, day))}
              style={{
                height: 44,
                display: 'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                gap: 2, cursor:'pointer',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
              }}
            >
              <div style={{
                width: 26, height: 26,
                borderRadius: '50%',
                background: selectedDay ? '#5B3DF6' : todayDay ? '#EDE9FE' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: selectedDay || todayDay ? 600 : 400,
                  color: selectedDay ? '#fff' : todayDay ? '#5B3DF6' : '#111',
                  lineHeight: 1,
                }}>
                  {day}
                </span>
              </div>
              <div style={{ height: 4 }}>
                {hasDot && !selectedDay && (
                  <div style={{ width: 4, height: 4, borderRadius:'50%', background:'#5B3DF6' }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const navBtn = {
  background:'none', border:'none', fontSize:20,
  color:'#6b7280', cursor:'pointer', padding:'4px 10px',
  borderRadius: 8,
}
