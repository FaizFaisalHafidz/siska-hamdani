<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Force light mode only - no dark mode support --}}
        <script>
            (function() {
                // Always remove dark class and keep light mode only
                document.documentElement.classList.remove('dark');
                
                // Prevent any dark mode activation
                const style = document.createElement('style');
                style.textContent = `
                    html, html.dark {
                        background-color: white !important;
                        color: rgb(17, 24, 39) !important;
                    }
                `;
                document.head.appendChild(style);
            })();
        </script>

        {{-- Light mode only styles --}}
        <style>
            html {
                background-color: white;
                color: rgb(17, 24, 39);
            }
            
            /* Override any dark mode styles */
            html.dark {
                background-color: white !important;
                color: rgb(17, 24, 39) !important;
            }
            
            /* Ensure all elements stay light */
            * {
                color-scheme: light only;
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
    <body class="font-sans antialiased bg-white text-gray-900">
        @inertia
    </body>
</html>
