'use Client'//that this component must run on the client side
// Stream Video SDK hooks
import { useCall, useCallStateHooks} from "@stream-io/video-react-sdk";
// Next.js router for navigation
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

const EndCallButton =() => {
    // Initialize Next.js router
    const router =useRouter();
    // Get the current call instance
    const call =useCall();
    // Ensure this component is used inside a StreamCall provider
    if(!call)
        throw new Error(
          'usesStreamCall must be used within a StreamCall component.',
        );
    // Extract local participant hook
        const {useLocalParticipant}= useCallStateHooks();
    // Get the current (local) participant
        const localParticipant =useLocalParticipant();
    // Check if the current user is the meeting creator/host
        const isMeetingOwner =
        localParticipant &&
        call.state.createdBy &&
        localParticipant.userId === call.state.createdBy.id;
    // Only the meeting owner can see the End Call button
        if(!isMeetingOwner) return null;
    // Function to end the call for all participants
        const endcall =async () =>{
            // End the call
            await call.endCall();
            // Redirect user to home page
            router.push('/');
        };

        return (
            // Button to end the call for everyone
            <Button onClick={endcall} className="bg-red-500">
                End call for everyone
            </Button>
        );

    }

    export default EndCallButton