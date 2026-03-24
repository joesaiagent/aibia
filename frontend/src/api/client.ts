import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

export function setAuthUserId(userId: string | null) {
  if (userId) {
    client.defaults.headers.common['X-User-ID'] = userId
  } else {
    delete client.defaults.headers.common['X-User-ID']
  }
}

export function getAuthHeaders(): Record<string, string> {
  const userId = client.defaults.headers.common['X-User-ID']
  return userId ? { 'X-User-ID': String(userId) } : {}
}

export default client
