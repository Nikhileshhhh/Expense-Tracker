interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    }
  }
}

export const initializeGoogleAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId || clientId === 'your-google-client-id-here') {
      reject(new Error('Google Client ID not configured'));
      return;
    }

    if (typeof window.google !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Sign-In script'));
    };

    document.head.appendChild(script);
  });
};

export const renderGoogleButton = (
  element: HTMLElement,
  callback: (user: GoogleUser) => void
): void => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId || clientId === 'your-google-client-id-here') {
    element.innerHTML = `
      <div class="w-full bg-gray-600 text-gray-400 py-3 px-4 rounded-lg font-semibold border border-gray-500 text-center">
        <p class="text-sm">Google Sign-In Not Configured</p>
        <p class="text-xs mt-1">Please add VITE_GOOGLE_CLIENT_ID to .env file</p>
      </div>
    `;
    return;
  }

  if (typeof window.google === 'undefined') {
    element.innerHTML = `
      <div class="w-full bg-gray-600 text-gray-400 py-3 px-4 rounded-lg font-semibold border border-gray-500 text-center">
        <p class="text-sm">Loading Google Sign-In...</p>
      </div>
    `;
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: GoogleCredentialResponse) => {
      try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));

        const user: GoogleUser = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        };

        callback(user);
      } catch (error) {
        console.error('Failed to parse Google response:', error);
      }
    },
    auto_select: false,
    ux_mode: 'popup' // ✅ Correct mode for SPA
  });

  window.google.accounts.id.renderButton(element, {
    theme: 'outline',
    size: 'large',
    width: '100%',
    text: 'continue_with',
    shape: 'rectangular'
  });
};

export const signOutGoogle = (): void => {
  if (typeof window.google !== 'undefined') {
    window.google.accounts.id.disableAutoSelect();
  }
};
