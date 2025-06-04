import React from 'react';
import { useRouter } from 'next/router';
import { DocsThemeConfig } from 'nextra-theme-docs';
import { MessageCircle } from 'lucide-react';

const config: DocsThemeConfig = {
  logo: (
    <div className="flex items-center">
      <MessageCircle size={24} className="mr-2" />
      <span className="font-bold text-xl">Whisper Chat</span>
    </div>
  ),
  project: {
    link: 'https://github.com/yourusername/whisper-chat',
  },
  docsRepositoryBase: 'https://github.com/yourusername/whisper-blog',
  footer: {
    text: (
      <span>
        © {new Date().getFullYear()} Whisper Chat. All rights reserved.
      </span>
    ),
  },
  useNextSeoProps() {
    const { asPath } = useRouter();
    return {
      titleTemplate: asPath !== '/' ? '%s – Whisper Chat' : 'Whisper Chat - Secure Real-Time Communication',
      description: 'Whisper is a modern, secure web-based chat application for real-time communication.'
    };
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Whisper is a modern, secure web-based chat application for real-time communication." />
      <meta name="og:title" content="Whisper Chat" />
      <link rel="icon" href="/favicon.ico" />
    </>
  ),
  banner: {
    key: 'whisper-release',
    text: (
      <span>
        🎉 Whisper Chat is now in public beta! Try it today →
      </span>
    ),
  },
  primaryHue: {
    dark: 260,
    light: 230,
  },
  navigation: {
    prev: true,
    next: true,
  },
  darkMode: true,
  nextThemes: {
    defaultTheme: 'system',
  },
};

export default config;