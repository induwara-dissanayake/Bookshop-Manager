/**
 * Utility functions for cache management and data fetching
 */

/**
 * Creates a cache-busting URL by adding a timestamp parameter
 */
export function addCacheBuster(url: string): string {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}_t=${Date.now()}`
}

/**
 * Fetches data with cache busting when forceRefresh is true
 */
export async function fetchWithCacheControl(
    url: string,
    options: RequestInit = {},
    forceRefresh = false
): Promise<Response> {
    const finalUrl = forceRefresh ? addCacheBuster(url) : url
    const finalOptions: RequestInit = {
        ...options,
        headers: {
            ...options.headers,
            ...(forceRefresh && { 'Cache-Control': 'no-cache' })
        }
    }

    return fetch(finalUrl, finalOptions)
}

/**
 * Common fetch patterns for the application
 */
export const apiHelpers = {
    /**
     * Fetches data and returns JSON, with cache busting support
     */
    async fetchJson<T>(
        url: string,
        options: RequestInit = {},
        forceRefresh = false
    ): Promise<T> {
        const response = await fetchWithCacheControl(url, options, forceRefresh)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        return response.json()
    },

    /**
     * Performs a POST request with JSON body
     */
    async postJson<T>(url: string, data: any): Promise<T> {
        return this.fetchJson<T>(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
    },

    /**
     * Performs a PUT request with JSON body
     */
    async putJson<T>(url: string, data: any): Promise<T> {
        return this.fetchJson<T>(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
    },

    /**
     * Performs a DELETE request
     */
    async deleteJson<T>(url: string): Promise<T> {
        return this.fetchJson<T>(url, { method: 'DELETE' })
    }
}
