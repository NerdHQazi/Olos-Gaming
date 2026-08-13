import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_FETCH_TIMEOUT_MS = 15000

// Keep auth lock handling local to this tab/context so gameplay actions do not
// block on Navigator.locks contention across concurrent browser sessions.
const nonBlockingAuthLock = async <T>(
	_name: string,
	_acquireTimeout: number,
	fn: () => Promise<T>
): Promise<T> => fn()

const tracedSupabaseFetch: typeof fetch = async (input, init) => {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
	const method = init?.method || 'GET'
	const startedAt = Date.now()

	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => {
			reject(new Error(`Supabase request timeout after ${SUPABASE_FETCH_TIMEOUT_MS}ms: ${method} ${url}`))
		}, SUPABASE_FETCH_TIMEOUT_MS)
	})

	try {
		const response = (await Promise.race([
			fetch(input, init),
			timeoutPromise,
		])) as Response

		return response
	} catch (error: any) {
		console.error('[SupabaseFetch] error', {
			method,
			url,
			durationMs: Date.now() - startedAt,
			message: error?.message || String(error),
		})
		throw error
	}
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	global: {
		fetch: tracedSupabaseFetch,
	},
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		lock: nonBlockingAuthLock,
	},
})
