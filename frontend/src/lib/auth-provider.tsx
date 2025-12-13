import { ReactNode } from "react";
import { AuthProvider as OidcAuthProvider } from "react-oidc-context";
import { authConfig } from "./auth-config";

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * AuthProvider wraps the application with OIDC authentication context.
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const onSigninCallback = () => {
        // Remove the code and state from URL after successful login
        window.history.replaceState({}, document.title, window.location.pathname);
    };

    return (
        <OidcAuthProvider {...authConfig} onSigninCallback={onSigninCallback}>
            {children}
        </OidcAuthProvider>
    );
}
