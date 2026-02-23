'use client'//Tells Next.js this component runs on the client side

//Used to get the currently logged in user from Clerk
import { useUser } from "@clerk/nextjs";
//Stream Video SDK hooks & components
import { DeviceSettings, useCall, useCallStateHooks, VideoPreview } from "@stream-io/video-react-sdk";
import Alert from "./Alert";//Custom alert component
import { useEffect, useState } from "react";//from react hooks
import { Button } from "./ui/button";


const MeetingSetup =({
    setIsSetupComplete,
}: {
    setIsSetupComplete: (value: boolean) => void;    
}) => {
  //Get the logged in user
   const{user} =useUser()
   if(!user) return//if user is not loaded yet,stop rendering
   //Get the current call instance
   const call = useCall();
   //call must exist 
   if (!call) {
       throw new Error(
        'useStreamCall must be used within a streamCall component.',
    );
  }
    //Extract call state hooks
    const{ useCallEndedAt,useCallStartsAt} = useCallStateHooks();

    //Get call start and end times   
    const callStartsAt = useCallStartsAt();
    const callEndedAt  = useCallEndedAt();

    //Check if meeting time has not arrived yet   
    const callTimeNotArrived =
        callStartsAt&& new Date(callStartsAt) > new Date();
    //Check if meeting already ended        
    const callHasEnded = !!callEndedAt;
    //State to toggle mic & camera   
    const [isMicCamToggled, setIsMicCamToggled] = useState(false); 

       //Enable/disable mic and camera based on toggle   
       useEffect(() => {
           if (isMicCamToggled) {
           call.camera.disable();
           call.microphone.disable();
           } else {
            call.camera.enable();
            call.microphone.enable();
           }
       }, [isMicCamToggled, call.camera, call.microphone]);

       //If meeting hasn't started yet    
        if (callTimeNotArrived)
           return (
             <Alert
               title={'Your Meeting has not started yet.It is scheduled for ${CallStartsAt.toLocaleString()}'}
             />
          );

       //If meeting has ended    
        if (callHasEnded)
           return (
            <Alert
              title="The call has been ended by the host"
              iconUrl="/assets/call-ended.svg"
            />
          );

    return(
        <div className="flex h-screen w-full flex-col items-center justify-center gap-3
        text-black">
        <h1 className="text-center text-2x1 font-bold">Meeting Setup</h1>
          <VideoPreview/>
        <div className="flex h-16 items-center justify-center gap-3">
            <label className="flex items-center justify-center gap-2 font-medium">
                <input
                type="checkbox"
                checked={isMicCamToggled}
                onChange={(e)=> setIsMicCamToggled(e.target.checked)}
                />
                join with mic and camera off
            </label>
            <DeviceSettings/>
            
            </div> 
            <Button
              className="rounded-3x1 bg-blue-500 p-6 hover:bg-blue-800 hover:scale-125
              transition ease-in-out delay-150 duration-300"
              onClick={() =>{
            //Join the call    
                call.join();
            //Update call members(add current user)    
                call.updateCallMembers({
                   update_members: [{user_id:user.id}], 

                })
                
                setIsSetupComplete(true);
              }}
            >
                Join meeting
            </Button>     
            </div>
    )
    

}

export default MeetingSetup