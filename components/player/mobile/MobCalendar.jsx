'use client'
export default function MobCalendar({ el }) {
    const p     = el.props || {}
    const color = p.bgColor || '#F5A623'

    function handleDownload() {
        const startDate = (p.eventDate || '').replace(/-/g, '')
        const startTime = (p.eventTime || '0900').replace(':', '')
        const dtStart   = startDate && startTime ? `${startDate}T${startTime}00` : ''
        const dtEnd     = dtStart   // Same time as placeholder

        const ics = [
            'BEGIN:VCALENDAR', 'VERSION:2.0',
            'BEGIN:VEVENT',
            `SUMMARY:${p.eventTitle || 'Event'}`,
            dtStart ? `DTSTART:${dtStart}` : '',
            dtStart ? `DTEND:${dtEnd}`     : '',
            'END:VEVENT', 'END:VCALENDAR',
        ].filter(Boolean).join('\n')

        const blob = new Blob([ics], { type: 'text/calendar' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url
        a.download = `${p.eventTitle || 'event'}.ics`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <button
            onClick={handleDownload}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                borderRadius: 12, padding: '12px 16px',
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: `0 4px 20px ${color}55`,
                width: '100%', boxSizing: 'border-box',
            }}
        >
            <span style={{ fontSize: 22 }}>📅</span>
            <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>
                    {p.label || 'Add to Calendar'}
                </div>
                {p.eventTitle && (
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{p.eventTitle}</div>
                )}
            </div>
        </button>
    )
}