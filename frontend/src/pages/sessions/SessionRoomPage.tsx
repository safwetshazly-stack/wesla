import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRoomToken } from '../../hooks/useApi'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Send } from 'lucide-react'
import { PageLoader } from '../../components/ui'
import { getSocket } from '../../lib/socket'
import { useAuthStore } from '../../stores/auth.store'

export default function SessionRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: room, isLoading } = useRoomToken(sessionId!)

  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!room) return
    startMedia()
    joinRoom()
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      clearInterval(timerRef.current)
    }
  }, [room])

  async function startMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: room?.sessionType !== 'CHAT' && room?.sessionType !== 'VOICE',
        audio: room?.sessionType !== 'CHAT',
      })
      streamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
    } catch (e) {
      console.warn('[Room] Media access denied:', e)
    }
  }

  function joinRoom() {
    const socket = getSocket()
    socket.emit('join-room', { roomId: room?.roomId, userId: user?.id })
    socket.on('chat-message', (msg: any) => setMessages((m) => [...m, msg]))
  }

  function sendMessage() {
    if (!msgInput.trim()) return
    const socket = getSocket()
    const msg = {
      sender: user?.fullName || 'أنت',
      text: msgInput,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    }
    socket.emit('chat-message', { roomId: room?.roomId, ...msg })
    setMessages((m) => [...m, msg])
    setMsgInput('')
  }

  function toggleMic() {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn))
    setMicOn(!micOn)
  }

  function toggleCam() {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn))
    setCamOn(!camOn)
  }

  function endCall() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    navigate(`/sessions/${sessionId}`)
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (isLoading) return <PageLoader />

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/60 backdrop-blur-sm">
        <div>
          <p className="text-white font-semibold text-sm">جلسة {room?.sessionType === 'VOICE' ? 'صوتية' : room?.sessionType === 'VIDEO' ? 'فيديو' : 'نصية'}</p>
          <p className="text-green-400 text-xs font-mono">{formatTime(elapsed)} / {formatTime((room?.durationMinutes || 60) * 60)}</p>
        </div>
        <button
          onClick={() => setShowChat(!showChat)}
          className="relative p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
        >
          <MessageSquare size={20} />
          {messages.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Video area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {/* No video placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-4xl text-white opacity-40">
            👤
          </div>
        </div>
        {/* Local video (PiP) */}
        {room?.sessionType === 'VIDEO' && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 left-4 w-28 h-40 object-cover rounded-2xl border-2 border-white/20 shadow-lg"
          />
        )}
      </div>

      {/* Chat sidebar */}
      {showChat && (
        <div className="absolute left-0 top-0 bottom-0 w-80 bg-gray-900/95 flex flex-col border-r border-gray-700">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-white font-semibold text-sm">المحادثة</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`${m.sender === user?.fullName ? 'text-left' : ''}`}>
                <p className="text-xs text-gray-400 mb-1">{m.sender} · {m.time}</p>
                <div className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-xs ${
                  m.sender === user?.fullName
                    ? 'bg-wasla-green text-white'
                    : 'bg-gray-700 text-white'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-700 flex gap-2">
            <input
              className="flex-1 bg-gray-700 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-400"
              placeholder="اكتب رسالة..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="p-2 bg-wasla-green text-white rounded-xl hover:bg-wasla-teal transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-5 bg-gray-800/60 backdrop-blur-sm">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
        >
          {micOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
        {room?.sessionType === 'VIDEO' && (
          <button
            onClick={toggleCam}
            className={`p-4 rounded-full transition-all ${camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
          >
            {camOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        )}
        <button
          onClick={endCall}
          className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all scale-110"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  )
}
