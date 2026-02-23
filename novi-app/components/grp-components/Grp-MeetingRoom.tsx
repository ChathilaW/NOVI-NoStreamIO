'use client'

import { useEffect, useRef, useState } from 'react'
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  SpeakerXMarkIcon,
  UsersIcon,
} from '@heroicons/react/24/solid'
import useCopyLink from '@/hooks/useCopyLinks'
import GroupEndCallButton from './Grp-EndCallButton'
import useParticipants from '@/hooks/useParticipants'
import GroupParticipantsPanel from './Grp-ParticipantsPanel'
import { useUser } from '@clerk/nextjs'
import { useHostStream } from '@/hooks/useHostStream'
import { useParticipantStream } from '@/hooks/useParticipantStream'

interface MeetingRoomProps {
  meetingId: string
  initialCameraOn: boolean
  initialMicOn: boolean
  isHost: boolean
  description?: string
}

const GroupMeetingRoom = ({
  meetingId,
  initialCameraOn,
  initialMicOn,
  isHost,
  description,
}: MeetingRoomProps) => {
  // ── Local cam/mic state ──────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isCameraOn, setIsCameraOn] = useState(initialCameraOn)
  const [isMicOn, setIsMicOn] = useState(initialMicOn)
  const [cameraError, setCameraError] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  const { copied, copyLink } = useCopyLink()
  const { user } = useUser()

  const participantId = user?.id ?? ''
  const participantName =
    user?.fullName ??
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    'Guest'

  const { participants } = useParticipants({
    meetingId,
    participantId,
    name: participantName,
    isHost,
    isCameraOn,
    isMicOn,
  })

  // ── Acquire local camera/mic ─────────────────────────────────────────────
  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        streamRef.current = stream
        setLocalStream(stream)

        stream.getVideoTracks().forEach((t) => (t.enabled = initialCameraOn))
        stream.getAudioTracks().forEach((t) => (t.enabled = initialMicOn))

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Could not access camera/mic:', err)
        setCameraError(true)
      }
    }
    startStream()

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleCamera = () => {
    const next = !isCameraOn
    setIsCameraOn(next)
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next))
  }

  const toggleMic = () => {
    const next = !isMicOn
    setIsMicOn(next)
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next))
  }

  // ── WebRTC — Host side ───────────────────────────────────────────────────
  // Activates only for the host; broadcasts local stream to all participants
  useHostStream({
    meetingId,
    localStream,
    enabled: isHost,
  })

  // ── WebRTC — Participant side ─────────────────────────────────────────────
  // Activates only for non-hosts; receives the host's stream
  const { hostStream } = useParticipantStream({
    meetingId,
    participantId,
    enabled: !isHost && !!participantId,
  })

  // Attach host stream to the full-screen video element (participants only)
  const hostVideoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (!isHost && hostVideoRef.current && hostStream) {
      hostVideoRef.current.srcObject = hostStream
    }
  }, [hostStream, isHost])

  // ── Shared bottom navbar ─────────────────────────────────────────────────
  const BottomNav = (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-3 bg-gray-900/90 backdrop-blur-md
      px-6 py-3 rounded-full shadow-2xl border border-gray-700/50">

      {/* Camera toggle */}
      <button
        onClick={toggleCamera}
        aria-label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
        className="flex flex-col items-center gap-1 group"
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center
            transition-all duration-200 hover:scale-110
            ${isCameraOn
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-red-600 hover:bg-red-700'
            }`}
        >
          {isCameraOn ? (
            <VideoCameraIcon className="w-6 h-6 text-white" />
          ) : (
            <VideoCameraSlashIcon className="w-6 h-6 text-white" />
          )}
        </div>
        <span className="text-[10px] text-gray-400 group-hover:text-gray-200 transition-colors">
          {isCameraOn ? 'Camera' : 'Camera Off'}
        </span>
      </button>

      {/* Mic toggle */}
      <button
        onClick={toggleMic}
        aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        className="flex flex-col items-center gap-1 group"
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center
            transition-all duration-200 hover:scale-110
            ${isMicOn
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-red-600 hover:bg-red-700'
            }`}
        >
          {isMicOn ? (
            <MicrophoneIcon className="w-6 h-6 text-white" />
          ) : (
            <SpeakerXMarkIcon className="w-6 h-6 text-white" />
          )}
        </div>
        <span className="text-[10px] text-gray-400 group-hover:text-gray-200 transition-colors">
          {isMicOn ? 'Mic' : 'Muted'}
        </span>
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-700 mx-1" />

      {/* Participants toggle */}
      <button
        onClick={() => setShowParticipants((prev) => !prev)}
        aria-label="Toggle participants panel"
        className="flex flex-col items-center gap-1 group"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-200 hover:scale-110 relative
          ${showParticipants
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-gray-700 hover:bg-gray-600'}`}>
          <UsersIcon className="w-6 h-6 text-white" />
          {participants.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px]
              font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
              {participants.length > 9 ? '9+' : participants.length}
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 group-hover:text-gray-200 transition-colors">
          People
        </span>
      </button>

      {isHost && <div className="w-px h-8 bg-gray-700 mx-1" />}
      {isHost && <GroupEndCallButton meetingId={meetingId} streamRef={streamRef} />}
    </div>
  )

  // ════════════════════════════════════════════════════════════════
  // HOST VIEW — unchanged from before (only their own cam)
  // ════════════════════════════════════════════════════════════════
  if (isHost) {
    return (
      <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
        {description && (
          <div className="flex-shrink-0 flex justify-center pt-4 z-10">
            <div className="bg-gray-800/80 backdrop-blur-sm text-white text-sm px-5 py-2 rounded-full shadow-lg">
              {description}
            </div>
          </div>
        )}

        <div
          className="flex-1 flex items-stretch justify-center gap-3 px-4 pb-24 pt-3 min-h-0"
          style={{ maxWidth: showParticipants ? '1400px' : '100%', margin: '0 auto', width: '100%' }}>

          {/* Host video tile */}
          <div className="relative flex-1 min-w-0 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {(cameraError || !isCameraOn) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                  <VideoCameraSlashIcon className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">
                  {cameraError ? 'Camera unavailable' : 'Camera is off'}
                </p>
              </div>
            )}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300
                ${isCameraOn && !cameraError ? 'opacity-100' : 'opacity-0'}`}
            />
            {!isMicOn && (
              <div className="absolute bottom-3 left-3 z-20 bg-red-600/90 text-white text-xs
                font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <SpeakerXMarkIcon className="w-3.5 h-3.5" />
                Muted
              </div>
            )}
          </div>

          {showParticipants && (
            <GroupParticipantsPanel
              participants={participants}
              isOpen={showParticipants}
              onClose={() => setShowParticipants(false)}
              copied={copied}
              copyLink={copyLink}
            />
          )}
        </div>

        {BottomNav}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // PARTICIPANT VIEW — host stream full-screen + own cam PiP top-left
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {description && (
        <div className="flex-shrink-0 flex justify-center pt-4 z-10">
          <div className="bg-gray-800/80 backdrop-blur-sm text-white text-sm px-5 py-2 rounded-full shadow-lg">
            {description}
          </div>
        </div>
      )}

      <div
        className="flex-1 flex items-stretch justify-center gap-3 px-4 pb-24 pt-3 min-h-0"
        style={{ maxWidth: showParticipants ? '1400px' : '100%', margin: '0 auto', width: '100%' }}>

        {/* Main area: host stream + PiP own-cam */}
        <div className="relative flex-1 min-w-0 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">

          {/* ── Full-screen: Host webcam ── */}
          {hostStream ? (
            <video
              ref={hostVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            // Waiting for host to connect
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center animate-pulse">
                <VideoCameraIcon className="w-12 h-12 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">Waiting for host video…</p>
            </div>
          )}

          {/* ── PiP: participant's own webcam (top-left) ── */}
          <div className="absolute top-3 left-3 z-20 w-36 h-28 md:w-44 md:h-32
            rounded-xl overflow-hidden shadow-2xl border-2 border-gray-600/60
            bg-gray-900 transition-all duration-300">
            {(cameraError || !isCameraOn) ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gray-800">
                <VideoCameraSlashIcon className="w-7 h-7 text-gray-500" />
                <span className="text-[10px] text-gray-500">
                  {cameraError ? 'No camera' : 'Cam off'}
                </span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}
            {/* Muted badge inside PiP */}
            {!isMicOn && (
              <div className="absolute bottom-1 left-1 bg-red-600/90 text-white text-[9px]
                font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <SpeakerXMarkIcon className="w-2.5 h-2.5" />
                Muted
              </div>
            )}
          </div>

        </div>

        {showParticipants && (
          <GroupParticipantsPanel
            participants={participants}
            isOpen={showParticipants}
            onClose={() => setShowParticipants(false)}
            copied={copied}
            copyLink={copyLink}
          />
        )}
      </div>

      {BottomNav}
    </div>
  )
}

export default GroupMeetingRoom