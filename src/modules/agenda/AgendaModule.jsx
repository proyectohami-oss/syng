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

  function handleDaySelect(date) {
    setSelectedDate(date)
    navigate(`/agenda/${toDateKey(date)}`)
  }

  const d     = selectedDate
  const label = `${d.getDate()} de ${MESES[d.getMonth()]}`

  return (
    <div style={screen}>

      {/* Header */}
      <div style={header}>
        <span style={{ fontSize:17, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em', flex:1 }}>Mi Agenda</span>
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

        {/* Leyenda — índigo sistema */}
        <div style={{ display:'flex', gap:16, padding:'0 20px 20px', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#2D3A8C' }} />
            <span style={{ fontSize:12, color:'rgba(13,18,64,0.40)', fontWeight:400 }}>Personal</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22C55E' }} />
            <span style={{ fontSize:12, color:'rgba(13,18,64,0.40)', fontWeight:400 }}>Grupos</span>
          </div>
        </div>

        {/* Resumen del día */}
        <div style={daySummary} onClick={() => navigate(`/agenda/${toDateKey(selectedDate)}`)}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:22 }}>📅</span>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#0D1240', letterSpacing:'-0.01em' }}>{label}</p>
              <p style={{ margin:'3px 0 0', fontSize:12 }}>
                <span style={{ color:'#2D3A8C', fontWeight:500 }}>{pendingCount} pendiente{pendingCount!==1?'s':''}</span>
                <span style={{ color:'rgba(13,18,64,0.20)' }}> · </span>
                <span style={{ color:'#22C55E', fontWeight:500 }}>{completedCount} completada{completedCount!==1?'s':''}</span>
              </p>
            </div>
          </div>
          <span style={{ fontSize:18, color:'rgba(13,18,64,0.22)' }}>›</span>
        </div>
      </div>
    </div>
  )
}

const screen = {
  display: 'flex', flexDirection: 'column', flex: 1,
  minHeight: 0, background: 'transparent', overflow: 'hidden',
}
const header = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 20px 10px',
  paddingTop: 'max(14px, env(safe-area-inset-top))',
  borderBottom: '1px solid rgba(13,18,64,0.07)',
  flexShrink: 0,
  background: 'transparent',
}
const daySummary = {
  margin: '0 16px 24px',
  padding: '14px 16px',
  background: 'rgba(255,255,255,0.80)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.65)',
  boxShadow: '0 4px 16px rgba(13,18,64,0.06), inset 0 1px 0 rgba(255,255,255,0.90)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
}
