<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'light') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to ensure light mode is default --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "light" }}';
                
                // Remove dark class by default
                document.documentElement.classList.remove('dark');
                
                // Only apply dark mode if explicitly set to dark
                if (appearance === 'dark') {
                    document.documentElement.classList.add('dark');
                }
                
                // Optional: Remove system preference detection to force light mode
                // Comment out the lines below if you want to respect system preference
                /*
                else if (appearance === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
                */
            })();
        </script>

        {{-- Inline style with light mode as default --}}
        <style>
            html {
                background-color: oklch(1 0 0); /* Light background */
            }

            html.dark {
                background-color: oklch(0.145 0 0); /* Dark background */
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        @inertia
    </body>
</html>
