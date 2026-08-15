import { useEffect, useRef } from "react";

interface GoogleSignInButtonProps {
  clientId: string;

  loginUri: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;

    login_uri: string;

    ux_mode: "redirect";
  }) => void;

  renderButton: (
    parent: HTMLElement,

    options: {
      type: "standard";

      theme: "outline";

      size: "large";

      text: "signin_with";

      shape: "rectangular";

      logo_alignment: "left";

      width: number;

      locale: string;
    },
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/**
 * Merender widget Google Identity Services.
 *
 * useEffect diperlukan karena Google Sign-In adalah widget eksternal
 * yang memanipulasi DOM melalui JavaScript API.
 */
export function GoogleSignInButton({ clientId, loginUri }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
        return;
      }

      /*
       * Bersihkan hasil render sebelumnya.
       * Berguna saat React StrictMode menjalankan effect ulang
       * pada development.
       */
      buttonRef.current.replaceChildren();

      window.google.accounts.id.initialize({
        client_id: clientId,

        login_uri: loginUri,

        /*
         * Kita memakai redirect mode agar credential
         * langsung dikirim Google ke server endpoint,
         * bukan ditangani JavaScript client.
         */
        ux_mode: "redirect",
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",

        theme: "outline",

        size: "large",

        text: "signin_with",

        shape: "rectangular",

        logo_alignment: "left",

        width: 360,

        locale: "id",
      });
    };

    /*
     * Kalau GIS sudah pernah dimuat, langsung render.
     */
    if (window.google?.accounts?.id) {
      renderButton();

      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", renderButton);

      return () => {
        cancelled = true;

        existingScript.removeEventListener("load", renderButton);
      };
    }

    const script = document.createElement("script");

    script.id = GOOGLE_SCRIPT_ID;

    script.src = GOOGLE_SCRIPT_SRC;

    script.async = true;

    script.defer = true;

    script.addEventListener("load", renderButton);

    script.addEventListener("error", () => {
      console.error("[Google Identity] Gagal memuat Google Identity Services.");
    });

    document.head.appendChild(script);

    return () => {
      cancelled = true;

      script.removeEventListener("load", renderButton);
    };
  }, [clientId, loginUri]);

  return (
    <div className="flex min-h-11 justify-center">
      <div ref={buttonRef} className="flex justify-center" />
    </div>
  );
}
