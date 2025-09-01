let accessToken: string | null = null;

export const tokenStore = {
    set(token: string | null) { accessToken = token; },
    get() { return accessToken; },
    isAuthed() { return !!accessToken; },
    clear() { accessToken = null; },
};
