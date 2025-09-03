'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useConversations } from '@/context/conversations-context'
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

const Calendar = () => {
  const { conversations } = useConversations()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Reunión de equipo',
      date: new Date(2025, 0, 15),
      time: '10:00',
      color: 'bg-blue-500',
      description: 'Reunión semanal del equipo de desarrollo'
    },
    {
      id: 2,
      title: 'Presentación cliente',
      date: new Date(2025, 0, 18),
      time: '14:00',
      color: 'bg-green-500',
      description: 'Presentación del proyecto al cliente'
    }
  ])

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    description: '',
    color: 'bg-blue-500'
  })

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Generar días del mes
  const generateCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()

    const days = []

    // Días del mes anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDayOfMonth)
      date.setDate(date.getDate() - i - 1)
      days.push({ date, isCurrentMonth: false })
    }

    // Días del mes actual
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day)
      days.push({ date, isCurrentMonth: true })
    }

    // Días del mes siguiente para completar la cuadrícula
    const remainingDays = 42 - days.length // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({ date, isCurrentMonth: false })
    }

    return days
  }, [currentDate])

  const conversationEvents = conversations
    .filter(c => c.messages.length > 0) // Solo las que tienen mensajes
    .map(c => ({
      id: c.id,
      title: c.title || 'Conversación',
      date: c.messages[0]?.timestamp ? new Date(c.messages[0].timestamp) : new Date(), // Usa la fecha del primer mensaje
      time: '', // Puedes dejarlo vacío o calcularlo si tienes la hora
      color: 'bg-purple-500', // O el color que prefieras para distinguirlas
      description: `Conversación con ${c.title || 'sin título'}`
    }))
  const allEvents = [...events, ...conversationEvents]

  // Obtener eventos para una fecha específica
  const getEventsForDate = (date: Date) => {
    return allEvents.filter(event =>
      event.date.toDateString() === date.toDateString()
    )
  }

  // Navegar meses
  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  // Ir a hoy
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Manejar clic en día
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setIsDialogOpen(true)
  }

  // Agregar evento
  const handleAddEvent = () => {
    if (!newEvent.title || !selectedDate) return

    const event = {
      id: Date.now(),
      title: newEvent.title,
      date: new Date(selectedDate),
      time: newEvent.time,
      color: newEvent.color,
      description: newEvent.description
    }

    setEvents(prev => [...prev, event])
    setNewEvent({ title: '', time: '', description: '', color: 'bg-blue-500' })
    setIsDialogOpen(false)
  }

  // Eliminar evento
  const handleDeleteEvent = (eventId: number) => {
    setEvents(prev => prev.filter(event => event.id !== eventId))
  }

  const colorOptions = [
    { label: 'Azul', value: 'bg-blue-500' },
    { label: 'Verde', value: 'bg-green-500' },
    { label: 'Rojo', value: 'bg-red-500' },
    { label: 'Amarillo', value: 'bg-yellow-500' },
    { label: 'Púrpura', value: 'bg-purple-500' },
    { label: 'Rosa', value: 'bg-pink-500' }
  ]

  return (
    <div className="p-6 h-screen flex flex-col justify-center">
      {/* Header */}
      <div className="flex items-end justify-center mb-6">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-300">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(-1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={goToToday}
            className="text-sm"
          >
            Hoy
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-300 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {generateCalendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day.date)
              const isToday = day.date.toDateString() === today.toDateString()

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-black transition-colors border-gray-600 ${
                    !day.isCurrentMonth ? 'bg-primary' : 'bg-secondary'
                  }`}
                  onClick={() => handleDayClick(day.date)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      !day.isCurrentMonth
                        ? 'text-gray-400'
                        : isToday
                          ? 'text-white bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center'
                          : 'text-gray-300'
                    }`}>
                      {day.date.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs text-white px-2 py-1 rounded ${event.color} cursor-pointer hover:opacity-80`}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="truncate">{event.time} {event.title}</span>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayEvents.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Nuevo evento - {selectedDate?.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Título del evento"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción del evento (opcional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-full ${color.value} ${
                      newEvent.color === color.value ? 'ring-2 ring-gray-400 ring-offset-2' : ''
                    }`}
                    onClick={() => setNewEvent(prev => ({ ...prev, color: color.value }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddEvent} disabled={!newEvent.title}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Events Summary */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Próximos eventos</h2>
        <div className="space-y-2">
          {events
            .filter(event => event.date >= today)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5)
            .map(event => (
              <Card key={event.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${event.color}`} />
                    <div>
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{event.date.toLocaleDateString('es-ES')}</span>
                        {event.time && (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>{event.time}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}

export default Calendar
