import React from 'react';
import { SignUp } from '@clerk/clerk-react';

export default function Register() {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100 justify-center items-center">
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <SignUp fallbackRedirectUrl={"/Celeste"} signInUrl='/'/>
            </main>
        </div>
    );
}