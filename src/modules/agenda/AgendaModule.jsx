import { useNavigate }   from 'react-router-dom'
import { useAgendaView } from './hooks/useAgendaView'
import { CalendarGrid }  from './components/CalendarGrid'
import { SyncBadge }     from '../../shared/SyncBadge'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export function AgendaModule() {
  const navigate = useNavigate()
  const { selectedDate, setSelectedDate, viewMonth, prevMonth, nextMonth, daysWithActivity, pendingCount, completedCount } = useAgendaView()

  // Single tap on day → go directly to day view
  function handleDaySelect(date) {
    setSelectedDate(date)
    navigate(`/agenda/${toDateKey(date)}`)
  }

  const d     = selectedDate
  const label = `${d.getDate()} de ${MESES[d.getMonth()]}`

  return (
    <div style={screen}>
      <div style={header}>
        <span style={{ fontSize:17, fontWeight:600, color:'#111', flex:1 }}>Mi Agenda</span>
        <SyncBadge />
      </div>

      <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
        <CalendarGrid
          viewMonth={viewMonth}
          selectedDate={selectedDate}
          daysWithActivity={daysWithActivity}
          onSelectDate={handleDaySelect}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        <div style={{ display:'flex', gap:16, padding:'0 20px 20px', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#5B3DF6' }} />
            <span style={{ fontSize:12, color:'#9ca3af' }}>Personal</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22C55E' }} />
            <span style={{ fontSize:12, color:'#9ca3af' }}>Grupos</span>
          </div>
        </div>

        {/* Day summary — passive, tap on calendar to enter */}
        <div style={daySummary} onClick={() => navigate(`/agenda/${toDateKey(selectedDate)}`)}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>📅</span>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#111' }}>{label}</p>
              <p style={{ margin:'2px 0 0', fontSize:12 }}>
                <span style={{ color:'#5B3DF6', fontWeight:500 }}>{pendingCount} pendiente{pendingCount!==1?'s':''}</span>
                <span style={{ color:'#d1d5db' }}> · </span>
                <span style={{ color:'#22C55E', fontWeight:500 }}>{completedCount} completada{completedCount!==1?'s':''}</span>
              </p>
            </div>
          </div>
          <span style={{ fontSize:16, color:'#9ca3af' }}>›</span>
        </div>
      </div>
      {/* NO + button here — tap on day in calendar goes to day view */}
    </div>
  )
}

const screen    = { display:'flex', flexDirection:'column', flex:1, minHeight:0, background:'#fff', overflow:'hidden' }
const header    = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 10px', paddingTop:'max(14px, env(safe-area-inset-top))', borderBottom:'1px solid #f3f4f6', flexShrink:0 }
const daySummary= { margin:'0 16px 24px', padding:'12px 16px', background:'#fafafa', borderRadius:12, border:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', WebkitTapHighlightColor:'transparent' }
