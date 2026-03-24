import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

type TokenGetter = () => Promise<string | null>
let _getToken: TokenGetter | null = null

export function setTokenGetter(fn: TokenGetter) {
  _getToken = fn
}

// Attach Bearer token to every axios request automatically
client.interceptors.request.use(async (config) => {
  if (_getToken) {
    const token = await _getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  return config
})

// Used by raw fetch() calls (streaming endpoints)
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (_getToken) {
    const token = await _getToken()
    if (token) return { 'Authorization': `Bearer ${token}` }
  }
  return {}
}

export default client
