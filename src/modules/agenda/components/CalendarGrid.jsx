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

      {/* Nav mes */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <button onClick={onPrevMonth} style={navBtn}>‹</button>
        <span style={{ fontSize:16, fontWeight:500, color:'#0D1240', letterSpacing:'-0.01em' }}>
          {MONTHS_ES[month]} {year}
        </span>
        <button onClick={onNextMonth} style={navBtn}>›</button>
      </div>

      {/* Días encabezado */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
        {DAYS_HDR.map((d,i) => (
          <span key={i} style={{
            fontSize: 11, color: 'rgba(13,18,64,0.32)',
            textAlign: 'center', fontWeight: 600,
            letterSpacing: '0.04em',
          }}>{d}</span>
        ))}
      </div>

      {/* Celdas */}
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
              {/* Círculo del número — índigo sistema */}
              <div style={{
                width: 30, height: 30,
                borderRadius: '50%',
                background: selD
                  ? 'linear-gradient(145deg, #3D4FA8, #2D3A8C)'
                  : 'transparent',
                border: (!selD && todayD)
                  ? '2px solid #2D3A8C'
                  : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: selD ? '0 2px 8px rgba(45,58,140,0.32)' : 'none',
                transition: 'all 0.15s ease',
              }}>
                <span style={{
                  fontSize: 13, lineHeight: 1,
                  fontWeight: (selD || todayD) ? 600 : 400,
                  color: selD ? '#fff' : todayD ? '#2D3A8C' : '#0D1240',
                }}>
                  {day}
                </span>
              </div>

              {/* Punto de actividad */}
              <div style={{ height:5, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {hasDot ? (
                  <div style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#2D3A8C',
                    opacity: 1,
                  }} />
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

const navBtn = {
  background: 'none', border: 'none', fontSize: 22,
  color: 'rgba(13,18,64,0.35)',
  cursor: 'pointer', padding: '4px 12px',
  minWidth: 44, minHeight: 44,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent',
}
