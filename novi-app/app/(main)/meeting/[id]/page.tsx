'use client'

import GroupMeetingRoom from "@/components/grp-components/Grp-MeetingRoom";
import GroupMeetingSetup from "@/components/grp-components/Grp-MeetingSetup";
import Loading from "@/components/Loading";
import useMeetingStatus from "@/hooks/useMeetingStatus";
import { useUser } from "@clerk/nextjs";
import { HomeIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MeetingPage = () => {
    const { id } = useParams<{ id: string }>()
    const { isLoaded, user } = useUser()
    const router = useRouter()

    const [isSetupComplete, setIsSetupComplete] = useState(false)
    const [cameraOn, setCameraOn] = useState(true)
    const [micOn, setMicOn] = useState(true)
    const [isHost, setIsHost] = useState(false)
    const [description, setDescription] = useState('')
    const [showEnded, setShowEnded] = useState(false)

    const { isEnded } = useMeetingStatus(id ?? '')

    // When the meeting is ended by the host, show the ended screen
    useEffect(() => {
        if (isEnded) {
            setShowEnded(true)
        }
    }, [isEnded])

    useEffect(() => {
        if (!id || !user) return
        // Check if the current user created this meeting (host)
        const hostId = sessionStorage.getItem(`meeting_${id}_host`)
        const desc = sessionStorage.getItem(`meeting_${id}_description`) ?? ''
        setIsHost(hostId === user.id)
        setDescription(desc)
    }, [id, user])

    if (!isLoaded) return <Loading />

    if (!id) return (
        <p className="text-center text-3xl font-bold text-white mt-20">
            Invalid meeting link
        </p>
    )

    // Meeting ended screen — shown to all participants (and host if they somehow land here)
    if (showEnded) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4">
                <div className="flex flex-col items-center gap-5 text-center max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
                        <XMarkIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Meeting ended by the host</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white
                            font-bold px-8 py-3 rounded-2xl transition-all duration-200 hover:scale-105"
                    >
                        <HomeIcon className="w-5 h-5" />
                        Go to Home
                    </button>
                </div>
            </div>
        )
    }


    const handleJoin = (camOn: boolean, micOn: boolean) => {
        setCameraOn(camOn)
        setMicOn(micOn)
        setIsSetupComplete(true)
    }

    return (
        <main className="h-screen w-full">
            {!isSetupComplete ? (
                <GroupMeetingSetup
                    onJoin={handleJoin}
                    description={description}
                />
            ) : (
                <GroupMeetingRoom
                    meetingId={id}
                    initialCameraOn={cameraOn}
                    initialMicOn={micOn}
                    isHost={isHost}
                    description={description}
                />
            )}
      </main>
    )
}

export default MeetingPage