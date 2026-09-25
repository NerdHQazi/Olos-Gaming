'use client';
import React from 'react';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import SocialRow from '@/components/auth/SocialRow';
import Logo from '@/components/auth/Logo';
import AuthButton from '@/components/auth/AuthButton';

export default function WelcomePage() {
  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center">
        <div className="mb-8">
          <Logo variant="header" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-[#6366F1] to-[#169EFA] bg-clip-text text-transparent">
            OLOS
          </span>
        </h1>
        <p className="text-sm md:text-base text-gray-300 mb-10">
          Play, Complete, Earn, All on the blockchain
        </p>

        <div className="w-full max-w-md space-y-4">
          <Link href="/auth/signup" className="block">
            <AuthButton variant="primary">Create Account</AuthButton>
          </Link>
          <Link href="/auth/signin" className="block">
            <AuthButton variant="outline">Sign In</AuthButton>
          </Link>
        </div>

        <div className="w-full max-w-md mt-10">
          <SocialRow />
        </div>

        <p className="text-xs text-gray-500 mt-8 text-center leading-relaxed">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-[#7135DB] underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#7135DB] underline">Privacy Policy</Link>
        </p>
      </div>
    </AuthCard>
  );
}
