import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Web-only HTML shell for Expo Router.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
        {/* 
            Loading MusicKit at the bottom of the body, just like the working test_musickit.html.
            This ensures the DOM is ready and matches the test environment exactly.
        */}
        <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
      </body>
    </html>
  );
}
