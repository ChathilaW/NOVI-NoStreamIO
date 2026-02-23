'use client'
// Marks this file as a Client Component (runs in the browser)

import { useUser } from "@clerk/nextjs"; // Clerk hook to access the authenticated user on the client
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk"; 
// Stream Video React components and client SDK
import { ReactNode, useEffect, useState } from "react";
// React utilities for typing children, managing state, and side effects
import { tokenProvider } from '@/actions/stream.actions';
// Server Action that securely generates Stream user tokens
import Loading from "@/components/Loading"; // Loading UI shown while Stream client is being initialized

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;


const StreamProvider = ({ children }: { children: ReactNode }) => {
// React provider component that wraps the app with Stream Video context

    const [videoClient, setVideoClient] = 
    useState<StreamVideoClient>(); // Stores the initialized StreamVideoClient instance
    const { user, isLoaded } = useUser(); // Gets the current Clerk user and loading state

    useEffect(() => {
        // Runs when user or isLoaded changes

        if (!isLoaded || !user) return; // Exit early if user data is not ready or user is not logged in
        if (!API_KEY) throw new Error("Stream API key is missing");  // Ensures the Stream API key exists

        const client = new StreamVideoClient({
         // Creates a new Stream Video client instance

            apiKey: API_KEY,
            user: {
              id: user?.id, // Unique user ID (must match the server token user_id)
              name: user.firstName || user?.username || 'User', // Display name fallback logic
              image: user?.imageUrl, // User avatar image

            },
            tokenProvider,
            // Function that fetches a secure token from the server
        });
        setVideoClient(client); // Saves the Stream client in state

        return () => {
        // Cleanup function when component unmounts or dependencies change

            client.disconnectUser(); // Properly disconnects the user from Stream
            setVideoClient(undefined); // Clears the client from state
        };

    },[user,isLoaded]) // Re-run effect when user data or loading state changes

    if (!videoClient) 
        return <Loading />; // Show loading UI until Stream client is ready

    return <StreamVideo client={videoClient}>
                {children}
            </StreamVideo>;
    // Provides Stream Video context to all child components
    
}

export default StreamProvider;
// Exports the provider so it can wrap your app