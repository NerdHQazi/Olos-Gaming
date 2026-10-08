import type { Metadata } from "next";
import { Inter, Outfit, Bai_Jamjuree, Space_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import { GlobalAuthHandler } from "@/components/GlobalAuthHandler";
import { Web3Providers } from "./providers";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  weight: ["200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OLOS | Play, Complete, Win",
  description: "Skill-based gaming where you complete 1v1, stake tokens, and win instantly.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialState = cookieToInitialState(
    wagmiConfig,
    (await headers()).get("cookie")
  );

  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${baiJamjuree.variable} ${spaceMono.variable} ${plusJakarta.variable} antialiased`}>
        <Web3Providers initialState={initialState}>
          <AuthProvider>
            <WalletProvider>
              <GlobalAuthHandler />
              {children}
            </WalletProvider>
          </AuthProvider>
        </Web3Providers>
      </body>
    </html>
  );
}