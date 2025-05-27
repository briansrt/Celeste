import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';

export default function Login(){
    return (
        <div className="flex flex-col min-h-screen bg-gray-100 justify-center items-center">
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <SignIn fallbackRedirectUrl={"/Celeste"} signUpUrl="/Register" />
            </main>
        </div>
    );
}