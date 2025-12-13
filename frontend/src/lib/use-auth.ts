import { useAuth as useOidcAuth } from "react-oidc-context";

/**
 * User profile from Zitadel ID token
 */
export interface ZitadelUser {
    sub: string;
    email?: string;
    name?: string;
    preferred_username?: string;
    picture?: string;
    [key: string]: unknown;
}

/**
 * Custom auth hook with Kylehub-specific helpers.
 *
 * Provides:
 * - user: The authenticated user's profile
 * - avatar: User's profile picture URL from Zitadel
 * - isAuthenticated: Boolean indicating auth state
 * - isLoading: Boolean indicating loading state
 * - login: Function to trigger login redirect
 * - logout: Function to trigger logout
 * - openSettings: Function to open Zitadel account settings
 * - accessToken: The current access token (for API calls)
 * - hasRole: Function to check if user has a specific role
 */
export function useAuth() {
    const auth = useOidcAuth();
    const authority = import.meta.env.VITE_ZITADEL_AUTHORITY;

    // Extract roles from ID token claims
    const getRoles = (): string[] => {
        const claims = auth.user?.profile;
        if (!claims) return [];

        // Zitadel stores roles in this claim
        const rolesObj = claims["urn:zitadel:iam:org:project:roles"] as
            | Record<string, unknown>
            | undefined;

        if (!rolesObj) return [];
        return Object.keys(rolesObj);
    };

    // Get avatar URL from Zitadel
    const getAvatar = (): string | undefined => {
        const claims = auth.user?.profile;
        if (!claims) return undefined;
        return claims.picture as string | undefined;
    };

    // Check if user has a specific role
    const hasRole = (role: string): boolean => {
        return getRoles().includes(role);
    };

    // Check if user is admin
    const isAdmin = (): boolean => {
        return hasRole("ADMIN");
    };

    // Open Zitadel account settings in new tab
    const openSettings = (): void => {
        window.open(`${authority}/ui/console/users/me`, "_blank");
    };

    // Build a compatible user object
    const user = auth.user?.profile ? {
        id: auth.user.profile.sub,
        sub: auth.user.profile.sub,
        email: auth.user.profile.email as string | undefined,
        name: (auth.user.profile.name || auth.user.profile.preferred_username) as string | undefined,
        username: auth.user.profile.preferred_username as string | undefined,
        role: isAdmin() ? 'admin' as const : 'user' as const,
    } : null;

    return {
        // User info
        user,
        avatar: getAvatar(),
        accessToken: auth.user?.access_token,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        error: auth.error,

        // Auth actions
        login: () => auth.signinRedirect(),
        logout: () =>
            auth.signoutRedirect({
                post_logout_redirect_uri: import.meta.env.VITE_ZITADEL_POST_LOGOUT_URI,
            }),
        openSettings,

        // Role helpers
        roles: getRoles(),
        hasRole,
        isAdmin,
    };
}
