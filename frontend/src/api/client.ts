import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

export function setAuthUserId(userId: string | null) {
  if (userId) {
    client.defaults.headers.common['X-User-ID'] = userId
  } else {
    delete client.defaults.headers.common['X-User-ID']
  }
}

export default client
